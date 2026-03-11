import type {
  CardDefinition,
  CardDefinitionInput,
  CardGroupDefinition,
  ResolvedCardGroup,
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

function resolvePreviousCardDepth(unit: string): number | null {
  if (unit === "ph" || unit === "pw") {
    return 1;
  }

  const repeatedPreviousMatch = unit.match(/^(p+)(h|w)$/);
  if (repeatedPreviousMatch) {
    return repeatedPreviousMatch[1].length;
  }

  const numericPreviousMatch = unit.match(/^p(\d+)(h|w)$/);
  if (numericPreviousMatch) {
    const depth = Number(numericPreviousMatch[1]);
    return Number.isNaN(depth) || depth < 1 ? null : depth;
  }

  return null;
}

function getPreviousCardByDepth(
  resolvedCards: CardDefinition[],
  depth: number,
): CardDefinition | null {
  const index = resolvedCards.length - depth;
  if (index < 0) {
    return null;
  }

  return resolvedCards[index] ?? null;
}

export function resolveOffsetValue(
  rawOffset: number | string | undefined,
  card: CardDefinitionInput,
  cardHeight: number,
  anchorCard: CardDefinition | null,
  anchorCardHeight: number,
  resolvedCards: CardDefinition[],
  measuredHeights: Record<string, number>,
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
      const match = term.match(/^([+-]?\d*\.?\d+)([a-z0-9]+)?$/);

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

      const previousDepth = resolvePreviousCardDepth(unit);
      if (previousDepth !== null) {
        if (previousDepth === 1) {
          if (unit.endsWith("h")) {
            total += factor * anchorCardHeight;
          } else {
            total += factor * (anchorCard?.width ?? 0);
          }
          continue;
        }

        const referenceCard = getPreviousCardByDepth(resolvedCards, previousDepth);
        if (!referenceCard) {
          continue;
        }

        if (unit.endsWith("h")) {
          total += factor * (measuredHeights[referenceCard.id] ?? 300);
        } else {
          total += factor * referenceCard.width;
        }
        continue;
      }

      return 0;
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

      // If the target card is unavailable (for example hidden), fall back to
      // the previous resolved card so relative positioning still works.
      if (!anchorCard && resolvedCards.length > 0) {
        anchorCard = resolvedCards[resolvedCards.length - 1];
      }
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
        resolvedCards,
        measuredHeights,
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
        resolvedCards,
        measuredHeights,
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

export function resolveCardGroups(
  cards: CardDefinition[],
  measuredHeights: Record<string, number>,
  groups: CardGroupDefinition[],
): ResolvedCardGroup[] {
  return groups
    .map((group) => {
      const cardsInGroup = cards.filter((card) =>
        group.cardIds.includes(card.id),
      );

      if (!cardsInGroup.length) {
        return null;
      }

      const bounds = cardsInGroup.reduce(
        (acc, card) => {
          const cardHeight = measuredHeights[card.id] ?? 300;
          const rightEdge = card.x + card.width;
          const bottomEdge = card.y + cardHeight;

          return {
            minX: Math.min(acc.minX, card.x),
            minY: Math.min(acc.minY, card.y),
            maxX: Math.max(acc.maxX, rightEdge),
            maxY: Math.max(acc.maxY, bottomEdge),
          };
        },
        {
          minX: Number.POSITIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
      );

      const padding = group.padding ?? 40;

      return {
        id: group.id,
        title: group.title,
        x: bounds.minX - padding,
        y: bounds.minY - padding,
        width: bounds.maxX - bounds.minX + padding * 2,
        height: bounds.maxY - bounds.minY + padding * 2,
        borderColor: group.borderColor ?? "rgba(76, 175, 80, 0.65)",
        backgroundColor: group.backgroundColor ?? "rgba(76, 175, 80, 0.08)",
        labelTextColor: group.labelTextColor ?? "#194D1E",
        labelBackgroundColor:
          group.labelBackgroundColor ?? "rgba(233, 247, 235, 0.96)",
      };
    })
    .filter((group): group is ResolvedCardGroup => group !== null);
}
