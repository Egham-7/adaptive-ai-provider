import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'edge-runtime',
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
