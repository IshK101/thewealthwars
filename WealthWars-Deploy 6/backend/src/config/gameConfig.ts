export const GAME_CONFIG = {
  startingCash: 1_000,
  maxRounds: 20,
  investorProgressThresholds: { 2: 4, 3: 10 },
  investorReviewRounds: [6, 13],
  emergencyFundMilestone: 300,
  rebalanceConcentrationThreshold: 0.60,
  turnContribution: { 1: 100, 2: 175, 3: 275 },
  incomeRanges: { 1: [240, 320], 2: [400, 520], 3: [650, 800] },
  decisionCashRewards: { optimal: 120, reasonable: 50, costly: 0 },
  bond: { cost: 250, returnRate: 0.08, duration: 4 },
  property: { price: 1_600, incomeBonus: 140, maintenance: 80, maintenanceFrequency: 3 },
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
