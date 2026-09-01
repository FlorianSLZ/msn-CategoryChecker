import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://categorychecker.msnugget.com',
  output: 'static',
  session: false,
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
