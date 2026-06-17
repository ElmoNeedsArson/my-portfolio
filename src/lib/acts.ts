export type ActId = 1 | 2 | 3 | 4;

export type Act = {
  id: ActId;
  label: string;
  description: string;
  cardIds: string[];
  bandColor: string;
};

export const ACTS: Act[] = [
  {
    id: 1,
    label: 'I · Identity',
    description: 'Who I am',
    cardIds: [
      'intro-overview',
      'vision',
      'ambition',
      'professional-identity',
      'professional-identity-img',
    ],
    bandColor: 'rgba(250, 200, 187, 0.16)',
  },
  {
    id: 2,
    label: 'II · Past',
    description: 'Pre-FMP history and evidence',
    cardIds: [
      'past-business-and-entrepreneurship',
      'past-business-and-entrepreneurship-img',
      'past-creativity-and-aesthetics',
      'past-creativity-and-aesthetics-img',
      'past-math-data-and-computing',
      'past-math-data-and-computing-img',
      'past-technology-and-realization',
      'past-technology-and-realization-img',
      'past-user-and-society',
      'past-user-and-society-img',
    ],
    bandColor: 'rgba(195, 210, 240, 0.11)',
  },
  {
    id: 3,
    label: 'III · Present',
    description: 'FMP and synthesis',
    cardIds: [
      'past-conclusion',
      'fmp-reflection',
    ],
    bandColor: 'rgba(200, 185, 165, 0.13)',
  },
  {
    id: 4,
    label: 'IV · Future',
    description: 'Where I go',
    cardIds: [
      'beyond-education',
    ],
    bandColor: 'rgba(110, 139, 91, 0.14)',
  },
];

export function actForCard(cardId: string): Act | undefined {
  return ACTS.find((act) => act.cardIds.includes(cardId));
}
