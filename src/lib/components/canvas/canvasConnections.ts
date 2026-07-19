import type { Connection } from "./infiniteCanvasTypes";

export const connections: Connection[] = [
  {
    from: "intro-overview",
    fromSide: "right",
    to: "vision",
    toSide: "left",
  },
  {
    from: "vision",
    fromSide: "bottom",
    to: "ambition",
    toSide: "top",
  },
  {
    from: "ambition",
    fromSide: "right",
    to: "professional-identity",
    toSide: "left",
  },
  {
    from: "past-conclusion",
    fromSide: "right",
    to: "fmp-reflection",
    toSide: "left",
  },
  {
    from: "past-technology-and-realization-img",
    fromSide: "right",
    to: "beyond-education",
    toSide: "left",
    dashed: true,
  },
];
