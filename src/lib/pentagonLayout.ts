import type { EAKey } from "./expertiseAreas";
import type { Connection } from "../components/canvas/infiniteCanvasTypes";

export type PentagonVertexKey = "top" | "upperRight" | "lowerRight" | "lowerLeft" | "upperLeft";

export type PentagonVertex = {
  eaKey: EAKey;
  cardId: string;
};

export const PENTAGON_VERTICES: Record<PentagonVertexKey, PentagonVertex> = {
  top: {
    eaKey: "m_d_c",
    cardId: "past-math-data-and-computing",
  },
  upperRight: {
    eaKey: "c_a",
    cardId: "past-creativity-and-aesthetics",
  },
  lowerRight: {
    eaKey: "t_r",
    cardId: "past-technology-and-realization",
  },
  lowerLeft: {
    eaKey: "b_e",
    cardId: "past-business-and-entrepreneurship",
  },
  upperLeft: {
    eaKey: "u_s",
    cardId: "past-user-and-society",
  },
};

export const PENTAGON_EDGE_PAIRS: Array<[PentagonVertexKey, PentagonVertexKey]> = [
  ["top", "upperRight"],
  ["upperRight", "lowerRight"],
  ["lowerRight", "lowerLeft"],
  ["lowerLeft", "upperLeft"],
  ["upperLeft", "top"],
];

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; width: number; height: number };

export const PENTAGON_EDGE_POINTS: Array<{ from: Point; to: Point }> = [
  { from: { x: 0, y: -809 }, to: { x: 950, y: -251.88 } }, // MDC into C&A
  { from: { x: 950, y: 328.5 }, to: { x: 650, y: 1050 } }, // C&A into T&R
  { from: { x: 305, y: 1248 }, to: { x: -305, y: 1248 } }, // T&R into B&E
  { from: { x: -650, y: 1050 }, to: { x: -850, y: 577 } }, // B&E into U&S
  { from: { x: -950, y: -251.88 }, to: { x: 0, y: -809 } }, // U&S into MDC
];

export const PENTAGON_ARROW_POINTS = {
  inTop: { x: -2700, y: -1700 },
  inBottom: { x: -2700, y: 1700 },
  outTop: { x: 2700, y: -1700 },
  outBottom: { x: 2700, y: 1700 },
};

export function unionBox(a: Box, b: Box): Box {
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function boxCenter(box: Box): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function unitBoxFor(cardId: string, getCardBox: (cardId: string) => Box | null): Box | null {
  const textBox = getCardBox(cardId);
  if (!textBox) return null;
  const imgBox = getCardBox(`${cardId}-img`);
  return imgBox ? unionBox(textBox, imgBox) : textBox;
}

function addOffset(p: Point, hubCenter: Point): Point {
  return { x: hubCenter.x + p.x, y: hubCenter.y + p.y };
}

export function buildPentagonConnections(
  hubCenter: Point,
  availableCardIds: Set<string>,
  eaBaseColor: (key: EAKey) => string,
): Connection[] {
  const result: Connection[] = [];

  PENTAGON_EDGE_PAIRS.forEach(([a, b], i) => {
    if (!availableCardIds.has(PENTAGON_VERTICES[a].cardId) || !availableCardIds.has(PENTAGON_VERTICES[b].cardId)) return;
    const { from, to } = PENTAGON_EDGE_POINTS[i];
    result.push({
      fromPoint: addOffset(from, hubCenter),
      fromSide: "right",
      toPoint: addOffset(to, hubCenter),
      toSide: "left",
      gradient: [eaBaseColor(PENTAGON_VERTICES[a].eaKey), eaBaseColor(PENTAGON_VERTICES[b].eaKey)],
      straight: true,
    });
  });

  if (availableCardIds.has("professional-identity")) {
    result.push({
      from: "professional-identity",
      fromSide: "right",
      toPoint: addOffset(PENTAGON_ARROW_POINTS.inTop, hubCenter),
      toSide: "left",
    });
    result.push({
      from: "professional-identity",
      fromSide: "right",
      toPoint: addOffset(PENTAGON_ARROW_POINTS.inBottom, hubCenter),
      toSide: "left",
    });
  }

  if (availableCardIds.has("past-conclusion")) {
    result.push({
      fromPoint: addOffset(PENTAGON_ARROW_POINTS.outTop, hubCenter),
      fromSide: "right",
      to: "past-conclusion",
      toSide: "left",
    });
    result.push({
      fromPoint: addOffset(PENTAGON_ARROW_POINTS.outBottom, hubCenter),
      fromSide: "right",
      to: "past-conclusion",
      toSide: "left",
    });
  }

  return result;
}

export type PentagonUnitFrame = {
  eaKey: EAKey;
  box: Box;
};

const FRAME_PADDING = 24;

export function buildPentagonUnitFrames(
  availableCardIds: Set<string>,
  getCardBox: (cardId: string) => Box | null,
): PentagonUnitFrame[] {
  const frames: PentagonUnitFrame[] = [];

  for (const key of Object.keys(PENTAGON_VERTICES) as PentagonVertexKey[]) {
    const v = PENTAGON_VERTICES[key];
    if (!availableCardIds.has(v.cardId)) continue;
    const unitBox = unitBoxFor(v.cardId, getCardBox);
    if (!unitBox) continue;
    frames.push({
      eaKey: v.eaKey,
      box: {
        x: unitBox.x - FRAME_PADDING,
        y: unitBox.y - FRAME_PADDING,
        width: unitBox.width + FRAME_PADDING * 2,
        height: unitBox.height + FRAME_PADDING * 2,
      },
    });
  }

  return frames;
}
