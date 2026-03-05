export type CardSection = {
  type: "content" | "images";
  content?: string;
  images?: Array<{ src: string; alt: string; caption?: string }>;
  caption?: string;
  cols?: number;
};

export type CardDefinition = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  color: string;
  sections: CardSection[];
  hideHeader?: boolean;
  contentAlign?: "left" | "center";
  introTitle?: string;
  introSubtitle?: string;
  introLarge?: boolean;
  initialCenterMode?: "top" | "middle";
};

export type CardDefinitionInput = Omit<CardDefinition, "x" | "y"> & {
  x?: number;
  y?: number;
  offsetX?: number | string;
  offsetY?: number | string;
  relativeToCardId?: string;
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
