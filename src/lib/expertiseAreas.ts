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
    base: '#4473C5',
    tint: 'rgba(68, 115, 197, 0.35)',
    cssVar: '--ea-b_e-base',
    cardIds: [
      'past-business-and-entrepreneurship',
      'past-business-and-entrepreneurship-img',
    ],
  },
  c_a: {
    key: 'c_a',
    label: 'Creativity & Aesthetics',
    base: '#ED7D31',
    tint: 'rgba(237, 125, 49, 0.35)',
    cssVar: '--ea-c_a-base',
    cardIds: [
      'past-creativity-and-aesthetics',
      'past-creativity-and-aesthetics-img',
    ],
  },
  m_d_c: {
    key: 'm_d_c',
    label: 'Math, Data & Computing',
    base: '#7030A0',
    tint: 'rgba(112, 48, 160, 0.35)',
    cssVar: '--ea-m_d_c-base',
    cardIds: [
      'past-math-data-and-computing',
      'past-math-data-and-computing-img',
    ],
  },
  t_r: {
    key: 't_r',
    label: 'Technology & Realization',
    base: '#FFC000',
    tint: 'rgba(255, 192, 0, 0.35)',
    cssVar: '--ea-t_r-base',
    cardIds: [
      'past-technology-and-realization',
      'past-technology-and-realization-img',
    ],
  },
  u_s: {
    key: 'u_s',
    label: 'User & Society',
    base: '#70AD46',
    tint: 'rgba(112, 173, 70, 0.35)',
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
