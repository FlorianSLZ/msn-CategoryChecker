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
    // Prerender static pages with plain Node instead of workerd — none of
    // them touch Cloudflare bindings, and the workerd prerender path pulls
    // in an auto-generated wrangler config that currently fails validation
    // (its "ASSETS" binding name collides with a name Wrangler reserves for
    // Pages projects).
    prerenderEnvironment: 'node',
  }),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
