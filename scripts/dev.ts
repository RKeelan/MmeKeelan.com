// Development server: serves every page in src/ at the same path as on the
// live site (roulette.html at /roulette.html), so links between pages work.
// Bun bundles each page on request and hot reloads it when a file changes.
import { join } from 'node:path';
import type { HTMLBundle } from 'bun';

const root = join(import.meta.dir, '..', 'src');
const routes: Record<string, HTMLBundle> = {};
for await (const file of new Bun.Glob('*.html').scan(root)) {
  routes[`/${file}`] = (await import(join(root, file))).default;
}
const index = routes['/index.html'];
if (index) routes['/'] = index;

const server = Bun.serve({ routes, development: true });
console.log(`Serving src/ at ${server.url}`);
