export class PageDataDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    if (request.method === "GET") {
      const data = await this.state.storage.get("data");
      return Response.json({ data: data ?? null });
    }
    if (request.method === "POST") {
      const body = await request.json();
      await this.state.storage.put("data", body.data);
      return Response.json({ success: true });
    }
    return new Response("Method Not Allowed", { status: 405 });
  }
}

// Optional: tiny handler so the worker deploys happily
export default {
  async fetch() {
    return new Response("DO worker OK");
  },
};
