import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import path from 'node:path';

export default defineConfig({
  site: 'https://instinct323.github.io',
  output: 'static',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  integrations: [sitemap(), react()],
  vite: {
    ssr: {
      noExternal: ['@mdit/plugin-katex'],
    },
    resolve: {
      alias: {
        '~': path.resolve('./src'),
      },
    },
  },
});
