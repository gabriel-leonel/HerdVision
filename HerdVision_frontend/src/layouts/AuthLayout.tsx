import type { ReactNode } from 'react';
import { Logo, Orbits } from '../components/Brand';

interface AuthLayoutProps {
  tagline: string;
  support: string;
  children: ReactNode;
}

/** Login e Cadastro: painel de marca (forest 900 + órbitas) e formulário de até 420 px (§7.1). */
export function AuthLayout({ tagline, support, children }: AuthLayoutProps) {
  return (
    <div className="auth">
      <section className="auth__brand" aria-label="HerdVision">
        <Logo variant="reverse" symbolSize={44} wordSize={26} />
        <div className="auth__brand-text">
          <p className="t-overline auth__overline">Pecuária de precisão</p>
          <p className="t-display-hero auth__brand-title">{tagline}</p>
          <p className="auth__brand-sub">{support}</p>
        </div>
        <Orbits className="auth__orbits" />
      </section>
      <main className="auth__form-side">
        <div className="auth__form">{children}</div>
      </main>
    </div>
  );
}
