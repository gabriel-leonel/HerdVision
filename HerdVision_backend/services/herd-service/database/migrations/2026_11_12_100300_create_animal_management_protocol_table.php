<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Relacionamento N:N entre animais e protocolos. Tem id próprio (e não
        // chave composta) para permitir o mesmo protocolo aplicado várias vezes
        // ao mesmo animal, mantendo o histórico (ex.: vacina em maio e novembro).
        Schema::create('animal_management_protocol', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_id')->constrained('animals')->cascadeOnDelete();
            $table->foreignId('management_protocol_id')->constrained('management_protocols')->restrictOnDelete();
            $table->date('start_date');
            $table->string('status');
            $table->timestamps();

            $table->index(['animal_id', 'management_protocol_id'], 'animal_protocol_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animal_management_protocol');
    }
};
