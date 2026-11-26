<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Histórico de status do alerta (RN01): quem mudou, de qual status para
     * qual e quando. O usuário é guardado como ID lógico do auth-service (sem
     * FK entre bancos) e com o nome, para exibição.
     */
    public function up(): void
    {
        Schema::create('alert_status_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_id')->constrained('alerts')->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['alert_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_status_changes');
    }
};
