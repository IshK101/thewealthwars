import { InvestmentCard, MarketCard, ScenarioCard } from '../models/types';
import { GAME_CONFIG } from '../config/gameConfig';

const repayment = (source: string, amount: number, count: number) => ({
  effectType: 'debt_payment' as const,
  amount,
  turnsUntilTrigger: 1,
  remainingTriggers: count,
  frequency: 1,
  source,
  description: `$${amount} repayment due each turn for ${count} turns.`
});

export const DECISION_CARDS: ScenarioCard[] = [
  {
    id: 'decision_laptop', category: 'decision', title: 'Laptop Upgrade',
    scenario: 'Your laptop still works, but a newer model costs $500. How do you pay?',
    concept: 'Debt, liquidity and opportunity cost',
    choices: [
      { id: 'cash', label: 'Pay $500 cash', description: 'No future obligation, but less cash for emergencies.', effect: { cash: -500 }, explanation: 'Paying cash avoids debt, but reduces the liquid buffer available for the next surprise.' },
      { id: 'bnpl', label: 'Use BNPL', description: '$100 now, then $100 for the next four turns.', effect: { cash: -100, debt: 400, schedule: [repayment('Laptop BNPL', 100, 4)] }, explanation: 'BNPL protects cash today but commits future income before you know what comes next.' },
      { id: 'wait', label: 'Keep the current laptop', description: 'Spend nothing and keep your options open.', effect: {}, explanation: 'Waiting preserves liquidity, though you give up the benefits of upgrading today.' }
    ]
  },
  {
    id: 'decision_concert', category: 'decision', title: 'The Big Concert',
    scenario: 'Friends invite you to a $150 concert. It matters to you, but money is tight.',
    concept: 'Spending, values and borrowing',
    choices: [
      { id: 'buy', label: 'Buy the ticket', description: 'Pay from cash and enjoy the experience.', effect: { cash: -150 }, explanation: 'A planned experience can be worthwhile when it fits your cash flow and priorities.' },
      { id: 'skip', label: 'Skip it', description: 'Keep the full $150 available.', effect: {}, explanation: 'Skipping protects your buffer, but financial decisions also include personal value.' },
      { id: 'credit', label: 'Put it on credit', description: 'Enjoy it now and repay $55 for three turns.', effect: { debt: 165, schedule: [repayment('Concert credit', 55, 3)] }, explanation: 'Borrowing makes the experience possible now, but it costs more and reduces future flexibility.' }
    ]
  },
  {
    id: 'decision_finfluencer', category: 'decision', title: '“THIS STOCK WILL 10X”',
    scenario: 'A popular finance creator promotes Nova Tech. The post is exciting, but sponsorship is unclear.',
    concept: 'Information quality and investment risk',
    choices: [
      { id: 'buy_now', label: 'Invest immediately', description: 'Buy two shares before the post goes viral.', effect: { cash: -200, shares: { TECH: 2 } }, explanation: 'Acting on hype creates concentration risk when incentives and evidence are unknown.' },
      { id: 'research', label: 'Research first', description: 'Spend $30 on trusted research; a result arrives in two turns.', effect: { cash: -30, schedule: [{ effectType: 'cash', amount: 120, turnsUntilTrigger: 2, remainingTriggers: 1, frequency: 1, source: 'Verified market research', description: 'Your research helped you avoid hype and spot a sound opportunity.' }] }, explanation: 'Verification has a small cost, but it can improve decisions without assuming every creator is wrong.' },
      { id: 'ignore', label: 'Ignore the post', description: 'Keep your cash and take no market exposure.', effect: {}, explanation: 'Avoiding unclear information limits risk, though you may also pass on a real opportunity.' }
    ]
  }
];

export const LIFE_EVENT_CARDS: ScenarioCard[] = [
  {
    id: 'life_phone', category: 'life_event', title: 'Phone Breakdown',
    scenario: 'Your phone stops working before an important week. Repairs cost $280.',
    concept: 'Emergency funds and liquidity',
    choices: [
      { id: 'savings', label: 'Use emergency savings', description: 'Use $280 from the buffer built for surprises.', effect: { emergencySavings: -280 }, explanation: 'Emergency savings absorb shocks without creating debt or interrupting investments.' },
      { id: 'cash', label: 'Pay from cash', description: 'Cover the full repair immediately.', effect: { cash: -280 }, explanation: 'Cash solves the problem quickly, but may leave less liquidity for the next decision.' },
      { id: 'credit', label: 'Finance the repair', description: 'Repay $105 for three turns.', effect: { debt: 315, schedule: [repayment('Phone repair credit', 105, 3)] }, explanation: 'Credit keeps cash available now, but the added cost competes with future priorities.' }
    ]
  },
  {
    id: 'life_bonus', category: 'life_event', title: 'Project Bonus',
    scenario: 'A successful project earns you a surprise $300 bonus.', concept: 'Windfalls and intentional allocation',
    choices: [
      { id: 'cash', label: 'Keep it liquid', description: 'Add the full bonus to cash.', effect: { cash: 300 }, explanation: 'Keeping a windfall liquid improves flexibility but may reduce long-term growth.' },
      { id: 'save', label: 'Build the emergency fund', description: 'Put the full bonus into protected savings.', effect: { emergencySavings: 300 }, explanation: 'Directing a windfall to savings can strengthen resilience without changing normal spending.' }
    ]
  }
];

