export const GAME_CONFIG = {
  startingCash: 1_000,
  maxRounds: 20,
  levelThresholds: { 2: 2_500, 3: 6_000 },
  incomeRanges: { 1: [120, 170], 2: [220, 300], 3: [360, 480] },
  bond: { cost: 250, returnRate: 0.08, duration: 4 },
  property: { price: 1_600, incomeBonus: 90, maintenance: 80, maintenanceFrequency: 3 },
  savingsTransferStep: 100,
  healthWeights: { netWorth: 0.45, liquidity: 0.20, debtHealth: 0.20, diversification: 0.15 },
  healthTargets: {
    netWorth: 6_000,
    emergencySavingsByLevel: { 1: 500, 2: 900, 3: 1_400 }
  }
} as const;

export const PLAYER_COLORS = ['#45B7E8', '#F59E42', '#D765D0', '#A3E635'];
export const PLAYER_AVATARS = ['WK', 'ST', 'PL', 'RS'];

export const INITIAL_MARKET_PRICES: Record<string, number> = {
  TECH: 100,
  CONS: 80,
  HEAL: 120,
  ENER: 90
};
