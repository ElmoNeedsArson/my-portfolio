import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://portfolio.jessestrijker.com";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const projectsDir = path.join(rootDir, "src", "projects");
const outputPath = path.join(rootDir, "public", "sitemap.xml");

const staticRoutes = ["/", "/highlights", "/projects", "/experiments", "/eindhoven"];

function normalizeUrl(routePath) {
  const safePath = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${SITE_URL}${encodeURI(safePath)}`;
}

function toUrlTag(loc) {
  return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
}

async function getProjectSlugs() {
  const entries = await readdir(projectsDir, { withFileTypes: true });
  const jsonFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
  const slugs = [];

  for (const file of jsonFiles) {
    const filePath = path.join(projectsDir, file.name);
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed.slug === "string" && parsed.slug.trim().length > 0) {
      slugs.push(`/${parsed.slug.trim()}`);
    }
  }

  return slugs;
}

async function buildSitemap() {
  const projectRoutes = await getProjectSlugs();
  const allRoutes = [...new Set([...staticRoutes, ...projectRoutes])].sort();
  const urlTags = allRoutes.map((routePath) => toUrlTag(normalizeUrl(routePath))).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlTags}\n</urlset>\n`;

  await writeFile(outputPath, xml, "utf8");
  console.log(`Generated sitemap with ${allRoutes.length} URLs at ${outputPath}`);
}

buildSitemap().catch((error) => {
  console.error("Failed to generate sitemap:", error);
  process.exit(1);
});
