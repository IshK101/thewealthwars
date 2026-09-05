import { InvestmentCard, MarketCard, ScenarioCard } from '../models/types';
import { GAME_CONFIG } from '../config/gameConfig';
import { DECISION_CARDS as COGNITIVE_DECISION_CARDS } from './decisionCards';

const futureCash = (source: string, amount: number, turns: number) => ({
  effectType: 'cash' as const,
  amount,
  turnsUntilTrigger: turns,
  remainingTriggers: 1,
  frequency: 1,
  source,
  description: `${source} settles for $${amount} in ${turns} turns.`
});

export const DECISION_CARDS = COGNITIVE_DECISION_CARDS;

export const LIFE_EVENT_CARDS: ScenarioCard[] = [
  {
    id: 'life_dividend', category: 'life_event', title: 'Dividend Distribution',
    scenario: 'Several holdings distribute cash. Decide whether the portfolio should consume or compound it.',
    concept: 'Dividend reinvestment', tip: 'Reinvested distributions can purchase additional assets that generate future returns.',
    choices: [
      { id: 'reinvest', label: 'Reinvest automatically', description: 'Add 1 Balanced Fund share.', effect: { shares: { CONS: 1 } }, explanation: 'Automatic reinvestment keeps distributions compounding instead of leaving them idle.' },
      { id: 'cash', label: 'Keep the distribution in cash', description: 'Receive $90 in liquid cash.', effect: { cash: 90 }, explanation: 'Cash improves flexibility, though it no longer participates in market growth.' }
    ]
  },
  {
    id: 'life_fund_fee', category: 'life_event', title: 'Fund Fee Review',
    scenario: 'You discover an expensive fund charging more than a similar diversified alternative.',
    concept: 'Fees and long-term compounding', tip: 'Small annual fee differences can compound into large differences over long horizons.',
    choices: [
      { id: 'switch', label: 'Switch to the lower-cost option', description: 'Pay $25 now and receive $140 in 3 turns.', effect: { cash: -25, schedule: [futureCash('Lower investment fees', 140, 3)] }, explanation: 'Reducing recurring costs allows more of the portfolio return to remain invested.' },
      { id: 'review', label: 'Review before switching', description: 'Gain 10% off your next trade.', effect: { tradeDiscountPercent: 0.10, tradeDiscountUses: 1 }, explanation: 'Costs matter, but tax, spread and strategy differences should be checked before changing funds.' }
    ]
  },
  {
    id: 'life_tax_documents', category: 'life_event', title: 'Investment Tax Documents',
    scenario: 'Portfolio records need attention before the filing deadline.',
    concept: 'Recordkeeping and after-tax return', tip: 'Investment performance should be evaluated after fees and taxes, not only by headline return.',
    choices: [
      { id: 'organize', label: 'Organize records early', description: 'Pay $40 and gain one downside shield.', effect: { cash: -40, downsideShieldUses: 1 }, explanation: 'Good records reduce avoidable costs and make portfolio decisions easier to evaluate.' },
      { id: 'delay', label: 'Delay the paperwork', description: 'Pay a $90 late cost in 2 turns.', effect: { schedule: [futureCash('Late filing cost', -90, 2)] }, explanation: 'Administrative delays can create preventable costs that reduce investable capital.' }
    ]
  }
];

export const OPPORTUNITY_CARDS: ScenarioCard[] = [
  {
    id: 'opportunity_analyst', category: 'opportunity', title: 'Independent Analyst Brief',
    scenario: 'A rigorous report identifies valuation risks and a disciplined entry range.',
    concept: 'Research edge', tip: 'Useful research clarifies assumptions and risks; it does not guarantee a return.',
    choices: [
      { id: 'entry_range', label: 'Use the disciplined entry range', description: 'Receive 20% off your next investment.', effect: { tradeDiscountPercent: 0.20, tradeDiscountUses: 1 }, explanation: 'A valuation-aware entry can create a margin of safety without pretending the exact bottom is knowable.' },
      { id: 'risk_report', label: 'Use the risk analysis', description: 'Gain one downside shield.', effect: { downsideShieldUses: 1 }, explanation: 'Understanding downside scenarios helps protect the ability to stay invested through volatility.' }
    ]
  },
  {
    id: 'opportunity_insider', category: 'opportunity', title: 'Confidential Earnings Memo',
    scenario: 'You receive material non-public information before the market. Wealth Wars allows a game-only edge choice.',
    concept: 'Game-only insider information', tip: 'INSIDER TRADING DISCLAIMER: Trading on material non-public information is illegal in real life. This mechanic exists only to make the fictional game more interesting.',
    gameOnlyInsiderMechanic: true,
    choices: [
      { id: 'game_edge', label: 'Use the fictional game edge', description: 'Receive 25% off your next stock or asset purchase.', effect: { tradeDiscountPercent: 0.25, tradeDiscountUses: 1 }, explanation: 'Game-only benefit applied. In real markets, trading material non-public information is illegal.' },
      { id: 'report_it', label: 'Report it and use public research', description: 'Gain two downside shields.', effect: { downsideShieldUses: 2 }, explanation: 'Real investing should rely on lawful, public information and a repeatable research process.' }
    ]
  },
  {
    id: 'opportunity_fee_waiver', category: 'opportunity', title: 'Low-Cost Brokerage Window',
    scenario: 'A temporary execution offer reduces the cost of building positions.',
    concept: 'Transaction costs', tip: 'Lower costs help most when they support a plan—not when they encourage unnecessary trading.',
    choices: [
      { id: 'two_trades', label: 'Use the offer for planned buys', description: 'Receive 15% off your next two investments.', effect: { tradeDiscountPercent: 0.15, tradeDiscountUses: 2 }, explanation: 'Lower execution cost improves outcomes when the trades already fit a long-term allocation.' },
      { id: 'avoid_overtrade', label: 'Avoid unnecessary activity', description: 'Receive $100 in two turns.', effect: { schedule: [futureCash('Trading costs avoided', 100, 2)] }, explanation: 'Not trading can be the right choice when the portfolio already matches its plan.' }
    ]
  },
  {
    id: 'opportunity_hedge', category: 'opportunity', title: 'Portfolio Stress-Test Session',
    scenario: 'A risk specialist models a severe correction before it happens.',
    concept: 'Downside planning', tip: 'Stress tests reveal where concentration and liquidity could force poor decisions during a decline.',
    choices: [
      { id: 'hedge', label: 'Apply the downside plan', description: 'Gain two market-downside shields.', effect: { downsideShieldUses: 2 }, explanation: 'The plan offsets the next modeled market losses, helping you remain invested.' },
      { id: 'buy_list', label: 'Build a correction buy list', description: 'Receive 20% off your next investment.', effect: { tradeDiscountPercent: 0.20, tradeDiscountUses: 1 }, explanation: 'A prepared buy list turns volatility into a deliberate decision instead of an emotional reaction.' }
    ]
  }
];

