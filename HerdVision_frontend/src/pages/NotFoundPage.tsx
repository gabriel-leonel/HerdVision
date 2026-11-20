import { useEffect } from 'react';
import { ButtonLink } from '../components/Button';
import { EmptyState } from '../components/Feedback';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Página não encontrada · HerdVision';
  }, []);
  return (
    <div className="card">
      <EmptyState
        icon="pin"
        title="Página não encontrada"
        text="O endereço pode ter mudado ou não existe mais."
        actions={
          <ButtonLink to="/" size="page" icon="home">
            Ir para o painel
          </ButtonLink>
        }
      />
    </div>
  );
}
