<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Na Release 2 os níveis foram criados como texto, mas o frontend envia
     * índices numéricos de 0 a 100 e a regra de alertas compara números.
     */
    public function up(): void
    {
        Schema::table('monitoring_readings', function (Blueprint $table) {
            $table->decimal('activity_level', 5, 2)->nullable()->change();
            $table->decimal('feeding_level', 5, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('monitoring_readings', function (Blueprint $table) {
            $table->string('activity_level')->nullable()->change();
            $table->string('feeding_level')->nullable()->change();
        });
    }
};
