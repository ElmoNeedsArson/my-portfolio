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
    from: "professional-identity",
    fromSide: "right",
    to: "past-business-and-entrepreneurship",
    toSide: "left",
  },
  {
    from: "professional-identity",
    fromSide: "right",
    to: "past-creativity-and-aesthetics",
    toSide: "left",
  },
  {
    from: "professional-identity",
    fromSide: "right",
    to: "past-math-data-and-computing",
    toSide: "left",
  },
  {
    from: "professional-identity",
    fromSide: "right",
    to: "past-technology-and-realization",
    toSide: "left",
  },
  {
    from: "professional-identity",
    fromSide: "right",
    to: "past-user-and-society",
    toSide: "left",
  },
  {
    from: "past-business-and-entrepreneurship-img",
    fromSide: "right",
    to: "past-conclusion",
    toSide: "left",
  },
  {
    from: "past-creativity-and-aesthetics-img",
    fromSide: "right",
    to: "past-conclusion",
    toSide: "left",
  },
  {
    from: "past-math-data-and-computing-img",
    fromSide: "right",
    to: "past-conclusion",
    toSide: "left",
  },
  {
    from: "past-technology-and-realization-img",
    fromSide: "right",
    to: "past-conclusion",
    toSide: "left",
  },
  {
    from: "past-user-and-society-img",
    fromSide: "right",
    to: "past-conclusion",
    toSide: "left",
  },
  {
    from: "past-conclusion",
    fromSide: "right",
    to: "fmp-reflection",
    toSide: "left",
  },
  {
    from: "past-technology-and-realization",
    fromSide: "right",
    to: "beyond-education",
    toSide: "left",
    dashed: true,
  },
];