export const OPPORTUNITY_CARDS: ScenarioCard[] = [
  {
    id: 'opportunity_course', category: 'opportunity', title: 'Skills Bootcamp',
    scenario: 'A short course costs $350 and could improve your earning power.', concept: 'Human capital and long-term return',
    choices: [
      { id: 'pay', label: 'Pay for the course', description: 'Pay $350 now; earn $90 extra on your next four income tiles.', effect: { cash: -350, schedule: [{ effectType: 'income_boost', amount: 90, turnsUntilTrigger: 1, remainingTriggers: 4, frequency: 1, source: 'Skills bootcamp', description: 'Your training adds $90 to income opportunities.' }] }, explanation: 'Education can be an investment when the cost, timing and expected benefit are realistic.' },
      { id: 'loan', label: 'Use a training loan', description: 'No cash today; repay $100 for four turns and gain the same income boost.', effect: { debt: 400, schedule: [repayment('Training loan', 100, 4), { effectType: 'income_boost', amount: 90, turnsUntilTrigger: 1, remainingTriggers: 4, frequency: 1, source: 'Skills bootcamp', description: 'Your training adds $90 to income opportunities.' }] }, explanation: 'Borrowing for skills can be rational when the benefit supports repayment, but it still reduces flexibility.' },
      { id: 'pass', label: 'Pass for now', description: 'Keep your money and current income.', effect: {}, explanation: 'Passing can be sensible when liquidity matters more than an uncertain future benefit.' }
    ]
  },
  {
    id: 'opportunity_microbusiness', category: 'opportunity', title: 'Weekend Microbusiness',
    scenario: 'A friend offers a small weekend venture needing $250 up front.', concept: 'Risk, reward and delayed payoff',
    choices: [
      { id: 'invest', label: 'Back the venture', description: 'Pay $250 now; receive $410 in three turns.', effect: { cash: -250, schedule: [{ effectType: 'cash', amount: 410, turnsUntilTrigger: 3, remainingTriggers: 1, frequency: 1, source: 'Weekend microbusiness', description: 'The venture returns your capital and profit.' }] }, explanation: 'Giving up liquidity can create future value, but you must still survive until the payoff.' },
      { id: 'pass', label: 'Keep the cash', description: 'Decline the offer and preserve liquidity.', effect: {}, explanation: 'Opportunity cost works both ways: passing protects cash but gives up potential growth.' }
    ]
  }
];

export const MARKET_CARDS: MarketCard[] = [
  { id: 'market_growth', name: 'Growth Cycle', description: 'Confidence improves and most assets rise moderately.', economy: 'Growth', inflationDelta: 0.002, assetChanges: { TECH: 0.06, CONS: 0.04, HEAL: 0.03, ENER: 0.04 } },
  { id: 'market_recession', name: 'Recession', description: 'Demand weakens. Diversified and defensive assets fall less.', economy: 'Recession', inflationDelta: -0.004, assetChanges: { TECH: -0.10, CONS: -0.04, HEAL: -0.03, ENER: -0.08 } },
  { id: 'market_inflation', name: 'High Inflation', description: 'Purchasing power falls while energy and real assets strengthen.', economy: 'High Inflation', inflationDelta: 0.012, assetChanges: { TECH: -0.03, CONS: 0.01, HEAL: 0.01, ENER: 0.07 } },
  { id: 'market_rally', name: 'Market Rally', description: 'Broad optimism lifts risk assets.', economy: 'Market Rally', inflationDelta: 0, assetChanges: { TECH: 0.08, CONS: 0.05, HEAL: 0.04, ENER: 0.06 } },
  { id: 'market_correction', name: 'Market Correction', description: 'Recent gains cool without becoming a crisis.', economy: 'Market Correction', inflationDelta: -0.001, assetChanges: { TECH: -0.07, CONS: -0.03, HEAL: -0.02, ENER: -0.04 } },
  { id: 'market_normal', name: 'Normal Economy', description: 'Markets digest recent news with small mixed changes.', economy: 'Normal Economy', inflationDelta: 0, assetChanges: { TECH: 0.01, CONS: 0.01, HEAL: 0, ENER: -0.01 } }
];

export const INVESTMENT_CARDS: InvestmentCard[] = [
  { id: 'invest_tech', type: 'stock', assetSymbol: 'TECH', assetName: 'Nova Tech', price: 0, quantity: 2, risk: 'HIGH', minLevel: 1, description: 'Higher volatility with greater growth potential.' },
  { id: 'invest_health', type: 'stock', assetSymbol: 'HEAL', assetName: 'Vitalis Health', price: 0, quantity: 2, risk: 'MEDIUM', minLevel: 1, description: 'A defensive company with moderate market exposure.' },
  { id: 'invest_fund', type: 'fund', assetSymbol: 'CONS', assetName: 'Balanced Index Fund', price: 0, quantity: 3, risk: 'MEDIUM', minLevel: 1, description: 'A diversified fund designed to reduce concentration risk.' },
  { id: 'invest_energy', type: 'stock', assetSymbol: 'ENER', assetName: 'Green Grid Energy', price: 0, quantity: 2, risk: 'HIGH', minLevel: 2, description: 'A volatile sector investment sensitive to inflation and growth.' },
  { id: 'invest_bond', type: 'bond', assetSymbol: 'BOND', assetName: 'Government Bond', price: GAME_CONFIG.bond.cost, quantity: 1, risk: 'LOW', minLevel: 2, description: `Returns ${(GAME_CONFIG.bond.returnRate * 100).toFixed(0)}% after ${GAME_CONFIG.bond.duration} turns.` },
  { id: 'invest_property', type: 'property', assetSymbol: 'PROP', assetName: 'Harbor Studio', price: GAME_CONFIG.property.price, quantity: 1, risk: 'MEDIUM', minLevel: 3, description: 'Illiquid property with recurring income and maintenance costs.' }
];
