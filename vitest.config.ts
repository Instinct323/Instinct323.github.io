import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'astro:assets': '/tests/mocks/astro-assets.ts',
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
  },
})