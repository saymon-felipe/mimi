import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const rootEnvDir = resolve(process.cwd(), '../..');
  const env = loadEnv(mode, rootEnvDir, '');

  return {
    envDir: rootEnvDir,
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3333',
          changeOrigin: true
        }
      }
    }
  };
});
