import { handleApi, runWithRuntime, syncNewsFromSources } from './server.mjs';
import { createStorage } from './storage.mjs';
import seed from './seed.json';

function jsonError(message, status) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    const storage = createStorage(env.DB, seed);
    const runtime = {
      ...storage,
      scheduleNewsSync(db) {
        if (!env.DB || String(env.NEWS_AUTO_SYNC || 'true') === 'false') return;
        const previous = Date.parse(db.newsSync?.lastSuccessAt || db.newsSync?.lastAttemptAt || '') || 0;
        if (Date.now() - previous < Number(env.NEWS_SYNC_INTERVAL_MINUTES || 30) * 60000) return;
        // A background refresh gets an independent snapshot, never the API's snapshot.
        const backgroundStorage = createStorage(env.DB, seed);
        ctx.waitUntil(runWithRuntime({ ...runtime, ...backgroundStorage }, async () => {
          try {
            await syncNewsFromSources({ limit: Math.max(1, Math.min(3, Number(env.NEWS_SYNC_LIMIT || 2))) });
          } catch (error) {
            console.error('News refresh failed:', error.message);
          }
        }));
      }
    };

    if (request.method === 'POST' && url.pathname === '/api/news/sync') {
      if (!env.NEWS_SYNC_TOKEN) return jsonError('Обновление новостей вручную не настроено.', 503);
      if (request.headers.get('x-sync-token') !== env.NEWS_SYNC_TOKEN) {
        return jsonError('Синхронизация новостей запрещена.', 403);
      }
    }

    const req = {
      method: request.method,
      headers: Object.fromEntries(request.headers),
      async *[Symbol.asyncIterator]() {
        if (!request.body) return;
        const reader = request.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield value;
          }
        } finally {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
        }
      }
    };
    let status = 200;
    let headers = {};
    let body;
    const res = {
      writeHead(code, values) { status = code; headers = values; },
      end(value) { body = value; }
    };
    try {
      await runWithRuntime(runtime, () => handleApi(req, res, url));
      return new Response(body, { status, headers });
    } catch (error) {
      const statusCode = error.status || (/JSON|Размер/.test(error.message) ? 400 : 500);
      if (statusCode === 500) console.error('API failed:', error.message);
      return jsonError(statusCode === 500 ? 'Внутренняя ошибка сервера.' : error.message, statusCode);
    }
  }
};
