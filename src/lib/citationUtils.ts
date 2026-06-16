import { sources, type Source } from "./sources";
import type { CardDefinitionInput, CardSection } from "../components/canvas/infiniteCanvasTypes";

const CITE_PATTERN = /\\cite\{([^}]+)\}/g;

function extractIds(text: string): string[] {
  const ids: string[] = [];
  const re = new RegExp(CITE_PATTERN.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) ids.push(m[1]);
  return ids;
}

function extractFromCard(card: CardDefinitionInput): string[] {
  const ids: string[] = [];
  for (const section of card.sections ?? []) {
    if (section.content) ids.push(...extractIds(section.content));
    if (section.caption) ids.push(...extractIds(section.caption));
    for (const image of section.images ?? []) {
      if (image.caption) ids.push(...extractIds(image.caption));
      if (image.title) ids.push(...extractIds(image.title));
    }
    for (const child of section.sections ?? []) {
      if (child.content) ids.push(...extractIds(child.content));
      if (child.caption) ids.push(...extractIds(child.caption));
      for (const image of child.images ?? []) {
        if (image.caption) ids.push(...extractIds(image.caption));
        if (image.title) ids.push(...extractIds(image.title));
      }
    }
  }
  return ids;
}

function collectFigures(section: CardSection, map: Record<string, number>, counter: { v: number }) {
  if (section.figureId && !map[section.figureId]) map[section.figureId] = ++counter.v;
  for (const img of section.images ?? []) {
    if (img.figureId && !map[img.figureId]) map[img.figureId] = ++counter.v;
  }
  for (const child of section.sections ?? []) {
    collectFigures(child, map, counter);
  }
}

function collectFigureCards(section: CardSection, cardId: string, map: Record<string, string>) {
  if (section.figureId && !map[section.figureId]) map[section.figureId] = cardId;
  for (const img of section.images ?? []) {
    if (img.figureId && !map[img.figureId]) map[img.figureId] = cardId;
  }
  for (const child of section.sections ?? []) {
    collectFigureCards(child, cardId, map);
  }
}

export function buildFigures(cards: CardDefinitionInput[]): Record<string, number> {
  const map: Record<string, number> = {};
  const counter = { v: 0 };

  for (const card of cards) {
    if (card.hide) continue;
    for (const section of card.sections ?? []) {
      collectFigures(section, map, counter);
    }
  }

  return map;
}

export function buildFigureCards(cards: CardDefinitionInput[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const card of cards) {
    if (card.hide) continue;
    for (const section of card.sections ?? []) {
      collectFigureCards(section, card.id, map);
    }
  }

  return map;
}

function collectCitationCard(section: CardSection, cardId: string, map: Record<string, string>) {
  if (section.type === "sveltecomponent" && section.componentName === "references") {
    const ids = (section.componentProps?.ids as string[] | undefined) ?? [];
    for (const id of ids) {
      map[id] = cardId;
    }
  }
  for (const child of section.sections ?? []) {
    collectCitationCard(child, cardId, map);
  }
}

export function buildCitationCardMap(cards: CardDefinitionInput[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const card of cards) {
    if (card.hide) continue;
    for (const section of card.sections ?? []) {
      collectCitationCard(section, card.id, map);
    }
  }

  return map;
}

export type CitationResult = {
  citationMap: Record<string, number>;
  orderedSources: Source[];
};

export function buildCitations(cards: CardDefinitionInput[]): CitationResult {
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const seen = new Map<string, number>();

  for (const card of cards) {
    if (card.hide) continue;
    for (const id of extractFromCard(card)) {
      if (!seen.has(id) && sourceById.has(id)) {
        seen.set(id, seen.size + 1);
      }
    }
  }

  const citationMap: Record<string, number> = {};
  const orderedSources: Source[] = [];

  for (const [id, num] of seen) {
    citationMap[id] = num;
    const source = sourceById.get(id);
    if (source) orderedSources.push(source);
  }

  return { citationMap, orderedSources };
}
