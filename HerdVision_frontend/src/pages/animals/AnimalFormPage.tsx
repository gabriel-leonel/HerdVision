import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { animalTitle, forgetAnimal } from '../../api/lookups';
import { animalsApi, lotsApi, type AnimalInput } from '../../api/resources';
import type { Animal } from '../../api/types';
import { Button, ButtonLink } from '../../components/Button';
import { PageHeader } from '../../components/Data';
import { Banner, ErrorState, Skeleton, useToast } from '../../components/Feedback';
import { RequiredLegend, SelectField, TextField } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { useAsync } from '../../hooks/useAsync';
import { formatNumber, todayISO } from '../../lib/format';
import { isApiError } from '../../lib/http';
import { ANIMAL_STATUSES, SPECIES } from '../../lib/semantics';

type FieldName = 'identification' | 'name' | 'species' | 'breed' | 'birth_date' | 'lot_id' | 'status';
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

const ORDER: FieldName[] = ['identification', 'name', 'species', 'breed', 'birth_date', 'lot_id', 'status'];

function fromAnimal(a: Animal): Values {
  return {
    identification: a.identification,
    name: a.name ?? '',
    species: a.species,
    breed: a.breed ?? '',
    birth_date: a.birth_date ? a.birth_date.slice(0, 10) : '',
    lot_id: String(a.lot_id ?? ''),
    status: a.status,
  };
}

export function validateAnimal(values: Values, today = todayISO()): Errors {
  const e: Errors = {};
  if (!values.identification.trim()) e.identification = 'Informe a identificação do animal.';
  else if (values.identification.trim().length > 255) e.identification = 'A identificação pode ter no máximo 255 caracteres.';
  if (values.name.length > 255) e.name = 'O nome pode ter no máximo 255 caracteres.';
  if (!values.species) e.species = 'Selecione a espécie.';
  if (values.breed.length > 255) e.breed = 'A raça pode ter no máximo 255 caracteres.';
  if (values.birth_date && values.birth_date > today) e.birth_date = 'A data de nascimento não pode estar no futuro.';
  if (!values.lot_id) e.lot_id = 'Selecione o lote. Todo animal pertence a um lote.';
  if (!values.status) e.status = 'Selecione o status.';
  return e;
}

