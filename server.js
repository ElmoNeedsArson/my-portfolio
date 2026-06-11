import express from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const app = express();
app.disable("x-powered-by")
const PORT = Number(process.env.PORT || 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");
const logsDirPath = path.join(__dirname, "visitLogs");

let cachedDownloads = null;
let lastFetchMs = 0;

const visitCountsPath = path.join(logsDirPath, "visit-counts.json");
let totalVisits = 0;
let visitsByRoute = {};

async function loadVisitCounts() {
    try {
        const raw = await fs.promises.readFile(visitCountsPath, "utf8");
        const parsed = JSON.parse(raw);
        if (typeof parsed.total === "number") totalVisits = parsed.total;
        if (parsed.routes && typeof parsed.routes === "object") visitsByRoute = parsed.routes;
    } catch {
        // File doesn't exist yet, start from 0.
    }
}

async function persistVisitCounts() {
    try {
        await mkdir(logsDirPath, { recursive: true });
        await writeFile(
            visitCountsPath,
            JSON.stringify({ total: totalVisits, routes: visitsByRoute }, null, 2),
            "utf8",
        );
    } catch {
        // Silent failure by design.
    }
}

async function fetchDownloadsFromGithub() {
    const response = await fetch(
        "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugin-stats.json",
        {
            signal: AbortSignal.timeout(8000),
        },
    );

    if (!response.ok) {
        throw new Error(`Stats request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const pluginStats = payload?.["3d_embeds"];

    if (typeof pluginStats?.downloads === "number") {
        return pluginStats.downloads;
    } else {
        return 0;
    }
}

app.get("/api/obsidian-downloads", async (_req, res) => {
    const now = Date.now();
    let cacheIsFresh = false;

    //check if there is a cached value, and if its less then 24 hours old its still fresh, otherwise make a new request to github
    if (cachedDownloads !== null) {
        const cacheAgeMs = now - lastFetchMs;

        //24 hours
        if (cacheAgeMs < 86400000) {
            cacheIsFresh = true;
        }
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

    // Allow browsers/CDNs to cache API responses for 1 hour.
    res.set("Cache-Control", "public, max-age=3600");
    res.json({ downloads: cachedDownloads, updatedAt: lastFetchMs });
});

app.post("/api/pageview", express.json({ limit: "1kb" }), (req, res) => {
    res.json({ ok: true });

    const userAgent = String(req.headers["user-agent"] || "").toLowerCase();
    if (userAgent.includes("bot")) return;

    const route = req.body?.route;
    const sanitizedRoute =
        typeof route === "string" && route.startsWith("/") && route.length <= 200
            ? route
            : null;

    totalVisits++;
    if (sanitizedRoute) {
        visitsByRoute[sanitizedRoute] = (visitsByRoute[sanitizedRoute] ?? 0) + 1;
    }
    void persistVisitCounts();
});

app.get("/api/site-visits", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ visits: totalVisits, routes: visitsByRoute });
});

app.use("/_app", express.static(path.join(distPath, "_app"), { maxAge: "1y", immutable: true }));
app.use(express.static(distPath, { maxAge: "1d" }));

app.get("*", (req, res) => {
  // Check if a file actually exists at the requested path
  const filePath = path.join(distPath, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    // Let static middleware handle it
    express.static(distPath)(req, res, () => {});
    return;
  }
  // Otherwise, serve index.html for SPA routing
  res.set("Cache-Control", "no-cache");
  res.sendFile(path.join(distPath, "index.html"));
});

await loadVisitCounts();
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
