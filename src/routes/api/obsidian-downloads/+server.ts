import { json } from '@sveltejs/kit';

let cachedDownloads: number | null = null;
let lastFetchMs = 0;

async function fetchDownloadsFromGithub() {
  const response = await fetch(
    'https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugin-stats.json',
    {
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!response.ok) {
    throw new Error(`Stats request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const pluginStats = payload?.['3d_embeds'];

  if (typeof pluginStats?.downloads === 'number') {
    return pluginStats.downloads;
  }

  return 0;
}

export async function GET() {
  const now = Date.now();
  let cacheIsFresh = false;

  if (cachedDownloads !== null) {
    const cacheAgeMs = now - lastFetchMs;
    cacheIsFresh = cacheAgeMs < 86400000;
  }

  if (!cacheIsFresh) {
    try {
      cachedDownloads = await fetchDownloadsFromGithub();
      lastFetchMs = now;
    } catch {
      cachedDownloads ??= 0;
      lastFetchMs ||= now;
    }
  }

  return json(
    { downloads: cachedDownloads, updatedAt: lastFetchMs },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
}
