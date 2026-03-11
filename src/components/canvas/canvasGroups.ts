import type { CardGroupDefinition } from "./infiniteCanvasTypes";

export const cardGroups: CardGroupDefinition[] = [
    {
        id: "PIV-focus-block",
        title: "PIV",
        // Example: wraps specific cards by id.
        cardIds: [
            "vision",
            "ambition",
            "professional-identity"
        ],
        padding: 38,
        borderColor: "rgba(153, 57, 57, 0.62)",
        backgroundColor: "rgba(153, 57, 57, 0.1)",
        labelTextColor: "#3e1616",
        labelBackgroundColor: "rgba(234, 247, 238, 0.95)",
    },
    {
        id: "past-focus-block",
        title: "Expertise Areas - Past Reflection",
        // Example: wraps specific cards by id.
        cardIds: [
            "past-business-and-entrepreneurship",
            "past-business-and-entrepreneurship-img",
            "past-curiosity-and-attitude",
            "past-curiosity-and-attitude-img",
            "past-math-data-and-computing",
            "past-math-data-and-computing-img",
            "past-technology-and-realization",
            "past-technology-and-realization-img",
            "past-user-and-society",
            "past-user-and-society-img",
        ],
        padding: 38,
        borderColor: "rgba(57, 153, 82, 0.62)",
        backgroundColor: "rgba(57, 153, 82, 0.10)",
        labelTextColor: "#163E22",
        labelBackgroundColor: "rgba(234, 247, 238, 0.95)",
    },
    {
        id: "present-focus-block",
        title: "Present Reflection - FMP",
        // Example: wraps specific cards by id.
        cardIds: [

        ],
        padding: 38,
        borderColor: "rgba(143, 153, 57, 0.62)",
        backgroundColor: "rgba(143, 153, 57, 0.10)",
        labelTextColor: "#3e3e16",
        labelBackgroundColor: "rgba(234, 247, 238, 0.95)",
    },
    {
        id: "future-focus-block",
        title: "Future",
        // Example: wraps specific cards by id.
        cardIds: [
            "beyond-education",
            "beyond-education-img"
        ],
        padding: 38,
        borderColor: "rgba(87, 57, 153, 0.62)",
        backgroundColor: "rgba(91, 57, 153, 0.1)",
        labelTextColor: "#1d163e",
        labelBackgroundColor: "rgba(234, 247, 238, 0.95)",
    },
];
