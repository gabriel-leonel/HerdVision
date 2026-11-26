import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Icon, type IconName } from './Icon';
import { formatNumber } from '../lib/format';

interface FieldShellProps {
  id: string;
  label: ReactNode;
  required?: boolean;
  help?: ReactNode;
  error?: string | null;
  counter?: ReactNode;
  large?: boolean;
  hideLabel?: boolean;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ id, label, required, help, error, counter, large, hideLabel, children, className }: FieldShellProps) {
  return (
    <div className={['field', large ? 'field--large' : '', className ?? ''].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'field__label'}>
        {label}
        {required && (
          <span className="req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {(help || error || counter) && (
        <div className="field__help-row">
          {error ? (
            <p className="field__error" id={`${id}-error`}>
              <Icon name="warn" size={14} />
              <span>{error}</span>
            </p>
          ) : help ? (
            <p className="field__help" id={`${id}-help`}>
              {help}
            </p>
          ) : (
            <span />
          )}
          {counter}
        </div>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string | null, help?: ReactNode) {
  if (error) return `${id}-error`;
  if (help) return `${id}-help`;
  return undefined;
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: ReactNode;
  help?: ReactNode;
  error?: string | null;
  icon?: IconName;
  large?: boolean;
  hideLabel?: boolean;
  fieldClassName?: string;
  id?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, help, error, icon, large, hideLabel, fieldClassName, id: idProp, required, className, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} required={required} help={help} error={error} large={large} hideLabel={hideLabel} className={fieldClassName}>
      <div className="field__control">
        {icon && (
          <span className="field__icon">
            <Icon name={icon} size={20} />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={['input', icon ? 'input--with-icon' : '', className ?? ''].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, help)}
          aria-required={required || undefined}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, TextFieldProps>(function PasswordField(
  { label, help, error, large, id: idProp, required, fieldClassName, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={id} label={label} required={required} help={help} error={error} large={large} className={fieldClassName}>
      <div className="field__control">
        <span className="field__icon">
          <Icon name="lock" size={20} />
        </span>
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          className="input input--with-icon input--password"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, help)}
          aria-required={required || undefined}
          {...rest}
        />
        <button
          type="button"
          className="field__trailing"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          title={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={20} />
        </button>
      </div>
    </FieldShell>
  );
});

export function SearchField({
  label = 'Buscar',
  ...rest
}: Omit<TextFieldProps, 'label' | 'icon' | 'type'> & { label?: ReactNode }) {
  return <TextField label={label} icon="search" type="search" autoComplete="off" {...rest} />;
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: ReactNode;
  help?: ReactNode;
  error?: string | null;
  hideLabel?: boolean;
  fieldClassName?: string;
  id?: string;
  children: ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, help, error, hideLabel, fieldClassName, id: idProp, required, children, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} required={required} help={help} error={error} hideLabel={hideLabel} className={fieldClassName}>
      <select
        ref={ref}
        id={id}
        className="select"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, help)}
        aria-required={required || undefined}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: ReactNode;
  help?: ReactNode;
  error?: string | null;
  maxChars?: number;
  fieldClassName?: string;
  id?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, help, error, maxChars, fieldClassName, id: idProp, required, value, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const length = typeof value === 'string' ? value.length : 0;
  const counter =
    maxChars !== undefined ? (
      <span className={['field__counter', length > maxChars ? 'field__counter--over' : ''].join(' ')} aria-live="polite">
        {formatNumber(length)} / {formatNumber(maxChars)}
      </span>
    ) : undefined;
  return (
    <FieldShell id={id} label={label} required={required} help={help} error={error} counter={counter} className={fieldClassName}>
      <textarea
        ref={ref}
        id={id}
        className="textarea"
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, help)}
        aria-required={required || undefined}
        {...rest}
      />
    </FieldShell>
  );
});

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  label?: string;
  disabled?: boolean;
}

/** Interruptor com papel `switch` e texto sempre visível ("Ativo" / "Inativo"). */
export function Switch({ checked, onChange, onLabel = 'Ativo', offLabel = 'Inativo', label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span>{checked ? onLabel : offLabel}</span>
    </button>
  );
}

export function RequiredLegend() {
  return (
    <p className="form-legend-required">
      Campos com <span className="req">*</span> são obrigatórios
    </p>
  );
}
