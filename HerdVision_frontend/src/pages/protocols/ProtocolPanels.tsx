import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { animalTitle } from '../../api/lookups';
import { animalProtocolsApi, animalsApi, protocolsApi } from '../../api/resources';
import type { Animal, AnimalProtocol, Protocol } from '../../api/types';
import { Button, IconButton } from '../../components/Button';
import { SectionHeader } from '../../components/Data';
import { Banner, ErrorState, SkeletonRows, useToast } from '../../components/Feedback';
import { FieldShell, RequiredLegend, SelectField, Switch, TextAreaField, TextField } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { AssociationBadge } from '../../components/Status';
import { useAsync, useDebouncedValue } from '../../hooks/useAsync';
import { animalNumber, formatDate, todayISO } from '../../lib/format';
import { isApiError } from '../../lib/http';
import { PROTOCOL_TYPES } from '../../lib/semantics';

// ---------------- Formulário do protocolo ----------------
interface ProtocolFormProps {
  protocol: Protocol | null;
  onCancel: () => void;
  onSaved: (protocol: Protocol, created: boolean) => void;
}

type Errors = Partial<Record<'name' | 'type' | 'description', string>>;

export function ProtocolForm({ protocol, onCancel, onSaved }: ProtocolFormProps) {
  const [name, setName] = useState(protocol?.name ?? '');
  const [type, setType] = useState(protocol?.type ?? '');
  const [active, setActive] = useState(protocol?.active ?? true);
  const [description, setDescription] = useState(protocol?.description ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBanner(null);
    const e: Errors = {};
    if (!name.trim()) e.name = 'Informe o nome do protocolo.';
    else if (name.trim().length > 255) e.name = 'O nome pode ter no máximo 255 caracteres.';
    if (!type) e.type = 'Selecione o tipo.';
    if (description.length > 5000) e.description = 'A descrição pode ter no máximo 5.000 caracteres.';
    setErrors(e);
    if (e.name) return nameRef.current?.focus();
    if (e.type) return typeRef.current?.focus();
    if (e.description) return;

    const payload = { name: name.trim(), type, active, description: description.trim() || null };
    setSaving(true);
    try {
      const saved = protocol ? await protocolsApi.update(protocol.id, payload) : await protocolsApi.create(payload);
      onSaved(saved, !protocol);
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        const f = error.fieldErrors;
        setErrors({ name: f.name, type: f.type, description: f.description });
        if (!f.name && !f.type && !f.description) setBanner(error.message);
      } else {
        setBanner(error instanceof Error ? error.message : 'Não foi possível salvar o protocolo.');
      }
    } finally {
      setSaving(false);
    }
  }

  const typeOptions = type && !PROTOCOL_TYPES.some((t) => t.value === type) ? [{ value: type, label: type }, ...PROTOCOL_TYPES] : PROTOCOL_TYPES;

  return (
    <form onSubmit={submit} noValidate>
      <div className="side-panel__header">
        <h2 className="t-h2">{protocol ? 'Editar protocolo' : 'Novo protocolo'}</h2>
        <IconButton icon="x" label="Fechar painel" onClick={onCancel} />
      </div>
      <div className="form-stack">
        <RequiredLegend />
        {banner && <Banner>{banner}</Banner>}
        <TextField
          ref={nameRef}
          label="Nome"
          placeholder="Ex.: Vacinação contra febre aftosa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          maxLength={255}
          required
        />
        <SelectField ref={typeRef} label="Tipo" value={type} onChange={(e) => setType(e.target.value)} error={errors.type} required>
          <option value="">Selecione o tipo</option>
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </SelectField>
        <div className="field">
          <span className="field__label">Situação</span>
          <Switch checked={active} onChange={setActive} label="Protocolo ativo" />
          <p className="field__help">Protocolos inativos continuam no histórico, mas não podem ser associados a novos animais.</p>
        </div>
        <TextAreaField
          label="Descrição"
          placeholder="Orientações, doses, periodicidade…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          maxChars={5000}
          rows={4}
        />
      </div>
      <div className="side-panel__footer">
        <Button variant="tertiary" size="page" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" size="page" loading={saving}>
          Salvar
        </Button>
      </div>
    </form>
  );
}

// ---------------- Animais com este protocolo ----------------
interface ProtocolAnimalsProps {
  protocol: Protocol;
  onChanged: () => void;
}

