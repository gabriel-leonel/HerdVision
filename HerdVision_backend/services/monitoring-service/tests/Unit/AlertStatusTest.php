<?php

namespace Tests\Unit;

use App\Enums\AlertStatus;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class AlertStatusTest extends TestCase
{
    /**
     * Todos os 9 pares (de, para). Só dois avanços são válidos.
     *
     * @return array<string, array{AlertStatus, AlertStatus, bool}>
     */
    public static function pairs(): array
    {
        $valid = [
            'Pendente>Em análise' => true,
            'Em análise>Resolvido' => true,
        ];

        $pairs = [];
        foreach (AlertStatus::cases() as $from) {
            foreach (AlertStatus::cases() as $to) {
                $key = "{$from->value}>{$to->value}";
                $pairs[$key] = [$from, $to, $valid[$key] ?? false];
            }
        }

        return $pairs;
    }

    #[DataProvider('pairs')]
    public function test_can_transition_to(AlertStatus $from, AlertStatus $to, bool $expected): void
    {
        $this->assertSame($expected, $from->canTransitionTo($to));
    }

    public function test_next_follows_the_flow(): void
    {
        $this->assertSame(AlertStatus::InReview, AlertStatus::Pending->next());
        $this->assertSame(AlertStatus::Resolved, AlertStatus::InReview->next());
        $this->assertNull(AlertStatus::Resolved->next());
    }

    public function test_only_resolved_alerts_can_be_reopened(): void
    {
        $this->assertTrue(AlertStatus::Resolved->canReopen());
        $this->assertFalse(AlertStatus::Pending->canReopen());
        $this->assertFalse(AlertStatus::InReview->canReopen());
    }
}
