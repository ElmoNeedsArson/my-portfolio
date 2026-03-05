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
    fromSide: "bottom",
    to: "ambition",
    toSide: "top",
    waypoints: [],
  },
  {
    from: "ambition",
    fromSide: "right",
    to: "professional-identity",
    toSide: "left",
    waypoints: [
      { relativeTo: "from", offsetX: 50, offsetY: 0 },
      { relativeTo: "to", offsetX: -50, offsetY: 0 },
    ],
  },
  {
    from: "professional-identity",
    fromSide: "right",
    to: "future-development",
    toSide: "top",
    waypoints: [{ relativeTo: "to", offsetX: 0, offsetY: -380 }],
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
      { relativeTo: "from", offsetX: 0, offsetY: 150 },
      { relativeTo: "to", offsetX: 0, offsetY: -65 },
    ],
  },
  {
    from: "future-development",
    fromSide: "bottom",
    to: "beyond-education",
    toSide: "top",
    waypoints: [
      { relativeTo: "from", offsetX: 0, offsetY: 150 },
      { relativeTo: "to", offsetX: 0, offsetY: -65 },
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