export function AnimalFormPage() {
  const { id } = useParams();
  const editing = id !== undefined;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const animal = useAsync<Animal | null>(() => (editing ? animalsApi.get(id) : Promise.resolve(null)), [id]);
  const lots = useAsync(() => lotsApi.all(), []);

  const [values, setValues] = useState<Values>({
    identification: '',
    name: '',
    species: 'Bovino',
    breed: '',
    birth_date: '',
    lot_id: params.get('lote') ?? '',
    status: 'ativo',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const refs = useRef<Partial<Record<FieldName, HTMLInputElement | HTMLSelectElement | null>>>({});

  useEffect(() => {
    if (animal.data) setValues(fromAnimal(animal.data));
  }, [animal.data]);

  const title = editing ? (animal.data ? animalTitle(animal.data) : 'Editar animal') : 'Novo animal';
  useEffect(() => {
    document.title = `${title} · HerdVision`;
  }, [title]);

  const set = (field: FieldName) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  function focusFirst(e: Errors) {
    const first = ORDER.find((f) => e[f]);
    if (first) refs.current[first]?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBanner(null);
    const localErrors = validateAnimal(values);
    setErrors(localErrors);
    if (Object.keys(localErrors).length) return focusFirst(localErrors);

    const payload: AnimalInput = {
      identification: values.identification.trim(),
      name: values.name.trim() || null,
      species: values.species,
      breed: values.breed.trim() || null,
      birth_date: values.birth_date || null,
      lot_id: Number(values.lot_id),
      status: values.status,
    };

    setSaving(true);
    try {
      const saved = editing ? await animalsApi.update(id, payload) : await animalsApi.create(payload);
      forgetAnimal(saved.id);
      toast.success(editing ? `${animalTitle(saved)} atualizado.` : `${animalTitle(saved)} cadastrado.`);
      navigate(`/animais/${saved.id}`);
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        const f = error.fieldErrors;
        const mapped: Errors = {};
        for (const key of ORDER) if (f[key]) mapped[key] = f[key];
        setErrors(mapped);
        if (Object.keys(mapped).length === 0) setBanner(error.message);
        focusFirst(mapped);
      } else {
        setBanner(error instanceof Error ? error.message : 'Não foi possível salvar o animal.');
      }
    } finally {
      setSaving(false);
    }
  }

  const breadcrumb = editing
    ? [
        { to: '/animais', label: 'Animais' },
        { to: `/animais/${id}`, label: animal.data ? animalTitle(animal.data) : 'Animal' },
        { to: '#', label: 'Editar' },
      ]
    : [
        { to: '/animais', label: 'Animais' },
        { to: '#', label: 'Novo animal' },
      ];

  if (editing && animal.error) {
    return (
      <>
        <PageHeader breadcrumb={breadcrumb} title="Editar animal" />
        <div className="card">
          <ErrorState error={animal.error} onRetry={animal.reload} backTo={{ to: '/animais', label: 'Voltar para animais' }} unavailableOn404={false} />
        </div>
      </>
    );
  }

  const loadingAnimal = editing && animal.loading;
  // Mantém a espécie atual no select mesmo que não esteja na lista padrão.
  const speciesOptions = values.species && !SPECIES.includes(values.species) ? [values.species, ...SPECIES] : SPECIES;
  const statusOptions =
    values.status && !ANIMAL_STATUSES.some((s) => s.value === values.status)
      ? [{ value: values.status, label: values.status }, ...ANIMAL_STATUSES]
      : ANIMAL_STATUSES;

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumb}
        title={title}
        subtitle={editing ? animal.data?.identification : 'Cadastre o animal com a identificação do brinco ou do SISBOV.'}
      />

      <div className="grid-2">
        <form className="card form-card" onSubmit={handleSubmit} noValidate aria-busy={loadingAnimal}>
          <div className="form-card__body">
            <div className="stack-16" style={{ marginBottom: 24 }}>
              <RequiredLegend />
              {banner && <Banner>{banner}</Banner>}
            </div>

            {loadingAnimal ? (
              <div className="stack-16">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} height={76} />
                ))}
              </div>
            ) : (
              <>
                <fieldset className="fieldset">
                  <legend>Identificação</legend>
                  <div className="form-grid">
                    <TextField
                      ref={(el) => (refs.current.identification = el)}
                      label="Identificação"
                      placeholder="BR00000154"
                      value={values.identification}
                      onChange={set('identification')}
                      error={errors.identification}
                      help="Código único, como o do brinco ou do SISBOV."
                      maxLength={255}
                      autoComplete="off"
                      required
                    />
                    <TextField
                      ref={(el) => (refs.current.name = el)}
                      label="Nome"
                      placeholder="Ex.: Mimosa"
                      value={values.name}
                      onChange={set('name')}
                      error={errors.name}
                      help="Apelido usado no dia a dia."
                      maxLength={255}
                    />
                  </div>
                </fieldset>

                <fieldset className="fieldset">
                  <legend>Características</legend>
                  <div className="form-grid">
                    <SelectField
                      ref={(el) => (refs.current.species = el)}
                      label="Espécie"
                      value={values.species}
                      onChange={set('species')}
                      error={errors.species}
                      required
                    >
                      {speciesOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </SelectField>
                    <TextField
                      ref={(el) => (refs.current.breed = el)}
                      label="Raça"
                      placeholder="Ex.: Nelore"
                      value={values.breed}
                      onChange={set('breed')}
                      error={errors.breed}
                      help="Opcional."
                      maxLength={255}
                    />
                    <TextField
                      ref={(el) => (refs.current.birth_date = el)}
                      label="Data de nascimento"
                      type="date"
                      max={todayISO()}
                      value={values.birth_date}
                      onChange={set('birth_date')}
                      error={errors.birth_date}
                      help="Opcional. Não pode estar no futuro."
                    />
                  </div>
                </fieldset>

                <fieldset className="fieldset">
                  <legend>Manejo</legend>
                  <div className="form-grid">
                    <div className="stack-4">
                      <SelectField
                        ref={(el) => (refs.current.lot_id = el)}
                        label="Lote"
                        value={values.lot_id}
                        onChange={set('lot_id')}
                        error={errors.lot_id ?? (lots.error ? 'Não foi possível carregar os lotes.' : undefined)}
                        help="Todo animal pertence a um lote."
                        disabled={lots.loading}
                        required
                      >
                        <option value="">{lots.loading ? 'Carregando lotes…' : 'Selecione o lote'}</option>
                        {lots.data?.map((lot) => (
                          <option key={lot.id} value={lot.id}>
                            {lot.name} ({formatNumber(lot.animals_count ?? 0)} {lot.animals_count === 1 ? 'animal' : 'animais'})
                          </option>
                        ))}
                      </SelectField>
                      <Link to="/lotes/novo" className="text-action" style={{ paddingLeft: 0 }}>
                        <Icon name="plus" size={16} /> Criar lote
                      </Link>
                    </div>
                    <SelectField
                      ref={(el) => (refs.current.status = el)}
                      label="Status"
                      value={values.status}
                      onChange={set('status')}
                      error={errors.status}
                      required
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                </fieldset>
              </>
            )}
          </div>
          <div className="form-card__footer">
            <ButtonLink to={editing ? `/animais/${id}` : '/animais'} variant="tertiary" size="page">
              Cancelar
            </ButtonLink>
            <Button type="submit" size="page" loading={saving} disabled={loadingAnimal}>
              {editing ? 'Salvar alterações' : 'Salvar animal'}
            </Button>
          </div>
        </form>

        <aside className="stack-24 sticky-side" aria-label="Orientações">
          <section className="card card--padded stack-12">
            <h2 className="t-h3">Depois de salvar</h2>
            <ul className="stack-12" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li className="row" style={{ alignItems: 'flex-start' }}>
                <span className="icon-circle icon-circle--success" style={{ width: 32, height: 32 }}>
                  <Icon name="clipboard" size={16} />
                </span>
                <span className="c-secondary">Associe protocolos de manejo (vacinas, vermífugos, suplementação) no detalhe do animal.</span>
              </li>
              <li className="row" style={{ alignItems: 'flex-start' }}>
                <span className="icon-circle icon-circle--success" style={{ width: 32, height: 32 }}>
                  <Icon name="activity" size={16} />
                </span>
                <span className="c-secondary">Registre leituras de temperatura, atividade e alimentação para acompanhar o histórico.</span>
              </li>
            </ul>
          </section>
          <Banner kind="info">
            A identificação precisa ser <strong>única</strong> no rebanho. Use o número do brinco ou do SISBOV para evitar duplicidade.
          </Banner>
        </aside>
      </div>
    </>
  );
}
