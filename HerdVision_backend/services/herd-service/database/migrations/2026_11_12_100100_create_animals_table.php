<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('animals', function (Blueprint $table) {
            $table->id();
            $table->string('identification')->unique();
            $table->string('name')->nullable();
            $table->string('species');
            $table->string('breed')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('status')->index();

            // Todo animal pertence a um lote (1:N). A exclusão de um lote com
            // animais é bloqueada também no banco, além do 409 da API.
            $table->foreignId('lot_id')->constrained('lots')->restrictOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animals');
    }
};
