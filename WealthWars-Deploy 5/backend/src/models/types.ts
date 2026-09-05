export type GamePhase = 'roll' | 'tile_action' | 'market_update' | 'end_turn';

export type EconomyState =
  | 'Normal Economy'
  | 'Growth'
  | 'Recession'
  | 'High Inflation'
  | 'Market Rally'
  | 'Market Correction';

export type AssetClass = 'stock' | 'fund' | 'bond' | 'property';

export interface BondHolding {
  id: string;
  purchaseRound: number;
  principal: number;
  interestRate: number;
  turnsLeft: number;
}

export interface ScheduledEffect {
  id: string;
  playerId: string;
  effectType: 'cash' | 'debt_payment' | 'income_boost' | 'protection';
  amount: number;
  turnsUntilTrigger: number;
  remainingTriggers: number;
  frequency: number;
  source: string;
  description: string;
}

export interface PlayerHistoryEntry {
  round: number;
  title: string;
  description: string;
  concept?: string;
  amount?: number;
}

export interface FinancialHealthBreakdown {
  score: number;
  netWorth: number;
  liquidity: number;
  debtHealth: number;
  diversification: number;
  summary: string[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  connected: boolean;
  cash: number;
  emergencySavings: number;
  debt: number;
  level: 1 | 2 | 3;
  position: number;
  portfolio: {
    stocks: Record<string, number>;
    stockCostBasis: Record<string, number>;
    bonds: BondHolding[];
    properties: string[];
  };
  netWorth: number;
  financialHealth: FinancialHealthBreakdown;
  scheduledEffects: ScheduledEffect[];
  history: PlayerHistoryEntry[];
  temporaryIncomeBoost: number;
  protectedTurns: number;
  investmentPerks: {
    nextTradeDiscount: number;
    discountUses: number;
    downsideShieldUses: number;
  };
  investorProgress: number;
  progressMilestones: string[];
  socialInfluenceProfile: {
    decisionsTracked: number;
    verification: number;
    hypePull: number;
    independentJudgment: number;
    patternTitle: string;
    lastInsight: string;
  };
}

export interface CardEffect {
  cash?: number;
  emergencySavings?: number;
  debt?: number;
  shares?: Record<string, number>;
  schedule?: Array<Omit<ScheduledEffect, 'id' | 'playerId'>>;
  tradeDiscountPercent?: number;
  tradeDiscountUses?: number;
  downsideShieldUses?: number;
}

export interface CardChoice {
  id: string;
  label: string;
  description: string;
  effect: CardEffect;
  explanation: string;
  outcome?: 'optimal' | 'reasonable' | 'costly';
  bias?: string;
  impact?: string;
  socialInfluence?: {
    verification: number;
    hypePull: number;
    independentJudgment: number;
    insight: string;
  };
}

export type ScenarioCardCategory = 'decision' | 'life_event' | 'opportunity';

export interface ScenarioCard {
  id: string;
  category: ScenarioCardCategory;
  title: string;
  scenario: string;
  concept: string;
  minLevel?: 1 | 2 | 3;
  maxLevel?: 1 | 2 | 3;
  tip: string;
  objective?: string;
  evidence?: string[];
  socialMediaScenario?: boolean;
  socialSource?: string;
  gameOnlyInsiderMechanic?: boolean;
  choices: CardChoice[];
}

export interface MarketCard {
  id: string;
  name: string;
  description: string;
  economy: EconomyState;
  inflationDelta: number;
  assetChanges: Record<string, number>;
}

export interface InvestmentCard {
  id: string;
  type: AssetClass;
  assetSymbol: string;
  assetName: string;
  price: number;
  quantity: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  minLevel: 1 | 2 | 3;
  description: string;
}

export interface PendingAction {
  type: 'investment' | 'decision' | 'event';
  initiatorId: string;
  details: {
    card?: InvestmentCard | ScenarioCard;
    event?: MarketCard;
    educationalExplanation?: string;
    [key: string]: unknown;
  };
}

export interface GameState {
  gameId: string;
  status: 'playing' | 'ended';
  players: Player[];
  activePlayerIndex: number;
  currentRound: number;
  currentPhase: GamePhase;
  inflationRate: number;
  economy: {
    state: EconomyState;
    roundLastUpdated: number;
    explanation: string;
  };
  marketPrices: {
    stocks: Record<string, number>;
    bonds: Record<string, number>;
    realEstate: Record<string, number>;
  };
  decisionDeck: ScenarioCard[];
  lifeEventDeck: ScenarioCard[];
  opportunityDeck: ScenarioCard[];
  marketDeck: MarketCard[];
  investmentDeck: InvestmentCard[];
  currentPendingAction?: PendingAction;
  winnerId?: string;
  logs: string[];
  lastRoll?: {
    d1: number;
    d2: number;
    total: number;
    playerId: string;
    rollId: string;
  };
}
