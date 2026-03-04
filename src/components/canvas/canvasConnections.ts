import type { Connection } from "./infiniteCanvasTypes";

export const connections: Connection[] = [
  {
    from: "intro-overview",
    fromSide: "right",
    to: "vision",
    toSide: "left",
    waypoints: [],
  },
  {
    from: "vision",
    fromSide: "right",
    to: "professional-identity",
    toSide: "left",
    waypoints: [
      { relativeTo: "from", offsetX: 1250, offsetY: 1212 },
      { relativeTo: "from", offsetX: 1250, offsetY: 511 },
    ],
  },
  {
    from: "professional-identity",
    fromSide: "right",
    to: "future-development",
    toSide: "top",
    waypoints: [{ relativeTo: "from", offsetX: 1900, offsetY: 511 }],
  },
  {
    from: "future-development",
    fromSide: "bottom",
    to: "long-term",
    toSide: "top",
    waypoints: [],
  },
  {
    from: "future-development",
    fromSide: "bottom",
    to: "short-term",
    toSide: "top",
    waypoints: [
      { relativeTo: "from", offsetX: 600, offsetY: 448 },
      { relativeTo: "from", offsetX: -700, offsetY: 448 },
    ],
  },
  {
    from: "future-development",
    fromSide: "bottom",
    to: "beyond-education",
    toSide: "top",
    waypoints: [
      { relativeTo: "from", offsetX: 600, offsetY: 448 },
      { relativeTo: "from", offsetX: 1900, offsetY: 448 },
    ],
  },
  {
    from: "long-term",
    fromSide: "bottom",
    to: "courses-year-1",
    toSide: "top",
    waypoints: [],
  },
  {
    from: "courses-year-1",
    fromSide: "bottom",
    to: "courses-year-2",
    toSide: "top",
    waypoints: [],
  },
];
