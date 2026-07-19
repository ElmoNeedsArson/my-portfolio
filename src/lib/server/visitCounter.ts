import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const logsDirPath = path.join(process.cwd(), 'visitLogs');
const visitCountsPath = path.join(logsDirPath, 'visit-counts.json');

let loadPromise: Promise<void> | null = null;
let totalVisits = 0;
let visitsByRoute: Record<string, number> = {};

async function loadVisitCounts() {
  try {
    const raw = await readFile(visitCountsPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (typeof parsed.total === 'number') totalVisits = parsed.total;
    if (parsed.routes && typeof parsed.routes === 'object') {
      visitsByRoute = parsed.routes;
    }
  } catch {
  }
}

async function ensureVisitCountsLoaded() {
  loadPromise ??= loadVisitCounts();
  await loadPromise;
}

async function persistVisitCounts() {
  try {
    await mkdir(logsDirPath, { recursive: true });
    await writeFile(
      visitCountsPath,
      JSON.stringify({ total: totalVisits, routes: visitsByRoute }, null, 2),
      'utf8',
    );
  } catch {
  }
}

export async function recordPageView(route: unknown) {
  await ensureVisitCountsLoaded();

  const sanitizedRoute =
    typeof route === 'string' && route.startsWith('/') && route.length <= 200
      ? route
      : null;

  totalVisits++;
  if (sanitizedRoute) {
    visitsByRoute[sanitizedRoute] = (visitsByRoute[sanitizedRoute] ?? 0) + 1;
  }

  void persistVisitCounts();
}

export async function getVisitCounts() {
  await ensureVisitCountsLoaded();

  return {
    visits: totalVisits,
    routes: visitsByRoute,
  };
}
