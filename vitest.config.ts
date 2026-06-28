import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'astro:assets': path.resolve(__dirname, 'tests/mocks/astro-assets.ts'),
      '~': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    reporters: ['minimal'],
    silent: true,
  },
});