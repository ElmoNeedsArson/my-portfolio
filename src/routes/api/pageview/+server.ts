import { json } from '@sveltejs/kit';
import { recordPageView } from '$lib/server/visitCounter';

export async function POST({ request }) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() ?? '';

  if (!userAgent.includes('bot')) {
    let route: unknown;

    try {
      const body = await request.json();
      route = body?.route;
    } catch {
      route = null;
    }

    await recordPageView(route);
  }

  return json({ ok: true });
}
