import { json } from '@sveltejs/kit';
import { getVisitCounts } from '$lib/server/visitCounter';

export async function GET() {
  return json(await getVisitCounts(), {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
