import handler from 'vinext/server/fetch-handler';

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const response = await handler.fetch(request, env, ctx);
    const headers = new Headers(response.headers);
    // SharedArrayBuffer is required by the browser's real TeX worker.
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    return new Response(response.body, {
      status: response.status, statusText: response.statusText, headers,
    });
  },
};
