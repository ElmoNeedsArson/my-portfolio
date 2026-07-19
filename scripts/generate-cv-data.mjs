import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicPdfPath = "/assets/pdfs/CV_Jesse_Strijker.pdf";
const pdfPath = path.join(rootDir, "public", ...publicPdfPath.split("/").filter(Boolean));
const outputDir = path.join(rootDir, "src", "lib", "generated");
const outputPath = path.join(outputDir, "cvData.json");

const sidebarHeadings = new Map([
  ["CONTACT", "Contact"],
  ["SKILLS", "Skills"],
  ["LANGUAGES", "Languages"],
  ["INTERESTS", "Interests"],
]);

const mainHeadings = new Map([
  ["EDUCATION", "education"],
  ["EXPERIENCE", "experience"],
  ["PUBLICATIONS", "publications"],
]);

function compactHeading(value) {
  return value.replace(/[^a-z]/gi, "").toUpperCase();
}

function normalizeText(value) {
  return value
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s*–\s*/g, " - ")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferHref(text) {
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(text)) return `mailto:${text}`;
  if (/^\+[\d\s]+$/.test(text)) return `tel:${text.replace(/\s+/g, "")}`;
  if (/^(linkedin|github|portfolio)\./i.test(text)) return `https://${text}`;
  return undefined;
}

function yKey(value) {
  return String(Math.round(value));
}

function lineSort(a, b) {
  if (Math.abs(b.y - a.y) > 0.5) return b.y - a.y;
  return a.x - b.x;
}

async function extractTextItems() {
  const data = new Uint8Array(await readFile(pdfPath));
  const pdf = await getDocument({ data, disableWorker: true }).promise;
  const items = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    for (const item of content.items) {
      const text = item.str.trim();
      if (!text) continue;

      const [, , , , x, y] = item.transform;
      items.push({
        text,
        x,
        y,
        page: pageNumber,
        fontName: item.fontName,
        height: item.height,
      });
    }
  }

  return items.sort(lineSort);
}

function buildLines(items) {
  const grouped = new Map();

  for (const item of items) {
    const region = item.x < 160 ? "sidebar" : "main";
    const key = `${item.page}:${region}:${yKey(item.y)}`;
    const line = grouped.get(key) ?? { page: item.page, y: Math.round(item.y), items: [] };
    line.items.push(item);
    grouped.set(key, line);
  }

  return Array.from(grouped.values())
    .map((line) => {
      const sortedItems = line.items.sort((a, b) => a.x - b.x);
      const text = normalizeText(sortedItems.map((item) => item.text).join(" "));
      const leftItems = sortedItems.filter((item) => item.x < 450);
      const rightItems = sortedItems.filter((item) => item.x >= 450);

      return {
        ...line,
        items: sortedItems,
        text,
        compact: compactHeading(text),
        leftText: normalizeText(leftItems.map((item) => item.text).join(" ")),
        rightText: normalizeText(rightItems.map((item) => item.text).join(" ")),
        first: sortedItems[0],
      };
    })
    .sort(lineSort);
}

function parseSidebar(lines) {
  const sidebarLines = lines.filter((line) => line.first.x < 160);
  const contactStartIndex = sidebarLines.findIndex((line) => sidebarHeadings.has(line.compact));
  const nameLines = sidebarLines
    .slice(0, contactStartIndex < 0 ? 0 : contactStartIndex)
    .map((line) => line.text)
    .filter(Boolean);
  const sections = [];
  let current = null;

  for (const line of sidebarLines.slice(Math.max(contactStartIndex, 0))) {
    const heading = sidebarHeadings.get(line.compact);
    if (heading) {
      current = { title: heading, rawLines: [] };
      sections.push(current);
      continue;
    }

    current?.rawLines.push(line);
  }

  return {
    name: nameLines.join(" "),
    sections: sections.map((section) => {
      if (section.title === "Skills") {
        const groups = [];
        let currentGroup = null;

        for (const line of section.rawLines) {
          const isGroupHeading = line.first.fontName.endsWith("_f1");
          if (isGroupHeading) {
            currentGroup = { name: line.text, lines: [] };
            groups.push(currentGroup);
          } else {
            currentGroup?.lines.push(line.text);
          }
        }

        return {
          title: section.title,
          groups: groups.map((group) => ({
            name: group.name,
            text: normalizeText(group.lines.join(" ")),
          })),
        };
      }

      return {
        title: section.title,
        items: section.rawLines.map((line) => {
          const href = inferHref(line.text);
          return href ? { text: line.text, href } : { text: line.text };
        }),
      };
    }),
  };
}

function sectionMainLines(lines, sectionName) {
  const mainLines = lines.filter((line) => line.first.x >= 160);
  const startIndex = mainLines.findIndex((line) => mainHeadings.get(line.compact) === sectionName);
  if (startIndex < 0) return [];

  const endIndex = mainLines.findIndex((line, index) => index > startIndex && mainHeadings.has(line.compact));
  return mainLines.slice(startIndex + 1, endIndex < 0 ? undefined : endIndex);
}

function isMainItemTitle(line) {
  return (
    line.first.x < 250 &&
    line.first.fontName.endsWith("_f1") &&
    (line.first.height >= 10 || line.rightText.length > 0)
  );
}

function parseTimedItems(lines) {
  const items = [];
  let current = null;

  for (const line of lines) {
    if (isMainItemTitle(line)) {
      current = {
        title: line.leftText,
        date: line.rightText,
        place: "",
        bodyLines: [],
      };
      items.push(current);
      continue;
    }

    if (!current) continue;

    const isPlace =
      !current.place &&
      line.first.x < 250 &&
      line.first.fontName.endsWith("_f1") &&
      line.first.height < 10.5;

    if (isPlace) {
      current.place = line.leftText;
    } else {
      current.bodyLines.push(line.leftText || line.text);
    }
  }

  return items.map((item) => ({
    title: item.title,
    ...(item.place ? { place: item.place } : {}),
    ...(item.date ? { date: item.date } : {}),
    ...(item.bodyLines.length ? { body: normalizeText(item.bodyLines.join(" ")) } : {}),
  }));
}

function parsePublications(lines) {
  const publications = [];
  let current = null;

  for (const line of lines) {
    const titleParts = line.items.filter((item) => item.fontName.endsWith("_f1") && item.x < 320);
    const hasTitle = titleParts.length > 0 && titleParts[0].x < 250;

    if (hasTitle) {
      current = {
        title: normalizeText(titleParts.map((item) => item.text).join(" ")),
        lines: [],
      };
      publications.push(current);

      const afterTitle = line.items
        .filter((item) => !titleParts.includes(item))
        .map((item) => item.text)
        .join(" ")
        .replace(/^\s*-\s*/, "");

      if (afterTitle.trim()) current.lines.push(afterTitle);
      continue;
    }

    current?.lines.push(line.text);
  }

  return publications.map((item) => ({
    title: item.title,
    text: normalizeText(item.lines.join(" ")),
  }));
}

async function generateCvData() {
  const items = await extractTextItems();
  const lines = buildLines(items);
  const sidebar = parseSidebar(lines);
  const data = {
    name: sidebar.name || "Jesse Strijker",
    sidebarSections: sidebar.sections,
    education: parseTimedItems(sectionMainLines(lines, "education")),
    experience: parseTimedItems(sectionMainLines(lines, "experience")),
    publications: parsePublications(sectionMainLines(lines, "publications")),
    pdfPath: publicPdfPath,
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Generated CV data at ${outputPath}`);
}

generateCvData().catch((error) => {
  console.error("Failed to generate CV data:", error);
  process.exit(1);
});
