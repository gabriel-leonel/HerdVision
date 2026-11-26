<?php

namespace Tests\Feature\Alerts;

use App\Enums\AlertStatus;
use App\Models\Alert;
use App\Services\AlertWorkflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * RN01 — fluxo de tratamento de alertas pela API, com histórico.
 */
class AlertWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function alert(AlertStatus $status = AlertStatus::Pending, array $attributes = []): Alert
    {
        $alert = app(AlertWorkflow::class)->open(array_merge([
            'animal_id' => 7, 'type' => 'temperatura', 'description' => 'Temperatura de 40,2 °C', 'severity' => 'alta',
        ], $attributes));

        if ($status !== AlertStatus::Pending) {
            // Ajuste direto para preparar o cenário (fora do fluxo de propósito).
            $alert->status = $status;
            $alert->save();
        }

        return $alert;
    }

    // ------------------------------------------------------------- transições

    public function test_full_flow_pending_to_review_to_resolved(): void
    {
        $alert = $this->alert();

        $this->asUser()->patchJson("/api/alerts/{$alert->id}/status", ['status' => 'Em análise'])
            ->assertOk()->assertJsonPath('data.status', 'Em análise');
        $this->asAdmin()->patchJson("/api/alerts/{$alert->id}/status", ['status' => 'Resolvido'])
            ->assertOk()->assertJsonPath('data.status', 'Resolvido');

        $this->assertDatabaseHas('alerts', ['id' => $alert->id, 'status' => 'Resolvido']);
    }

    /**
     * @return array<string, array{AlertStatus, string}>
     */
    public static function invalidTransitions(): array
    {
        return [
            'pular etapa (Pendente -> Resolvido)' => [AlertStatus::Pending, 'Resolvido'],
            'repetir (Pendente -> Pendente)' => [AlertStatus::Pending, 'Pendente'],
            'voltar (Em análise -> Pendente)' => [AlertStatus::InReview, 'Pendente'],
            'repetir (Em análise -> Em análise)' => [AlertStatus::InReview, 'Em análise'],
            'voltar (Resolvido -> Em análise)' => [AlertStatus::Resolved, 'Em análise'],
            'reabrir pelo PATCH (Resolvido -> Pendente)' => [AlertStatus::Resolved, 'Pendente'],
            'repetir (Resolvido -> Resolvido)' => [AlertStatus::Resolved, 'Resolvido'],
        ];
    }

    #[DataProvider('invalidTransitions')]
    public function test_invalid_transition_is_rejected_with_422(AlertStatus $from, string $to): void
    {
        $alert = $this->alert($from);

        $this->asUser()->patchJson("/api/alerts/{$alert->id}/status", ['status' => $to])
            ->assertUnprocessable()
            ->assertJsonPath('errors.status.0', "Transição de status inválida: de \"{$from->value}\" para \"{$to}\".");

        $this->assertSame($from, $alert->fresh()->status);
        $this->assertSame(1, $alert->history()->count());
    }

    public function test_unknown_status_is_rejected(): void
    {
        $alert = $this->alert();

        $this->asUser()->patchJson("/api/alerts/{$alert->id}/status", ['status' => 'Arquivado'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->asUser()->patchJson("/api/alerts/{$alert->id}/status", [])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_status_change_on_missing_alert_returns_404(): void
    {
        $this->asUser()->patchJson('/api/alerts/9999/status', ['status' => 'Em análise'])->assertNotFound();
        $this->asUser()->postJson('/api/alerts/9999/reopen')->assertNotFound();
    }

    // -------------------------------------------------------------- reabertura

    public function test_resolved_alert_can_be_reopened(): void
    {
        $alert = $this->alert(AlertStatus::Resolved);

        $this->asUser()->postJson("/api/alerts/{$alert->id}/reopen")
            ->assertOk()
            ->assertJsonPath('data.status', 'Pendente');

        // E o ciclo recomeça normalmente.
        $this->asUser()->patchJson("/api/alerts/{$alert->id}/status", ['status' => 'Em análise'])->assertOk();
    }

    public function test_only_resolved_alerts_can_be_reopened(): void
    {
        foreach ([AlertStatus::Pending, AlertStatus::InReview] as $status) {
            $alert = $this->alert($status);

            $this->asUser()->postJson("/api/alerts/{$alert->id}/reopen")
                ->assertUnprocessable()
                ->assertJsonPath('errors.status.0', "Apenas alertas resolvidos podem ser reabertos (status atual: \"{$status->value}\").");

            $this->assertSame($status, $alert->fresh()->status);
        }
    }

    // ---------------------------------------------------------------- histórico

    public function test_history_records_who_changed_from_what_to_what_and_when(): void
    {
        $alert = $this->alert();

        $this->withToken($this->tokenFor(['sub' => '5', 'name' => 'Ana', 'role' => 'user']))
            ->patchJson("/api/alerts/{$alert->id}/status", ['status' => 'Em análise'])->assertOk();
        $this->withToken($this->tokenFor(['sub' => '1', 'name' => 'Admin', 'role' => 'admin']))
            ->patchJson("/api/alerts/{$alert->id}/status", ['status' => 'Resolvido'])->assertOk();
        $this->withToken($this->tokenFor(['sub' => '5', 'name' => 'Ana', 'role' => 'user']))
            ->postJson("/api/alerts/{$alert->id}/reopen")->assertOk();

        $response = $this->asUser()->getJson("/api/alerts/{$alert->id}")->assertOk();

        $history = collect($response->json('data.history'))->map(fn ($h) => [$h['from'], $h['to'], $h['user_name']])->all();
        $this->assertSame([
            [null, 'Pendente', null],
            ['Pendente', 'Em análise', 'Ana'],
            ['Em análise', 'Resolvido', 'Admin'],
            ['Resolvido', 'Pendente', 'Ana'],
        ], $history);
        $this->assertNotNull($response->json('data.history.3.changed_at'));

        $this->assertDatabaseHas('alert_status_changes', ['alert_id' => $alert->id, 'to_status' => 'Resolvido', 'user_id' => 1, 'user_name' => 'Admin']);
        $this->assertDatabaseHas('alert_status_changes', ['alert_id' => $alert->id, 'to_status' => 'Em análise', 'user_id' => 5]);
    }

    public function test_transition_response_includes_the_updated_history(): void
    {
        $alert = $this->alert();

        $this->asUser()->patchJson("/api/alerts/{$alert->id}/status", ['status' => 'Em análise'])
            ->assertOk()
            ->assertJsonCount(2, 'data.history')
            ->assertJsonPath('data.history.1.user_name', 'Maria');
    }

    // ----------------------------------------------------------------- listagem

    public function test_list_filters_by_status_severity_animal_and_search(): void
    {
        $this->alert(AlertStatus::Pending, ['animal_id' => 1, 'type' => 'temperatura', 'severity' => 'alta', 'description' => 'Temperatura de 40,2 °C']);
        $this->alert(AlertStatus::InReview, ['animal_id' => 1, 'type' => 'atividade', 'severity' => 'média', 'description' => 'Índice de atividade em 30']);
        $this->alert(AlertStatus::Resolved, ['animal_id' => 2, 'type' => 'alimentação', 'severity' => 'média', 'description' => 'Vale observar o cocho']);

        $this->asUser()->getJson('/api/alerts')->assertOk()->assertJsonPath('meta.total', 3);
        $this->asUser()->getJson('/api/alerts?status=Pendente')->assertOk()->assertJsonPath('meta.total', 1);
        $this->asUser()->getJson('/api/alerts?status=Em%20an%C3%A1lise')->assertOk()->assertJsonPath('meta.total', 1);
        $this->asUser()->getJson('/api/alerts?severity=m%C3%A9dia')->assertOk()->assertJsonPath('meta.total', 2);
        $this->asUser()->getJson('/api/alerts?animal_id=1')->assertOk()->assertJsonPath('meta.total', 2);
        $this->asUser()->getJson('/api/alerts?search=cocho')->assertOk()->assertJsonPath('meta.total', 1);
        $this->asUser()->getJson('/api/alerts?search=atividade')->assertOk()->assertJsonPath('meta.total', 1);
        $this->asUser()->getJson('/api/alerts?per_page=1')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 3);
        $this->asUser()->getJson('/api/alerts?per_page=0')->assertUnprocessable()->assertJsonValidationErrors('per_page');
    }

    public function test_list_is_newest_first_and_does_not_load_history(): void
    {
        $old = $this->alert();
        $old->created_at = now()->subDay();
        $old->save();
        $new = $this->alert();

        $this->asUser()->getJson('/api/alerts')
            ->assertOk()
            ->assertJsonPath('data.0.id', $new->id)
            ->assertJsonPath('data.1.id', $old->id)
            ->assertJsonMissingPath('data.0.history');
    }

    public function test_alerts_cannot_be_created_edited_or_deleted_manually(): void
    {
        $alert = $this->alert();

        $this->asAdmin()->postJson('/api/alerts', ['animal_id' => 1])->assertStatus(405);
        $this->asAdmin()->patchJson("/api/alerts/{$alert->id}", ['status' => 'Resolvido'])->assertStatus(405);
        $this->asAdmin()->deleteJson("/api/alerts/{$alert->id}")->assertStatus(405);
    }
}
