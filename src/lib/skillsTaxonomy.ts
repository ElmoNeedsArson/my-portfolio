export type TaxonomyNode = {
  label: string;
  matches?: string[];
  children?: TaxonomyNode[];
};

function findNode(nodes: TaxonomyNode[], label: string): TaxonomyNode | undefined {
  for (const node of nodes) {
    if (node.label === label) return node;
    if (node.children) {
      const found = findNode(node.children, label);
      if (found) return found;
    }
  }
}

export function getAllTermsForLabel(label: string): string[] {
  const node = findNode(skillsTaxonomy, label);
  if (!node) return [label];
  return [node.label, ...(node.matches ?? [])];
}

export const skillsTaxonomy: TaxonomyNode[] = [
  {
    label: "Programming",
    children: [
      {
        label: "JavaScript",
        children: [
          { label: "Three.js" },
          { label: "p5.js" },
          { label: "D3.js", matches: ["D3.js", "d3.js", "d3"] },
          { label: "Express.js", matches: ["Express", "express.js"] },
          { label: "Node.js", matches: ["Node.js", "node.js"] },
          { label: "SvelteKit" },
          { label: "Discord.js" },
          { label: "Electron.js" },
        ],
      },
      {
        label: "Python",
        children: [
          { label: "PyGame" },
          { label: "OpenCV", matches: ["OpenCV", "openCV"] },
          { label: "easyOCR" },
          { label: "Buildozer" },
          { label: "pywebview" },
        ],
      },
      { label: "TypeScript" },
      { label: "Svelte" },
      { label: "C++", matches: ["C++ (Arduino)"] },
      { label: "C#" },
      { label: "Java" },
      {
        label: "HTML",
        children: [
          { label: "Ximpel" },
        ],
      },
      { label: "CSS" },
      { label: "SQL" },
      { label: "Processing" },
    ],
  },
  {
    label: "3D & Visualization",
    children: [
      { label: "Blender" },
      { label: "Maya" },
      { label: "Fusion 360" },
      { label: "Blockbench" },
    ],
  },
  {
    label: "Data & Analysis",
    children: [
      { label: "Tableau" },
      { label: "SPSS" },
      { label: "SQLite" },
      { label: "Google Sheets", matches: ["Google Sheets API"] },
      { label: "QuickChart" },
      { label: "Data Foundry", matches: ["Data Foundry", "DataFoundry"] },
    ],
  },
  {
    label: "AI & Machine Learning",
    children: [
      { label: "LLM" },
      { label: "Computer Vision", matches: ["Google API's Image Query"] },
      { label: "Speech-to-Text", matches: ["NLP (Speech-to-Text)", "yaseenUOM-TTS"] },
    ],
  },
  {
    label: "Electronics & Hardware",
    children: [
      {
        label: "Arduino",
        children: [
          { label: "AVR8js" },
        ],
      },
      { label: "Teensy" },
      { label: "Raspberry Pi" },
    ],
  },
  {
    label: "Fabrication",
    children: [
      { label: "3D Printing" },
      { label: "Laser Cutting" },
    ],
  },
  {
    label: "Game Development",
    children: [
      { label: "Unity" },
      {
        label: "Minecraft",
        children: [
          { label: "Datapacks" },
          { label: "McFunctions" },
        ],
      },
    ],
  },
  {
    label: "Infrastructure",
    children: [
      { label: "Docker", matches: ["docker"] },
      { label: "PM2", matches: ["pm2"] },
    ],
  },
  {
    label: "Creative Tools",
    children: [
      { label: "Midjourney" },
      { label: "Canva" },
      { label: "WordPress", matches: ["Wordpress"] },
    ],
  },
];