export function ProtocolAnimals({ protocol, onChanged }: ProtocolAnimalsProps) {
  const toast = useToast();
  const listId = useId();
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState<Animal | null>(null);
  const [startDate, setStartDate] = useState(todayISO());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const debounced = useDebouncedValue(term, 300);

  const links = useAsync(() => animalProtocolsApi.list({ management_protocol_id: protocol.id }), [protocol.id]);
  const suggestions = useAsync(
    () => (debounced.trim().length >= 1 && !selected ? animalsApi.list({ search: debounced.trim(), per_page: 8 }).then((p) => p.data) : Promise.resolve([])),
    [debounced, selected],
  );

  useEffect(() => {
    setTerm('');
    setSelected(null);
    setError(null);
  }, [protocol.id]);

  async function associate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!selected) return setError('Busque e selecione um animal.');
    if (!startDate) return setError('Informe a data de início.');
    setSaving(true);
    try {
      await animalProtocolsApi.create({ animal_id: selected.id, management_protocol_id: protocol.id, start_date: startDate, status: 'em andamento' });
      toast.success(`${animalTitle(selected)} associado a ${protocol.name}.`);
      setSelected(null);
      setTerm('');
      links.reload();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível associar.');
    } finally {
      setSaving(false);
    }
  }

  async function unlink(item: AnimalProtocol) {
    try {
      await animalProtocolsApi.remove(item.id);
      toast.success('Associação removida.');
      links.reload();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a associação.');
    }
  }

  const items = links.data?.data ?? [];

  return (
    <section className="section-container stack-16" aria-labelledby={`${listId}-title`}>
      <SectionHeader as="h3" id={`${listId}-title`} title="Animais com este protocolo" />

      {protocol.active ? (
        <form className="stack-12" onSubmit={associate} noValidate>
          <FieldShell id={`${listId}-search`} label="Animal" error={error}>
            <div className="field__control">
              <span className="field__icon">
                <Icon name="search" size={20} />
              </span>
              <input
                id={`${listId}-search`}
                className="input input--with-icon"
                placeholder="Buscar por identificação ou nome"
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions && (suggestions.data?.length ?? 0) > 0}
                aria-controls={`${listId}-suggestions`}
                aria-autocomplete="list"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${listId}-search-error` : undefined}
                value={selected ? `${animalTitle(selected)} · ${selected.identification}` : term}
                onChange={(e) => {
                  setSelected(null);
                  setTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
              />
              {showSuggestions && !selected && (suggestions.data?.length ?? 0) > 0 && (
                <ul className="suggestions" id={`${listId}-suggestions`} role="listbox">
                  {suggestions.data!.map((animal) => (
                    <li key={animal.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelected(animal);
                          setShowSuggestions(false);
                          setError(null);
                        }}
                      >
                        <span className="id-tile id-tile--sm id-tile--unknown" style={{ width: 32, height: 32, fontSize: 13 }} aria-hidden="true">
                          {animalNumber(animal.identification)}
                        </span>
                        <span>
                          <strong>{animalTitle(animal)}</strong>
                          <span className="c-muted t-body-s" style={{ display: 'block' }}>
                            {animal.identification}
                            {animal.lot?.name ? ` · ${animal.lot.name}` : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </FieldShell>
          <div className="row-wrap" style={{ alignItems: 'flex-end' }}>
            <TextField label="Data de início" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} fieldClassName="spacer" />
            <Button type="submit" variant="tonal" icon="link" loading={saving}>
              Associar
            </Button>
          </div>
        </form>
      ) : (
        <Banner kind="info">Protocolo inativo. Ative-o para associar a novos animais.</Banner>
      )}

      {links.loading && !links.data ? (
        <SkeletonRows rows={3} height={56} />
      ) : links.error ? (
        <div className="card">
          <ErrorState error={links.error} onRetry={links.reload} unavailableOn404 />
        </div>
      ) : items.length === 0 ? (
        <p className="c-secondary">Nenhum animal associado a este protocolo.</p>
      ) : (
        <ul className="stack-8" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((item) => (
            <li key={item.id} className="card" style={{ padding: '10px 8px 10px 14px', boxShadow: 'none' }}>
              <div className="row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/animais/${item.animal_id}`} className="table__primary-title">
                    {item.animal ? animalTitle(item.animal) : `Animal #${item.animal_id}`}
                  </Link>
                  <p className="t-body-s c-muted">
                    {item.animal?.identification ? `${item.animal.identification} · ` : ''}Início {formatDate(item.start_date)}
                  </p>
                </div>
                <AssociationBadge status={item.status} />
                <IconButton icon="x" danger label={`Remover associação de ${item.animal ? animalTitle(item.animal) : 'animal'}`} onClick={() => void unlink(item)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
