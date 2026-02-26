import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
app.disable("x-powered-by")
const PORT = Number(process.env.PORT || 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

let cachedDownloads = null;
let lastFetchMs = 0;

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

app.use(express.static(distPath));

app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
