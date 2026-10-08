import vinext from 'vinext';
import { defineConfig } from 'vite';
import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
export default defineConfig(async () => {
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= 'false';
  process.env.WRANGLER_SEND_METRICS ??= 'false';
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {
    resolve: { alias: { 'blake3-wasm/browser.js': resolve('vendor/siglum-optional-hash.js') } },
    server: { host: '127.0.0.1', headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
    plugins: [
      vinext(),
      cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] }, inspectorPort: false, config: { name: 'syntaxis-frontend', main: './build/worker.ts', compatibility_date: '2026-05-15', compatibility_flags: ['nodejs_compat'] } }),
      { name: 'syntaxis-hosting-metadata', apply: 'build' as const, async closeBundle() { await mkdir('dist/.openai', { recursive: true }); await cp('.openai/hosting.json', 'dist/.openai/hosting.json'); } },
    ],
  };
});
