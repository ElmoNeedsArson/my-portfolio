import express from "express";
import { mkdir, appendFile, stat, writeFile } from "node:fs/promises";
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
const homeVisitsLogPath = path.join(logsDirPath, "home-visits.log");
const maxHomeVisitsLogBytes = 5 * 1024 * 1024;

let cachedDownloads = null;
let lastFetchMs = 0;

function getClientIp(req) {
    const forwardedFor = req.headers["x-forwarded-for"];

    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
        return forwardedFor.split(",")[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || "unknown";
}

async function truncateHomeVisitsLogIfTooLarge() {
    try {
        const fileStats = await stat(homeVisitsLogPath);

        if (fileStats.size >= maxHomeVisitsLogBytes) {
            await writeFile(homeVisitsLogPath, "", "utf8");
        }
    } catch {
        // File may not exist yet, ignore.
    }
}

async function logHomeVisit(req) {
    const userAgent = String(req.headers["user-agent"] || "unknown").slice(0, 500);
    const ip = getClientIp(req);
    const timestamp = new Date().toISOString();

    const logLine = JSON.stringify({
        timestamp,
        route: "/",
        ip,
        userAgent,
    }) + "\n";

    try {
        await mkdir(logsDirPath, { recursive: true });
        await truncateHomeVisitsLogIfTooLarge();
        await appendFile(homeVisitsLogPath, logLine, "utf8");
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

app.use((req, _res, next) => {
    if (req.method !== "GET" || req.path !== "/") {
        next();
        return;
    }

    const userAgent = String(req.headers["user-agent"] || "");

    if (userAgent.toLowerCase().includes("bot")) {
        next();
        return;
    }

    void logHomeVisit(req);
    next();
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
