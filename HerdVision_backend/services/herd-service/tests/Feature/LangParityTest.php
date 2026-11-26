<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class LangParityTest extends TestCase
{
    private const SKIP = ['custom', 'attributes'];

    /**
     * @param  array<string, mixed>  $lines
     * @return array<string, string>
     */
    private function flatten(array $lines, string $prefix = ''): array
    {
        $flat = [];

        foreach ($lines as $key => $value) {
            if ($prefix === '' && in_array($key, self::SKIP, true)) {
                continue;
            }

            is_array($value)
                ? $flat += $this->flatten($value, "{$prefix}{$key}.")
                : $flat["{$prefix}{$key}"] = $value;
        }

        return $flat;
    }

    /**
     * @return array<string, string>
     */
    private function frameworkLines(): array
    {
        return $this->flatten(require base_path('vendor/laravel/framework/src/Illuminate/Translation/lang/en/validation.php'));
    }

    /**
     * @return array<string, string>
     */
    private function ptBrLines(): array
    {
        return $this->flatten(require lang_path('pt_BR/validation.php'));
    }

    /**
     * @return list<string>
     */
    private function placeholders(string $line): array
    {
        preg_match_all('/:[a-z_]+/', $line, $matches);

        return collect($matches[0])->unique()->sort()->values()->all();
    }

    public function test_default_locale_is_pt_br(): void
    {
        $this->assertSame('pt_BR', config('app.locale'));
    }

    public function test_every_framework_validation_message_has_a_pt_br_translation(): void
    {
        $missing = array_diff_key($this->frameworkLines(), $this->ptBrLines());

        $this->assertSame([], array_keys($missing), 'Chaves sem tradução em lang/pt_BR/validation.php');
    }

    public function test_translations_keep_the_same_placeholders_as_the_original(): void
    {
        $pt = $this->ptBrLines();

        foreach ($this->frameworkLines() as $key => $english) {
            $this->assertSame(
                $this->placeholders($english),
                $this->placeholders($pt[$key] ?? ''),
                "Placeholders divergentes em '{$key}'",
            );
        }
    }

    public function test_no_message_was_left_in_english(): void
    {
        foreach ($this->ptBrLines() as $key => $line) {
            $this->assertDoesNotMatchRegularExpression('/\b(The|field|must|is required|has already)\b/', $line, "Possível texto em inglês em '{$key}'");
        }
    }

    public function test_validator_uses_the_translation_and_friendly_attribute_names(): void
    {
        $errors = Validator::make(
            ['email' => 'x', 'per_page' => 1000],
            ['name' => 'required', 'email' => 'email', 'per_page' => 'integer|max:100'],
        )->errors();

        $this->assertSame('O campo nome é obrigatório.', $errors->first('name'));
        $this->assertSame('O campo e-mail deve ser um endereço de e-mail válido.', $errors->first('email'));
        $this->assertSame('O campo itens por página não deve ser maior que 100.', $errors->first('per_page'));
    }

    public function test_summary_of_extra_errors_is_translated_in_singular_and_plural(): void
    {
        $two = ValidationException::withMessages(['a' => ['um'], 'b' => ['dois']]);
        $three = ValidationException::withMessages(['a' => ['um'], 'b' => ['dois'], 'c' => ['três']]);

        $this->assertSame('um (e mais 1 erro)', $two->getMessage());
        $this->assertSame('um (e mais 2 erros)', $three->getMessage());
    }
}
