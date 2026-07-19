import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const siteConfigPath = path.join(rootDir, "site.config.json");
const projectsDir = path.join(rootDir, "src", "projects");
const outputPath = path.join(rootDir, "public", "sitemap.xml");
const robotsOutputPath = path.join(rootDir, "public", "robots.txt");

const staticRoutes = ["/highlights", "/projects", "/cv", "/eindhoven"];

function labelToSlug(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeUrl(siteUrl, routePath) {
  const safePath = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${siteUrl}${encodeURI(safePath)}`;
}

function toUrlTag(loc) {
  return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
}

async function getProjectRoutes() {
  const entries = await readdir(projectsDir, { withFileTypes: true });
  const jsonFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
  const routes = [];

  for (const file of jsonFiles) {
    const filePath = path.join(projectsDir, file.name);
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const slug = typeof parsed.slug === "string" ? parsed.slug.trim() : "";

    if (slug.length > 0) {
      routes.push(`/${slug}`);

      if (parsed.tabs && typeof parsed.tabs === "object") {
        for (const [key, value] of Object.entries(parsed.tabs)) {
          const label = value && typeof value === "object" && typeof value.name === "string"
            ? value.name
            : key;
          const tabSlug = labelToSlug(label);

          if (tabSlug) {
            routes.push(`/${slug}/${tabSlug}`);
          }
        }
      }
    }
  }

  return routes;
}

async function buildSitemap() {
  const siteConfig = JSON.parse(await readFile(siteConfigPath, "utf8"));
  const siteUrl = siteConfig.siteUrl.replace(/\/+$/, "");
  const projectRoutes = await getProjectRoutes();
  const allRoutes = [...new Set([...staticRoutes, ...projectRoutes])].sort();
  const urlTags = allRoutes.map((routePath) => toUrlTag(normalizeUrl(siteUrl, routePath))).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlTags}\n</urlset>\n`;

  await writeFile(outputPath, xml, "utf8");
  await writeFile(
    robotsOutputPath,
    `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
    "utf8",
  );
  console.log(`Generated sitemap with ${allRoutes.length} URLs at ${outputPath}`);
}

buildSitemap().catch((error) => {
  console.error("Failed to generate sitemap:", error);
  process.exit(1);
});
