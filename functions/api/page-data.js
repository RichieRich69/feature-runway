export class PageDataDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    if (request.method === 'GET') {
      const data = await this.state.storage.get('data');
      return new Response(JSON.stringify({ data: data ?? null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (request.method === 'POST') {
      const body = await request.json();
      await this.state.storage.put('data', body.data);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Method Not Allowed', { status: 405 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/page-data") {
      const id = env.PAGE_DATA.idFromName("main");
      const obj = env.PAGE_DATA.get(id);
      return obj.fetch(request);
    }
    // Serve your Pages assets
    return env.ASSETS.fetch(request);
  }
};

export async function onRequestGet({ env, request }) {
  const id = env.PAGE_DATA.idFromName("main");
  const stub = env.PAGE_DATA.get(id);
  return stub.fetch(request);
}

export async function onRequestPost({ env, request }) {
  const id = env.PAGE_DATA.idFromName("main");
  const stub = env.PAGE_DATA.get(id);
  return stub.fetch(request);
}
