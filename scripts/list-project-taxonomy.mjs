import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const projectsDir = path.join(rootDir, "src", "projects");

const categories = [
  ["languages", "language"],
  ["tools", "tool"],
  ["tags", "tag"],
];

function displayName(value) {
  return String(value).trim();
}

async function listTaxonomy() {
  const files = (await readdir(projectsDir)).filter((file) => file.endsWith(".json"));
  const values = new Map();

  for (const file of files) {
    const project = JSON.parse(await readFile(path.join(projectsDir, file), "utf8"));

    for (const [property, label] of categories) {
      for (const rawValue of project[property] ?? []) {
        const name = displayName(rawValue);
        if (!name) continue;

        const key = name.toLowerCase();
        const existing = values.get(key) ?? {
          name,
          types: new Set(),
        };
        existing.types.add(label);
        values.set(key, existing);
      }
    }
  }

  const rows = Array.from(values.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  for (const row of rows) {
    console.log(`${row.name} - ${Array.from(row.types).sort().join(", ")}`);
  }
}

listTaxonomy().catch((error) => {
  console.error("Failed to list project taxonomy:", error);
  process.exit(1);
});
