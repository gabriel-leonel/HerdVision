<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monitoring_readings', function (Blueprint $table) {
            $table->id();

            // ID do animal no Herd Service. NÃO é chave estrangeira: cada
            // microsserviço tem seu próprio banco SQLite.
            $table->unsignedBigInteger('animal_id');

            $table->decimal('temperature', 5, 2)->nullable();
            $table->string('activity_level')->nullable();
            $table->string('feeding_level')->nullable();
            $table->dateTime('recorded_at');
            $table->timestamps();

            // Histórico de um animal em ordem cronológica.
            $table->index(['animal_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monitoring_readings');
    }
};
