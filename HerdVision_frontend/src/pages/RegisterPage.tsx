import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/Button';
import { Banner, Footnote, useToast } from '../components/Feedback';
import { PasswordField, RequiredLegend, TextField } from '../components/Field';
import { Icon } from '../components/Icon';
import { isApiError } from '../lib/http';

type Fields = 'name' | 'email' | 'password';

export function passwordChecks(password: string) {
  return [
    { label: 'Pelo menos 8 caracteres', met: password.length >= 8 },
    { label: 'Contém letras', met: /[A-Za-zÀ-ÿ]/.test(password) },
    { label: 'Contém números', met: /\d/.test(password) },
  ];
}

export function validateRegister(values: Record<Fields, string>): Partial<Record<Fields, string>> {
  const errors: Partial<Record<Fields, string>> = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Informe seu nome.';
  else if (name.length < 2) errors.name = 'O nome deve ter pelo menos 2 caracteres.';
  else if (name.length > 255) errors.name = 'O nome pode ter no máximo 255 caracteres.';
  const email = values.email.trim();
  if (!email) errors.email = 'Informe seu e-mail.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Informe um e-mail válido.';
  if (!passwordChecks(values.password).every((c) => c.met)) errors.password = 'A senha precisa ter pelo menos 8 caracteres, com letras e números.';
  return errors;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [values, setValues] = useState<Record<Fields, string>>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    document.title = 'Criar conta · HerdVision';
  }, []);

  const set = (field: Fields) => (e: ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  function focusFirst(errs: Partial<Record<Fields, string>>) {
    const first = (['name', 'email', 'password'] as Fields[]).find((f) => errs[f]);
    if (first) refs[first].current?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBanner(null);
    const localErrors = validateRegister(values);
    setErrors(localErrors);
    if (Object.keys(localErrors).length) return focusFirst(localErrors);

    setSubmitting(true);
    try {
      await register(values.name.trim(), values.email.trim(), values.password);
      toast.success('Conta criada. Bem-vindo à HerdVision!');
      navigate('/', { replace: true });
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        const fields = error.fieldErrors;
        const mapped: Partial<Record<Fields, string>> = { name: fields.name, email: fields.email, password: fields.password };
        setErrors(mapped);
        if (!mapped.name && !mapped.email && !mapped.password) setBanner(error.message);
        focusFirst(mapped);
      } else if (isApiError(error) && error.status === 429) {
        setBanner('Muitas tentativas. Aguarde um minuto e tente de novo.');
      } else {
        setBanner(error instanceof Error ? error.message : 'Não foi possível criar a conta.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const checks = passwordChecks(values.password);

  return (
    <div className="stack-24">
      <div className="stack-8">
        <Link to="/login" className="text-action" style={{ minHeight: 32, padding: 0 }}>
          <Icon name="chevL" size={16} />
          Voltar para entrar
        </Link>
        <h1 className="t-display-large">Criar conta</h1>
        <p className="t-body-l c-secondary">Comece a acompanhar seu rebanho em poucos minutos.</p>
      </div>

      {banner && <Banner>{banner}</Banner>}

      <form className="stack-16" onSubmit={handleSubmit} noValidate>
        <RequiredLegend />
        <TextField
          ref={refs.name}
          label="Nome"
          large
          autoComplete="name"
          placeholder="Seu nome completo"
          value={values.name}
          onChange={set('name')}
          error={errors.name}
          maxLength={255}
          required
        />
        <TextField
          ref={refs.email}
          label="E-mail"
          type="email"
          icon="mail"
          large
          autoComplete="email"
          inputMode="email"
          placeholder="voce@fazenda.com.br"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <div className="stack-8">
          <PasswordField
            ref={refs.password}
            label="Senha"
            large
            autoComplete="new-password"
            placeholder="Crie uma senha"
            value={values.password}
            onChange={set('password')}
            error={errors.password}
            required
          />
          <ul className="requirements" aria-label="Requisitos da senha">
            {checks.map((c) => (
              <li key={c.label} data-met={c.met}>
                <Icon name="check" size={14} />
                {c.label}
                <span className="sr-only">{c.met ? ' (atendido)' : ' (pendente)'}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button type="submit" block loading={submitting}>
          {submitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <Footnote icon="shield">
        Novas contas entram com o perfil Usuário. O perfil Administrador é atribuído pela equipe responsável.
      </Footnote>

      <p className="auth__switch">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
