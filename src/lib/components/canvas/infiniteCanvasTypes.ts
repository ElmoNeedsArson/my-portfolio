import type { EAKey } from "$lib/expertiseAreas";

export type ChipDef = {
  label: string;
  color: string;
};

export type CardSection = {
  type: "content" | "images" | "sveltecomponent" | "row" | "chips" | "pullquote";
  chips?: ChipDef[];
  accent?: string;
  content?: string;
  columns?: number;
  figureId?: string;
  homeEA?: EAKey;
  eaTags?: EAKey[];
  images?: Array<{
    src: string;
    alt: string;
    title?: string;
    caption?: string;
    imageFit?: "cover" | "contain";
    imageHeight?: number;
    figureId?: string;
  }>;
  caption?: string;
  cols?: number;
  imageFit?: "cover" | "contain";
  imageHeight?: number;
  componentName?: string;
  componentProps?: Record<string, unknown>;
  sections?: CardSection[];
};

export type CardDefinition = {
  id: string;
  title: string;
  numberOrder?: number;
  x: number;
  y: number;
  width: number;
  color: string;
  sections: CardSection[];
  columns?: number;
  paddingY?: string;
  hide?: boolean;
  layoutOnly?: boolean;
  hideHeader?: boolean;
  contentAlign?: "left" | "center";
  introTitle?: string;
  introSubtitle?: string;
  introLarge?: boolean;
  initialCenterMode?: "top" | "middle";
  navigationFitToFrame?: boolean;
  navigationMaxZoom?: number;
  navigationTopFactor?: number;
};

export type CardDefinitionInput = Omit<CardDefinition, "x" | "y"> & {
  x?: number;
  y?: number;
  offsetX?: number | string;
  offsetY?: number | string;
  relativeToCardId?: string;
};

export type CardGroupDefinition = {
  id: string;
  title: string;
  cardIds: string[];
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  borderColor?: string;
  backgroundColor?: string;
  labelTextColor?: string;
  labelBackgroundColor?: string;
};

export type ResolvedCardGroup = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderColor: string;
  backgroundColor: string;
  labelTextColor: string;
  labelBackgroundColor: string;
};

export type Waypoint = {
  relativeTo: "from" | "to";
  offsetX: number;
  offsetY: number;
};

export type Connection = {
  from?: string;
  fromSide: "top" | "bottom" | "left" | "right";
  to?: string;
  toSide: "top" | "bottom" | "left" | "right";
  fromPoint?: { x: number; y: number };
  toPoint?: { x: number; y: number };
  waypoints?: Waypoint[];
  dashed?: boolean;
  color?: string;
  opacity?: number;
  gradient?: [string, string];
  straight?: boolean;
};

export type WordCountStats = {
  titleWords: number;
  contentWords: number;
  captionWords: number;
  captionCount: number;
};
