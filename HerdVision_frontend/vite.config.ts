import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A porta 5173 é a origem liberada por padrão no CORS dos serviços.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
});
