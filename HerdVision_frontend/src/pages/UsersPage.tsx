import { useEffect } from 'react';
import { usersApi } from '../api/resources';
import type { Role } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/Button';
import { ChipGroup, KpiCard, PageHeader, TableFooter } from '../components/Data';
import { EmptyState, ErrorState, Footnote, SkeletonRows } from '../components/Feedback';
import { SearchField } from '../components/Field';
import { RolePill } from '../components/Status';
import { useAsync, useQueryState } from '../hooks/useAsync';
import { useSearchInput } from '../hooks/useSearchInput';
import { formatDate, formatNumber, initials, plural } from '../lib/format';

export function UsersPage() {
  const { isAdmin } = useAuth();

  useEffect(() => {
    document.title = 'Usuários · HerdVision';
  }, []);

  // O menu já esconde o item; este estado cobre o acesso direto pela URL.
  if (!isAdmin) {
    return (
      <>
        <PageHeader overline="Somente administradores" overlineIcon="lock" title="Usuários" />
        <div className="card">
          <EmptyState icon="lock" title="Acesso restrito" text="Você não tem permissão para acessar este recurso." />
        </div>
      </>
    );
  }
  return <UsersContent />;
}

function UsersContent() {
  const [query, setQuery] = useQueryState({ busca: '', perfil: '', pagina: '1' });
  const [search, setSearch] = useSearchInput(query.busca, (busca) => setQuery({ busca }));

  const totals = useAsync(async () => {
    const [admins, users] = await Promise.all([
      usersApi.list({ role: 'admin', per_page: 1 }).then((p) => p.meta.total),
      usersApi.list({ role: 'user', per_page: 1 }).then((p) => p.meta.total),
    ]);
    return { admins, users };
  }, []);

  const list = useAsync(
    () => usersApi.list({ search: query.busca, role: query.perfil as Role | '', page: Number(query.pagina), per_page: 15 }),
    [query.busca, query.perfil, query.pagina],
  );

  const meta = list.data?.meta;
  const users = list.data?.data ?? [];
  const filtering = !!(query.busca || query.perfil);

  return (
    <>
      <PageHeader
        overline="Somente administradores"
        overlineIcon="lock"
        title="Usuários"
        subtitle={totals.data ? plural(totals.data.admins + totals.data.users, 'conta cadastrada', 'contas cadastradas') : 'Consulte as contas e os perfis de acesso.'}
      />

      <div className="stack-24">
        {!totals.error && (
          <div className="kpi-grid">
            <KpiCard label="Administradores" icon="shield" loading={totals.loading} value={formatNumber(totals.data?.admins ?? 0)} />
            <KpiCard label="Usuários" icon="user" loading={totals.loading} value={formatNumber(totals.data?.users ?? 0)} />
          </div>
        )}

        <div className="filter-bar" role="search">
          <SearchField
            label="Buscar usuário"
            placeholder="Nome ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fieldClassName="filter-bar__search"
          />
          <div className="filter-bar__chips">
            <ChipGroup
              label="Perfil"
              value={query.perfil}
              onChange={(perfil) => setQuery({ perfil })}
              options={[
                { value: '', label: 'Todos' },
                { value: 'admin', label: 'Administradores', count: totals.data?.admins },
                { value: 'user', label: 'Usuários', count: totals.data?.users },
              ]}
            />
          </div>
        </div>

        <div className="card table-card">
          {list.loading && !list.data ? (
            <div style={{ padding: 16 }}>
              <SkeletonRows rows={6} />
            </div>
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : users.length === 0 ? (
            <EmptyState
              title={query.busca ? `Nenhum resultado para "${query.busca}"` : 'Nenhum usuário encontrado'}
              actions={
                filtering && (
                  <Button variant="tertiary" size="page" onClick={() => setQuery({ busca: '', perfil: '' })}>
                    Limpar filtros
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="table-scroll" aria-busy={list.loading}>
                <table className="table">
                  <caption className="sr-only">Lista de usuários</caption>
                  <thead>
                    <tr>
                      <th scope="col">Nome</th>
                      <th scope="col">E-mail</th>
                      <th scope="col">Perfil</th>
                      <th scope="col">Cadastrado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="table__primary">
                            <span className="avatar" aria-hidden="true">
                              {initials(u.name)}
                            </span>
                            <span className="table__primary-title">{u.name}</span>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <RolePill role={u.role} />
                        </td>
                        <td>{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && <TableFooter meta={meta} onPage={(p) => setQuery({ pagina: String(p) }, { keepPage: true })} />}
            </>
          )}
        </div>

        <Footnote icon="shield">
          Novas contas entram com o perfil Usuário. Quem não é administrador recebe a mensagem "Você não tem permissão para acessar este recurso." ao
          tentar abrir esta tela. A alteração de perfil ficará disponível quando o backend oferecer a rota correspondente.
        </Footnote>
      </div>
    </>
  );
}
