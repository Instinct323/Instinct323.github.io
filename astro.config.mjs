import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import path from 'node:path';
import fs from 'node:fs';
import { parse } from 'jsonc-parser';

const configRaw = fs.readFileSync('./content/config.jsonc', 'utf-8');
const config = parse(configRaw);
const DEV_RESPONSE_DELAY_MS = 500;
void config;

export default defineConfig({
  site: 'https://instinct323.github.io',
  output: 'static',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  integrations: [sitemap()],
  vite: {
    build: {
      cssMinify: 'esbuild',
    },
    define: {
      'import.meta.env.DEV_RESPONSE_DELAY_MS': JSON.stringify(DEV_RESPONSE_DELAY_MS),
    },
    ssr: {
      noExternal: ['@mdit/plugin-katex'],
    },
    resolve: {
      alias: {
        '~': path.resolve('./src'),
      },
    },
    plugins: [
      {
        name: 'artificial-delay',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            // Skip Vite internal requests (HMR, module resolution, etc.)
            // to avoid severely degrading the dev experience.
            if (DEV_RESPONSE_DELAY_MS > 0 && !req.url?.startsWith('/@')) {
              setTimeout(next, DEV_RESPONSE_DELAY_MS);
            } else {
              next();
            }
          });
        },
      },
    ],
  },
});
