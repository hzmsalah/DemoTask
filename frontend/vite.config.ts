import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const apiTarget = loadEnv(mode, '..', 'VITE_').VITE_DEV_API_TARGET || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      fs: { allow: ['..'] },
      proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setupTests.ts',
      globals: true,
      css: true,
    },
  };
});
