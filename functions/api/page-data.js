// Durable Object for storing and retrieving page data
export class PageDataDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    const url = new URL(request.url);
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

// Route: GET /api/page-data
export async function onRequestGet({ request, env }) {
  const id = env.PAGE_DATA.idFromName('main');
  const obj = env.PAGE_DATA.get(id);
  return obj.fetch(request);
}

// Route: POST /api/page-data
export async function onRequestPost({ request, env }) {
  const id = env.PAGE_DATA.idFromName('main');
  const obj = env.PAGE_DATA.get(id);
  return obj.fetch(request);
}