export const MARKET_CARDS: MarketCard[] = [
  { id: 'market_growth', name: 'Growth Cycle', description: 'Earnings accelerate and risk assets move sharply higher.', economy: 'Growth', inflationDelta: 0.002, assetChanges: { TECH: 0.11, CONS: 0.07, HEAL: 0.05, ENER: 0.08 } },
  { id: 'market_recession', name: 'Recession', description: 'Demand contracts. Diversified and defensive assets absorb the shock better.', economy: 'Recession', inflationDelta: -0.004, assetChanges: { TECH: -0.15, CONS: -0.07, HEAL: -0.06, ENER: -0.12 } },
  { id: 'market_inflation', name: 'High Inflation', description: 'Purchasing power falls while energy surges and growth shares reprice.', economy: 'High Inflation', inflationDelta: 0.012, assetChanges: { TECH: -0.07, CONS: 0.02, HEAL: 0.01, ENER: 0.13 } },
  { id: 'market_rally', name: 'Market Rally', description: 'Broad optimism triggers a powerful risk-asset rally.', economy: 'Market Rally', inflationDelta: 0, assetChanges: { TECH: 0.16, CONS: 0.09, HEAL: 0.07, ENER: 0.12 } },
  { id: 'market_correction', name: 'Market Correction', description: 'Recent gains reverse quickly and test portfolio discipline.', economy: 'Market Correction', inflationDelta: -0.001, assetChanges: { TECH: -0.11, CONS: -0.05, HEAL: -0.04, ENER: -0.08 } },
  { id: 'market_normal', name: 'Active Market', description: 'Fresh information produces meaningful but mixed price moves.', economy: 'Normal Economy', inflationDelta: 0, assetChanges: { TECH: 0.04, CONS: 0.02, HEAL: 0.01, ENER: -0.03 } }
];

export const INVESTMENT_CARDS: InvestmentCard[] = [
  { id: 'invest_tech', type: 'stock', assetSymbol: 'TECH', assetName: 'Nova Tech', price: 0, quantity: 1, risk: 'HIGH', minLevel: 1, description: 'Higher volatility with greater growth potential.' },
  { id: 'invest_health', type: 'stock', assetSymbol: 'HEAL', assetName: 'Vitalis Health', price: 0, quantity: 1, risk: 'MEDIUM', minLevel: 1, description: 'A defensive company with moderate market exposure.' },
  { id: 'invest_fund', type: 'fund', assetSymbol: 'CONS', assetName: 'Balanced Index Fund', price: 0, quantity: 1, risk: 'MEDIUM', minLevel: 1, description: 'A diversified fund designed to reduce concentration risk.' },
  { id: 'invest_energy', type: 'stock', assetSymbol: 'ENER', assetName: 'Green Grid Energy', price: 0, quantity: 1, risk: 'HIGH', minLevel: 2, description: 'A volatile sector investment sensitive to inflation and growth.' },
  { id: 'invest_bond', type: 'bond', assetSymbol: 'BOND', assetName: 'Government Bond', price: GAME_CONFIG.bond.cost, quantity: 1, risk: 'LOW', minLevel: 2, description: `Returns ${(GAME_CONFIG.bond.returnRate * 100).toFixed(0)}% after ${GAME_CONFIG.bond.duration} turns.` },
  { id: 'invest_property', type: 'property', assetSymbol: 'PROP', assetName: 'Harbor Studio', price: GAME_CONFIG.property.price, quantity: 1, risk: 'MEDIUM', minLevel: 3, description: 'Illiquid property with recurring income and maintenance costs.' }
];
