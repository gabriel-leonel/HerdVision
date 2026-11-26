import { useEffect, useState } from 'react';
import { useDebouncedValue } from './useAsync';

/** Campo de busca com debounce que grava o termo na URL. */
export function useSearchInput(current: string, commit: (value: string) => void, delay = 350) {
  const [value, setValue] = useState(current);
  const debounced = useDebouncedValue(value, delay);

  useEffect(() => {
    if (debounced.trim() !== current) commit(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Mantém o campo em sincronia quando a URL muda por fora (ex.: "Limpar filtros").
  useEffect(() => {
    if (current !== value.trim()) setValue(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return [value, setValue] as const;
}
