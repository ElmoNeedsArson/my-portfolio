import type {
  CardDefinition,
  CardDefinitionInput,
  WordCountStats,
} from "./infiniteCanvasTypes";

type NavigationTargetInput = {
  card: CardDefinition;
  cardHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  zoomLevel?: number;
};

export function adjustPanForZoomAtPoint({
  focusX,
  focusY,
  panX,
  panY,
  oldZoom,
  newZoom,
}: {
  focusX: number;
  focusY: number;
  panX: number;
  panY: number;
  oldZoom: number;
  newZoom: number;
}): { panX: number; panY: number } {
  const canvasXBefore = (focusX - panX) / oldZoom;
  const canvasYBefore = (focusY - panY) / oldZoom;
  const canvasXAfter = (focusX - panX) / newZoom;
  const canvasYAfter = (focusY - panY) / newZoom;

  return {
    panX: panX + (canvasXAfter - canvasXBefore) * newZoom,
    panY: panY + (canvasYAfter - canvasYBefore) * newZoom,
  };
}

export function getNavigationTarget({
  card,
  cardHeight,
  viewportWidth,
  viewportHeight,
  zoomLevel = 0.6,
}: NavigationTargetInput): { panX: number; panY: number; zoom: number } {
  const isPhoneViewport = viewportWidth <= 640;
  const widthFitZoom = (viewportWidth * 0.9) / Math.max(card.width, 1);
  const resolvedZoom = isPhoneViewport
    ? Math.max(0.15, Math.min(zoomLevel, widthFitZoom))
    : zoomLevel;

  const cardCenterX = card.x + card.width / 2;
  const cardTopY = card.y;
  const cardCenterY = card.y + cardHeight / 2;
  const centerMode = card.initialCenterMode || "top";

  const panX = viewportWidth / 2 - cardCenterX * resolvedZoom;
  const panY =
    centerMode === "middle"
      ? viewportHeight / 2 - cardCenterY * resolvedZoom
      : viewportHeight * 0.15 - cardTopY * resolvedZoom;

  return {
    panX,
    panY,
    zoom: resolvedZoom,
  };
}

export function getCountedWords(text: string): string[] {
  const cleanedText = text
    .replace(/\*\*/g, " ")
    .replace(/[`#>*_\[\]()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanedText) return [];
  return cleanedText.split(" ").filter(Boolean);
}

export function countWords(text: string): number {
  return getCountedWords(text).length;
}

export function computeWordCountStats(
  cards: Pick<CardDefinition, "title" | "sections">[],
): WordCountStats {
  return cards.reduce<WordCountStats>(
    (stats, card) => {
      stats.titleWords += countWords(card.title);

      for (const section of card.sections) {
        if (section.type === "content" && section.content) {
          stats.contentWords += countWords(section.content);
        }

        if (section.caption) {
          const sectionCaptionWords = countWords(section.caption);
          if (sectionCaptionWords > 0) {
            stats.captionWords += sectionCaptionWords;
            stats.captionCount += 1;
          }
        }

        if (section.images?.length) {
          for (const image of section.images) {
            if (image.caption) {
              const imageCaptionWords = countWords(image.caption);
              if (imageCaptionWords > 0) {
                stats.captionWords += imageCaptionWords;
                stats.captionCount += 1;
              }
            }
          }
        }
      }

      return stats;
    },
    { titleWords: 0, contentWords: 0, captionWords: 0, captionCount: 0 },
  );
}

export function resolveOffsetValue(
  rawOffset: number | string | undefined,
  card: CardDefinitionInput,
  cardHeight: number,
  anchorCard: CardDefinition | null,
  anchorCardHeight: number,
): number {
  if (typeof rawOffset === "number") {
    return rawOffset;
  }

  if (typeof rawOffset !== "string") {
    return 0;
  }

  const normalizedOffset = rawOffset
    .trim()
    .toLowerCase()
    .replace(/,/g, ".")
    .replace(/\s+/g, "");

  const terms = normalizedOffset.match(/[+-]?[^+-]+/g);

  if (terms) {
    let total = 0;

    for (const term of terms) {
      const match = term.match(/^([+-]?\d*\.?\d+)(ch|cw|ph|pw)?$/);

      if (!match) {
        const parsedNumber = Number(normalizedOffset);
        return Number.isNaN(parsedNumber) ? 0 : parsedNumber;
      }

      const factor = Number(match[1]);
      const unit = match[2];

      if (Number.isNaN(factor)) {
        return 0;
      }

      if (!unit) {
        total += factor;
        continue;
      }

      if (unit === "ch") {
        total += factor * cardHeight;
        continue;
      }

      if (unit === "cw") {
        total += factor * card.width;
        continue;
      }

      if (unit === "ph") {
        total += factor * anchorCardHeight;
        continue;
      }

      total += factor * (anchorCard?.width ?? 0);
    }

    return total;
  }

  const parsedNumber = Number(normalizedOffset);
  return Number.isNaN(parsedNumber) ? 0 : parsedNumber;
}

export function resolveCardDefinitions(
  definitions: CardDefinitionInput[],
  measuredHeights: Record<string, number>,
): CardDefinition[] {
  return definitions.reduce<CardDefinition[]>((resolvedCards, card) => {
    let anchorCard: CardDefinition | null = null;
    let baseX = 0;
    let baseY = 0;
    const cardHeight = measuredHeights[card.id] ?? 300;
    let anchorCardHeight = 300;

    if (card.relativeToCardId) {
      anchorCard =
        resolvedCards.find((resolved) => resolved.id === card.relativeToCardId) ??
        null;
    } else if (resolvedCards.length > 0) {
      anchorCard = resolvedCards[resolvedCards.length - 1];
    }

    if (anchorCard) {
      baseX = anchorCard.x;
      baseY = anchorCard.y;
      anchorCardHeight = measuredHeights[anchorCard.id] ?? 300;
    }

    let resolvedX =
      baseX +
      resolveOffsetValue(
        card.offsetX,
        card,
        cardHeight,
        anchorCard,
        anchorCardHeight,
      );

    if (typeof card.x === "number") {
      resolvedX = card.x;
    }

    let resolvedY =
      baseY +
      resolveOffsetValue(
        card.offsetY,
        card,
        cardHeight,
        anchorCard,
        anchorCardHeight,
      );

    if (typeof card.y === "number") {
      resolvedY = card.y;
    }

    const { x, y, offsetX, offsetY, relativeToCardId, ...rest } = card;

    resolvedCards.push({
      ...rest,
      x: resolvedX,
      y: resolvedY,
    });

    return resolvedCards;
  }, []);
}
