import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'destructive-quiet' | 'tonal';
export type ButtonSize = 'default' | 'page';

function classes(variant: ButtonVariant, size: ButtonSize, block?: boolean, extra?: string) {
  return ['btn', `btn--${variant}`, size === 'page' && variant !== 'tonal' ? 'btn--page' : '', block ? 'btn--block' : '', extra ?? '']
    .filter(Boolean)
    .join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'default', icon, loading, block, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classes(variant, size, block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  block?: boolean;
}

export function ButtonLink({ variant = 'primary', size = 'default', icon, block, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={classes(variant, size, block, className)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </Link>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Rótulo acessível obrigatório ("Editar", "Excluir lote"). */
  label: string;
  danger?: boolean;
}

export function IconButton({ icon, label, danger, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      className={['icon-btn', danger ? 'icon-btn--danger' : '', className ?? ''].filter(Boolean).join(' ')}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

interface IconLinkProps extends LinkProps {
  icon: IconName;
  label: string;
}

export function IconLink({ icon, label, className, ...rest }: IconLinkProps) {
  return (
    <Link className={['icon-btn', className ?? ''].join(' ')} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={18} />
    </Link>
  );
}

export function TextAction({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className="text-action" {...rest}>
      {children}
    </button>
  );
}
