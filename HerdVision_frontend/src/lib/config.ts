// Configuração lida das variáveis de ambiente do Vite (ver .env.example).
const env = import.meta.env;

function baseUrl(value: string | undefined, fallback: string): string {
  return (value && value.trim() ? value.trim() : fallback).replace(/\/+$/, '');
}

export const config = {
  apiMode: (env.VITE_API_MODE === 'mock' ? 'mock' : 'live') as 'mock' | 'live',
  services: {
    auth: baseUrl(env.VITE_AUTH_API_URL, 'http://localhost:8000'),
    herd: baseUrl(env.VITE_HERD_API_URL, 'http://localhost:8001'),
    monitoring: baseUrl(env.VITE_MONITORING_API_URL, 'http://localhost:8002'),
  },
};

export const isMockMode = config.apiMode === 'mock';
