import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { GoogleLogo } from '../components/Brand';
import { Button } from '../components/Button';
import { Banner } from '../components/Feedback';
import { PasswordField, TextField } from '../components/Field';
import { DEMO_CREDENTIALS } from '../api/mock/seed';
import { isMockMode } from '../lib/config';
import { isApiError } from '../lib/http';
import { useToast } from '../components/Feedback';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [params] = useSearchParams();
  const sessionExpired = params.get('sessao') === 'expirada';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Entrar · HerdVision';
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.';
    if (!password) nextErrors.password = 'Informe sua senha.';
    setErrors(nextErrors);
    setBanner(null);
    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/', { replace: true });
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        // Mesma mensagem para e-mail inexistente e senha errada.
        setBanner('Credenciais inválidas. Confira o e-mail e a senha.');
      } else if (isApiError(error) && error.status === 429) {
        setBanner('Muitas tentativas. Aguarde um minuto e tente de novo.');
      } else if (isApiError(error) && error.status === 422) {
        const fields = error.fieldErrors;
        setErrors({ email: fields.email, password: fields.password });
        setBanner(fields.email || fields.password ? null : error.message);
      } else {
        setBanner(error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack-24">
      <div className="stack-8">
        <h1 className="t-display-large">Entrar</h1>
        <p className="t-body-l c-secondary">Acesse o painel do seu rebanho.</p>
      </div>

      {sessionExpired && !banner && <Banner>Sua sessão expirou. Entre novamente.</Banner>}
      {banner && <Banner>{banner}</Banner>}

      <form className="stack-16" onSubmit={handleSubmit} noValidate>
        <TextField
          ref={emailRef}
          label="E-mail"
          type="email"
          icon="mail"
          large
          autoComplete="email"
          inputMode="email"
          placeholder="voce@fazenda.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <PasswordField
          ref={passwordRef}
          label="Senha"
          large
          autoComplete="current-password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        <Button type="submit" block loading={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="auth__divider">ou</p>

      <Button variant="secondary" block onClick={() => toast.info('O login com Google estará disponível em breve.')}>
        <GoogleLogo />
        Entrar com Google
      </Button>

      <p className="auth__switch">
        Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>

      {isMockMode && (
        <Banner kind="info">
          <strong>Modo demonstração.</strong> Administrador: {DEMO_CREDENTIALS.admin.email} · Usuário: {DEMO_CREDENTIALS.user.email} · Senha:{' '}
          {DEMO_CREDENTIALS.admin.password}
        </Banner>
      )}
    </div>
  );
}
