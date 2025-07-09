import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: false,
    clean: true,
    splitting: false,
    treeshake: true,
    minify: false,
    target: 'es2018',
    outDir: 'dist',
    external: ['@ai-sdk/provider', '@ai-sdk/provider-utils'],
  },
  {
    entry: [
      'src/adaptive-chat-language-model.ts',
      'src/adaptive-provider.ts',
      'src/adaptive-types.ts',
      'src/convert-to-adaptive-chat-messages.ts',
      'src/map-adaptive-finish-reason.ts',
    ],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: false,
    clean: false,
    splitting: false,
    treeshake: true,
    minify: false,
    target: 'es2018',
    outDir: 'dist',
    external: ['@ai-sdk/provider', '@ai-sdk/provider-utils'],
  },
]);
