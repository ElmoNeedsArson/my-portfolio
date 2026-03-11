export type CardSection = {
  type: "content" | "images";
  content?: string;
  images?: Array<{
    src: string;
    alt: string;
    title?: string;
    caption?: string;
    imageFit?: "cover" | "contain";
    imageHeight?: number;
  }>;
  caption?: string;
  cols?: number;
  imageFit?: "cover" | "contain";
  imageHeight?: number;
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
  hide?: boolean;
  hideHeader?: boolean;
  contentAlign?: "left" | "center";
  introTitle?: string;
  introSubtitle?: string;
  introLarge?: boolean;
  initialCenterMode?: "top" | "middle";
  navigationFitToFrame?: boolean;
  navigationMaxZoom?: number;
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
  // Explicit card ids this group should wrap.
  cardIds: string[];
  padding?: number;
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
  from: string;
  fromSide: "top" | "bottom" | "left" | "right";
  to: string;
  toSide: "top" | "bottom" | "left" | "right";
  waypoints?: Waypoint[];
};

export type WordCountStats = {
  titleWords: number;
  contentWords: number;
  captionWords: number;
  captionCount: number;
};
