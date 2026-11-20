import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface AsyncState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
  setData: (updater: T | ((current: T | undefined) => T)) => void;
}

/** Executa `fn` quando `deps` mudam; ignora respostas antigas (corrida entre buscas). */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const requestId = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    fnRef.current().then(
      (result) => {
        if (current !== requestId.current) return;
        setDataState(result);
        setLoading(false);
      },
      (err) => {
        if (current !== requestId.current) return;
        setError(err);
        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater: T | ((current: T | undefined) => T)) => {
    setDataState((current) => (typeof updater === 'function' ? (updater as (c: T | undefined) => T)(current) : updater));
  }, []);

  return { data, error, loading, reload, setData };
}

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Filtros e página guardados na URL (permite voltar, recarregar e compartilhar a busca).
 * Alterar qualquer filtro volta para a página 1.
 */
export function useQueryState<K extends string>(defaults: Record<K, string>) {
  const [params, setParams] = useSearchParams();

  const values = Object.fromEntries(
    (Object.keys(defaults) as K[]).map((key) => [key, params.get(key) ?? defaults[key]]),
  ) as Record<K, string>;

  const update = useCallback(
    (patch: Partial<Record<K, string>>, options: { keepPage?: boolean } = {}) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch) as [K, string | undefined][]) {
            if (value === undefined || value === '' || value === defaults[key]) next.delete(key);
            else next.set(key, value);
          }
          if (!options.keepPage && !('pagina' in patch)) next.delete('pagina');
          return next;
        },
        { replace: true },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams],
  );

  return [values, update] as const;
}
