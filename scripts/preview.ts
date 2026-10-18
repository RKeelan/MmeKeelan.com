// Serves the production build in dist/ under the GitHub Pages base path, to
// check it locally after `bun run build`.
import { join } from 'node:path';

const base = '/MmeKeelan.com/';
const root = join(import.meta.dir, '..', 'dist');

const server = Bun.serve({
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === base.slice(0, -1)) return Response.redirect(base);
    if (!pathname.startsWith(base)) {
      return new Response('Not Found', { status: 404 });
    }
    const file = Bun.file(
      join(root, pathname.slice(base.length) || 'index.html'),
    );
    if (!(await file.exists())) {
      return new Response('Not Found', { status: 404 });
    }
    return new Response(file);
  },
});
console.log(`Serving dist/ at ${new URL(base, server.url)}`);
