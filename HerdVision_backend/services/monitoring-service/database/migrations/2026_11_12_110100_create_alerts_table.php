<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();

            // ID do animal no Herd Service (sem chave estrangeira física).
            $table->unsignedBigInteger('animal_id')->index();

            // Leitura de origem, quando houver. Esta sim é FK: mesmo banco.
            // Se a leitura for apagada, o alerta é preservado.
            $table->foreignId('monitoring_reading_id')
                ->nullable()
                ->constrained('monitoring_readings')
                ->nullOnDelete();

            $table->string('type');
            $table->text('description');
            $table->string('severity');
            $table->string('status')->default('Pendente')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
