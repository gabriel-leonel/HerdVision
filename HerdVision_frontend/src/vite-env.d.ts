/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: string;
  readonly VITE_AUTH_API_URL?: string;
  readonly VITE_HERD_API_URL?: string;
  readonly VITE_MONITORING_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
