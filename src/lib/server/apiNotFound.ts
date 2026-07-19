import { json } from '@sveltejs/kit';

export function apiNotFound() {
  return json({ error: 'Not found' }, { status: 404 });
}
