export type EAKey = 'b_e' | 'c_a' | 'm_d_c' | 't_r' | 'u_s';

export type ExpertiseArea = {
  key: EAKey;
  label: string;
  base: string;
  tint: string;
  cssVar: string;
  cardIds: string[];
};

export const EA_AREAS: Record<EAKey, ExpertiseArea> = {
  b_e: {
    key: 'b_e',
    label: 'Business & Entrepreneurship',
    base: '#8A6BA6',
    tint: 'rgba(138, 107, 166, 0.35)',
    cssVar: '--ea-b_e-base',
    cardIds: [
      'past-business-and-entrepreneurship',
      'past-business-and-entrepreneurship-img',
    ],
  },
  c_a: {
    key: 'c_a',
    label: 'Creativity & Aesthetics',
    base: '#C76B4A',
    tint: 'rgba(199, 107, 74, 0.35)',
    cssVar: '--ea-c_a-base',
    cardIds: [
      'past-creativity-and-aesthetics',
      'past-creativity-and-aesthetics-img',
    ],
  },
  m_d_c: {
    key: 'm_d_c',
    label: 'Math, Data & Computing',
    base: '#C99A3B',
    tint: 'rgba(201, 154, 59, 0.35)',
    cssVar: '--ea-m_d_c-base',
    cardIds: [
      'past-math-data-and-computing',
      'past-math-data-and-computing-img',
    ],
  },
  t_r: {
    key: 't_r',
    label: 'Technology & Realization',
    base: '#3E7CA6',
    tint: 'rgba(62, 124, 166, 0.35)',
    cssVar: '--ea-t_r-base',
    cardIds: [
      'past-technology-and-realization',
      'past-technology-and-realization-img',
    ],
  },
  u_s: {
    key: 'u_s',
    label: 'User & Society',
    base: '#6E8B5B',
    tint: 'rgba(110, 139, 91, 0.35)',
    cssVar: '--ea-u_s-base',
    cardIds: [
      'past-user-and-society',
      'past-user-and-society-img',
    ],
  },
};

export const EA_LIST: ExpertiseArea[] = Object.values(EA_AREAS);

export function eaForCard(cardId: string): ExpertiseArea | undefined {
  return EA_LIST.find((ea) => ea.cardIds.includes(cardId));
}
