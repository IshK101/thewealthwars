import {
  CardChoice,
  FinancialHealthBreakdown,
  GameState,
  InvestmentCard,
  MarketCard,
  Player,
  ScenarioCard,
  ScheduledEffect
} from '../models/types';
import {
  GAME_CONFIG,
  INITIAL_MARKET_PRICES,
  PLAYER_AVATARS,
  PLAYER_COLORS
} from '../config/gameConfig';
import {
  DECISION_CARDS,
  INVESTMENT_CARDS,
  LIFE_EVENT_CARDS,
  MARKET_CARDS,
  OPPORTUNITY_CARDS
} from '../data/cards';

export const INITIAL_CASH = GAME_CONFIG.startingCash;
export const MAX_ROUNDS = GAME_CONFIG.maxRounds;
export const PROPERTY_PRICE = GAME_CONFIG.property.price;
export const PROPERTY_INCOME_BONUS = GAME_CONFIG.property.incomeBonus;
export const BOND_COST = GAME_CONFIG.bond.cost;
export const BOND_RETURN = Math.round(BOND_COST * (1 + GAME_CONFIG.bond.returnRate));
export const BOND_DURATION = GAME_CONFIG.bond.duration;
export const INITIAL_STOCK_PRICES = INITIAL_MARKET_PRICES;

export type TileType = 'Start' | 'Income' | 'Decision' | 'Investment' | 'Market' | 'LifeEvent' | 'Opportunity';

export const BOARD_LEVELS: Record<number, TileType[]> = {
  1: [
    'Start', 'Income', 'Decision', 'Investment', 'LifeEvent', 'Income',
    'Decision', 'Market', 'Income', 'Opportunity', 'Investment', 'Decision',
    'Income', 'LifeEvent', 'Investment', 'Market', 'Income', 'Decision',
    'Opportunity', 'Income', 'Investment', 'LifeEvent', 'Decision', 'Market'
  ],
  2: [
    'Start', 'Income', 'Decision', 'Investment', 'Market', 'Opportunity', 'LifeEvent',
    'Income', 'Decision', 'Investment', 'Market', 'Income', 'Opportunity', 'Decision',
    'LifeEvent', 'Investment', 'Income', 'Market', 'Decision', 'Opportunity', 'Income',
    'Investment', 'LifeEvent', 'Decision', 'Market', 'Income', 'Investment', 'Opportunity'
  ],
  3: [
    'Start', 'Income', 'Decision', 'Investment', 'Market', 'Opportunity', 'LifeEvent', 'Income',
    'Decision', 'Investment', 'Market', 'Income', 'Opportunity', 'Decision', 'LifeEvent', 'Investment',
    'Income', 'Market', 'Decision', 'Opportunity', 'Income', 'Investment', 'LifeEvent', 'Decision',
    'Market', 'Income', 'Investment', 'Opportunity', 'Decision', 'LifeEvent', 'Income', 'Market'
  ]
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function generateId(prefix = 'ww'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

function shuffle<T>(items: T[]): T[] {
  const result = items.map(item => ({ ...item }));
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function drawAndRotate<T>(deck: T[]): T {
  const card = deck.shift();
  if (!card) throw new Error('Cannot draw from an empty deck.');
  deck.push(card);
  return card;
}

export function initializeDecks() {
  return {
    decisionDeck: shuffle(DECISION_CARDS),
    lifeEventDeck: shuffle(LIFE_EVENT_CARDS),
    opportunityDeck: shuffle(OPPORTUNITY_CARDS),
    marketDeck: shuffle(MARKET_CARDS),
    investmentDeck: shuffle(INVESTMENT_CARDS)
  };
}

export function calculateNetWorth(player: Player, marketPrices: GameState['marketPrices']): number {
  const stockValue = Object.entries(player.portfolio.stocks).reduce(
    (sum, [symbol, count]) => sum + count * (marketPrices.stocks[symbol] || 0),
    0
  );
  const bondValue = player.portfolio.bonds.reduce((sum, bond) => sum + bond.principal, 0);
  const propertyValue = player.portfolio.properties.length * PROPERTY_PRICE;
  return Math.round(player.cash + player.emergencySavings + stockValue + bondValue + propertyValue - player.debt);
}

export function calculateFinancialHealth(
  player: Player,
  marketPrices: GameState['marketPrices']
): FinancialHealthBreakdown {
  const netWorth = calculateNetWorth(player, marketPrices);
  const worthScore = clamp((Math.max(0, netWorth) / GAME_CONFIG.healthTargets.netWorth) * 100);
  const savingsTarget = GAME_CONFIG.healthTargets.emergencySavingsByLevel[player.level];
  const liquidityScore = clamp((player.emergencySavings / savingsTarget) * 100);
  const debtRatio = player.debt / Math.max(500, player.cash + player.emergencySavings + Math.max(0, netWorth));
  const debtHealth = clamp(100 - debtRatio * 200);

  const hasEquity = ['TECH', 'HEAL', 'ENER'].some(symbol => (player.portfolio.stocks[symbol] || 0) > 0);
  const hasFund = (player.portfolio.stocks.CONS || 0) > 0;
  const categories = [
    player.emergencySavings > 0,
    hasEquity,
    hasFund,
    player.portfolio.bonds.length > 0,
    player.portfolio.properties.length > 0
  ].filter(Boolean).length;
  const diversification = clamp((Math.min(4, categories) / 4) * 100);

  const weights = GAME_CONFIG.healthWeights;
  const score = Math.round(
    worthScore * weights.netWorth +
    liquidityScore * weights.liquidity +
    debtHealth * weights.debtHealth +
    diversification * weights.diversification
  );

  const summary = [
    worthScore >= 70 ? 'Net worth is strong.' : worthScore >= 40 ? 'Net worth is developing.' : 'Net worth needs room to grow.',
    liquidityScore >= 80 ? 'Emergency fund is strong.' : liquidityScore >= 40 ? 'Emergency fund provides partial cover.' : 'Liquidity is vulnerable to surprises.',
    debtHealth >= 80 ? 'Debt is well controlled.' : debtHealth >= 50 ? 'Debt creates moderate pressure.' : 'Debt repayments are limiting flexibility.',
    diversification >= 75 ? 'Portfolio is well diversified.' : diversification >= 50 ? 'Portfolio has some diversification.' : 'Portfolio is concentrated.'
  ];

  return {
    score,
    netWorth: Math.round(worthScore),
    liquidity: Math.round(liquidityScore),
    debtHealth: Math.round(debtHealth),
    diversification: Math.round(diversification),
    summary
  };
}

function refreshPlayer(state: GameState, player: Player) {
  player.netWorth = calculateNetWorth(player, state.marketPrices);
  player.financialHealth = calculateFinancialHealth(player, state.marketPrices);
}

function refreshAllPlayers(state: GameState) {
  state.players.forEach(player => refreshPlayer(state, player));
}

export function createGame(gameId: string, lobbyPlayers: { id: string; name: string }[]): GameState {
  const decks = initializeDecks();
  const players: Player[] = lobbyPlayers.map((player, index) => ({
    id: player.id,
    name: player.name,
    avatar: PLAYER_AVATARS[index],
    color: PLAYER_COLORS[index],
    connected: true,
    cash: INITIAL_CASH,
    emergencySavings: 0,
    debt: 0,
    level: 1,
    position: 0,
    portfolio: { stocks: { TECH: 0, CONS: 0, HEAL: 0, ENER: 0 }, bonds: [], properties: [] },
    netWorth: INITIAL_CASH,
    financialHealth: { score: 0, netWorth: 0, liquidity: 0, debtHealth: 100, diversification: 0, summary: [] },
    scheduledEffects: [],
    history: [],
    temporaryIncomeBoost: 0,
    protectedTurns: 0
  }));

  const state: GameState = {
    gameId,
    status: 'playing',
    players,
    activePlayerIndex: 0,
    currentRound: 1,
    currentPhase: 'roll',
    inflationRate: 0.04,
    economy: {
      state: 'Normal Economy',
      roundLastUpdated: 1,
      explanation: 'Markets are steady. Inflation is visible but changes only through rounds and economic events.'
    },
    marketPrices: {
      stocks: { ...INITIAL_STOCK_PRICES },
      bonds: { BOND: BOND_COST },
      realEstate: { PROP: PROPERTY_PRICE }
    },
    ...decks,
    logs: ['Game started. Build wealth, protect liquidity, manage debt and diversify to win.']
  };

  refreshAllPlayers(state);
  return state;
}

export function logAction(state: GameState, message: string) {
  state.logs.unshift(`[Round ${state.currentRound}] ${message}`);
  state.logs = state.logs.slice(0, 100);
}

export function rollDice(): { d1: number; d2: number; total: number } {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return { d1, d2, total: d1 + d2 };
}

function processScheduledEffects(state: GameState, player: Player) {
  const remaining: ScheduledEffect[] = [];
  for (const effect of player.scheduledEffects) {
    effect.turnsUntilTrigger -= 1;
    if (effect.turnsUntilTrigger > 0) {
      remaining.push(effect);
      continue;
    }

    if (effect.effectType === 'debt_payment') {
      const paid = Math.min(Math.max(0, player.cash), effect.amount);
      player.cash -= paid;
      player.debt = Math.max(0, player.debt - paid);
      if (paid < effect.amount) {
        const missed = effect.amount - paid;
        const fee = Math.max(5, Math.round(missed * 0.1));
        player.debt += fee;
        logAction(state, `${player.name} could only pay $${paid} of ${effect.source}; a $${fee} late fee increased the debt burden.`);
      } else {
        logAction(state, `${player.name} paid $${paid} toward ${effect.source}.`);
      }
    } else if (effect.effectType === 'cash' || effect.effectType === 'income_boost') {
      player.cash += effect.amount;
      logAction(state, `${effect.source}: ${player.name} received $${effect.amount}.`);
    } else if (effect.effectType === 'protection') {
      player.protectedTurns += Math.max(1, effect.amount);
      logAction(state, `${player.name} gained temporary financial protection from ${effect.source}.`);
    }

    player.history.unshift({
      round: state.currentRound,
      title: effect.source,
      description: effect.description,
      amount: effect.effectType === 'debt_payment' ? -effect.amount : effect.amount
    });
    effect.remainingTriggers -= 1;
    if (effect.remainingTriggers > 0) {
      effect.turnsUntilTrigger = Math.max(1, effect.frequency);
      remaining.push(effect);
    }
  }
  player.scheduledEffects = remaining;
}

export function startTurn(state: GameState) {
  const player = state.players[state.activePlayerIndex];
  processScheduledEffects(state, player);

  const activeBonds = [] as Player['portfolio']['bonds'];
  player.portfolio.bonds.forEach(bond => {
    bond.turnsLeft -= 1;
    if (bond.turnsLeft <= 0) {
      const payout = Math.round(bond.principal * (1 + bond.interestRate));
      player.cash += payout;
      logAction(state, `${player.name}'s bond matured and paid $${payout}.`);
      player.history.unshift({ round: state.currentRound, title: 'Bond maturity', description: `A lower-risk investment returned $${payout}.`, concept: 'Risk and predictable return', amount: payout });
    } else {
      activeBonds.push(bond);
    }
  });
  player.portfolio.bonds = activeBonds;
  delete state.lastRoll;
  state.currentPhase = 'roll';
  refreshPlayer(state, player);
}

export function movePlayer(state: GameState, rollResult: number) {
  const player = state.players[state.activePlayerIndex];
  const board = BOARD_LEVELS[player.level];
  player.position = (player.position + rollResult) % board.length;
  const tile = board[player.position];
  logAction(state, `${player.name} rolled ${rollResult} and landed on ${tile}.`);
  state.currentPhase = 'tile_action';
  resolveTileAction(state, tile);
}

function setScenarioAction(state: GameState, player: Player, card: ScenarioCard) {
  state.currentPendingAction = { type: 'decision', initiatorId: player.id, details: { card } };
}

function completeImmediateAction(state: GameState) {
  delete state.currentPendingAction;
  state.currentPhase = 'end_turn';
  refreshAllPlayers(state);
  updatePlayerLevel(state, state.players[state.activePlayerIndex]);
}

export function resolveTileAction(state: GameState, tile: TileType) {
  const player = state.players[state.activePlayerIndex];
  if (tile === 'Income') {
    const [min, max] = GAME_CONFIG.incomeRanges[player.level];
    const base = Math.floor(Math.random() * (max - min + 1)) + min;
    const propertyIncome = player.portfolio.properties.length * PROPERTY_INCOME_BONUS;
    const payout = base + propertyIncome;
    player.cash += payout;
    logAction(state, `${player.name} received $${payout} income${propertyIncome ? `, including $${propertyIncome} property income` : ''}.`);
    player.history.unshift({ round: state.currentRound, title: 'Income', description: `Income added $${payout} to available cash.`, amount: payout });
    completeImmediateAction(state);
    return;
  }

  if (tile === 'Decision') {
    setScenarioAction(state, player, drawAndRotate(state.decisionDeck));
    return;
  }
  if (tile === 'LifeEvent') {
    setScenarioAction(state, player, drawAndRotate(state.lifeEventDeck));
    return;
  }
  if (tile === 'Opportunity') {
    setScenarioAction(state, player, drawAndRotate(state.opportunityDeck));
    return;
  }
  if (tile === 'Investment') {
    const allowed = state.investmentDeck.filter(card => card.minLevel <= player.level);
    const template = allowed[Math.floor(Math.random() * allowed.length)];
    const card: InvestmentCard = { ...template };
    if (card.type === 'stock' || card.type === 'fund') card.price = state.marketPrices.stocks[card.assetSymbol];
    state.currentPendingAction = { type: 'investment', initiatorId: player.id, details: { card } };
    return;
  }
  if (tile === 'Market') {
    const event = drawAndRotate(state.marketDeck);
    applyMarketCard(state, event);
    state.currentPendingAction = { type: 'event', initiatorId: player.id, details: { event } };
    return;
  }

  completeImmediateAction(state);
}

function canApplyChoice(player: Player, choice: CardChoice): boolean {
  const nextCash = player.cash + (choice.effect.cash || 0);
  const nextSavings = player.emergencySavings + (choice.effect.emergencySavings || 0);
  return nextCash >= 0 && nextSavings >= 0;
}

export function executeCardChoice(state: GameState, playerId: string, choiceId: string): boolean {
  const pending = state.currentPendingAction;
  if (!pending || pending.type !== 'decision' || pending.initiatorId !== playerId) return false;
  const card = pending.details.card as ScenarioCard;
  const choice = card.choices.find(item => item.id === choiceId);
  const player = state.players[state.activePlayerIndex];
  if (!choice || player.id !== playerId || !canApplyChoice(player, choice)) return false;

  player.cash += choice.effect.cash || 0;
  player.emergencySavings += choice.effect.emergencySavings || 0;
  player.debt = Math.max(0, player.debt + (choice.effect.debt || 0));
  Object.entries(choice.effect.shares || {}).forEach(([symbol, count]) => {
    player.portfolio.stocks[symbol] = (player.portfolio.stocks[symbol] || 0) + count;
  });
  (choice.effect.schedule || []).forEach(effect => {
    player.scheduledEffects.push({ ...effect, id: generateId('ripple'), playerId });
  });
  player.history.unshift({ round: state.currentRound, title: card.title, description: choice.explanation, concept: card.concept, amount: choice.effect.cash });
  logAction(state, `${player.name} chose “${choice.label}” on ${card.title}. ${choice.explanation}`);
  pending.details.educationalExplanation = choice.explanation;
  completeImmediateAction(state);
  return true;
}

export function executeBuyAsset(state: GameState, playerId: string): boolean {
  const pending = state.currentPendingAction;
  if (!pending || pending.type !== 'investment' || pending.initiatorId !== playerId) return false;
  const player = state.players[state.activePlayerIndex];
  const card = pending.details.card as InvestmentCard;
  if (player.id !== playerId || card.minLevel > player.level) return false;
  const totalCost = (card.type === 'stock' || card.type === 'fund') ? card.price * card.quantity : card.price;
  if (player.cash < totalCost) return false;

  player.cash -= totalCost;
  if (card.type === 'stock' || card.type === 'fund') {
    player.portfolio.stocks[card.assetSymbol] = (player.portfolio.stocks[card.assetSymbol] || 0) + card.quantity;
  } else if (card.type === 'bond') {
    player.portfolio.bonds.push({ id: generateId('bond'), purchaseRound: state.currentRound, principal: card.price, interestRate: GAME_CONFIG.bond.returnRate, turnsLeft: GAME_CONFIG.bond.duration });
  } else {
    const propertyId = generateId('property');
    player.portfolio.properties.push(propertyId);
    player.scheduledEffects.push({
      id: generateId('maintenance'), playerId, effectType: 'debt_payment', amount: GAME_CONFIG.property.maintenance,
      turnsUntilTrigger: GAME_CONFIG.property.maintenanceFrequency, remainingTriggers: MAX_ROUNDS,
      frequency: GAME_CONFIG.property.maintenanceFrequency, source: 'Property maintenance',
      description: `$${GAME_CONFIG.property.maintenance} maintenance is due every ${GAME_CONFIG.property.maintenanceFrequency} turns.`
    });
  }
  player.history.unshift({ round: state.currentRound, title: `Purchased ${card.assetName}`, description: card.description, concept: 'Risk, return and diversification', amount: -totalCost });
  logAction(state, `${player.name} invested $${totalCost} in ${card.assetName}.`);
  completeImmediateAction(state);
  return true;
}

export function executePassAsset(state: GameState, playerId: string): boolean {
  const pending = state.currentPendingAction;
  if (!pending || pending.type !== 'investment' || pending.initiatorId !== playerId) return false;
  const card = pending.details.card as InvestmentCard;
  logAction(state, `${state.players[state.activePlayerIndex].name} passed on ${card.assetName}.`);
  completeImmediateAction(state);
  return true;
}

export function acknowledgeEvent(state: GameState, playerId: string): boolean {
  const pending = state.currentPendingAction;
  if (!pending || pending.type !== 'event' || pending.initiatorId !== playerId) return false;
  completeImmediateAction(state);
  return true;
}

export function manageEmergencySavings(
  state: GameState,
  playerId: string,
  direction: 'deposit' | 'withdraw',
  amount: number = GAME_CONFIG.savingsTransferStep
): boolean {
  const player = state.players[state.activePlayerIndex];
  if (player.id !== playerId || !['roll', 'end_turn'].includes(state.currentPhase)) return false;
  const safeAmount = Math.max(0, Math.floor(amount));
  if (direction === 'deposit') {
    if (player.cash < safeAmount) return false;
    player.cash -= safeAmount;
    player.emergencySavings += safeAmount;
    logAction(state, `${player.name} moved $${safeAmount} into emergency savings.`);
  } else {
    if (player.emergencySavings < safeAmount) return false;
    player.emergencySavings -= safeAmount;
    player.cash += safeAmount;
    logAction(state, `${player.name} withdrew $${safeAmount} from emergency savings.`);
  }
  refreshPlayer(state, player);
  return true;
}

export function applyMarketCard(state: GameState, card: MarketCard) {
  Object.entries(card.assetChanges).forEach(([symbol, change]) => {
    const current = state.marketPrices.stocks[symbol];
    if (current !== undefined) state.marketPrices.stocks[symbol] = Math.max(10, Math.round(current * (1 + change)));
  });
  state.inflationRate = clamp(state.inflationRate + card.inflationDelta, 0.01, 0.12);
  state.economy = { state: card.economy, roundLastUpdated: state.currentRound, explanation: card.description };
  logAction(state, `${card.name}: ${card.description} Inflation is ${(state.inflationRate * 100).toFixed(1)}%.`);
  refreshAllPlayers(state);
}

export function triggerMarketUpdate(state: GameState) {
  const card = state.marketDeck[(state.currentRound - 1) % state.marketDeck.length];
  applyMarketCard(state, card);
  state.players.forEach(player => {
    const purchasingPowerCost = Math.round(Math.max(0, player.cash) * state.inflationRate / MAX_ROUNDS);
    if (purchasingPowerCost > 0) {
      player.cash = Math.max(0, player.cash - purchasingPowerCost);
      logAction(state, `${player.name}'s unallocated cash lost $${purchasingPowerCost} of purchasing power to inflation.`);
    }
  });
  refreshAllPlayers(state);
}

function updatePlayerLevel(state: GameState, player: Player) {
  refreshPlayer(state, player);
  let nextLevel: 2 | 3 | undefined;
  if (player.level === 1 && player.netWorth >= GAME_CONFIG.levelThresholds[2]) nextLevel = 2;
  if (player.level === 2 && player.netWorth >= GAME_CONFIG.levelThresholds[3]) nextLevel = 3;
  if (!nextLevel) return;
  player.level = nextLevel;
  player.position = 0;
  const unlocked = nextLevel === 2 ? 'bonds and broader investments' : 'property and long-term assets';
  player.history.unshift({ round: state.currentRound, title: `Level ${nextLevel} unlocked`, description: `You unlocked ${unlocked}.`, concept: 'Long-term progression' });
  logAction(state, `${player.name} advanced to Level ${nextLevel} and unlocked ${unlocked}.`);
  refreshPlayer(state, player);
}

export function endTurn(state: GameState) {
  if (state.status !== 'playing' || state.currentPhase !== 'end_turn') return;
  delete state.currentPendingAction;
  state.activePlayerIndex += 1;
  if (state.activePlayerIndex >= state.players.length) {
    state.activePlayerIndex = 0;
    state.currentRound += 1;
    if (state.currentRound > MAX_ROUNDS) {
      resolveGameEnd(state);
      return;
    }
    triggerMarketUpdate(state);
  }
  startTurn(state);
}

export function resolveGameEnd(state: GameState) {
  refreshAllPlayers(state);
  const ranked = [...state.players].sort((a, b) =>
    b.financialHealth.score - a.financialHealth.score || b.netWorth - a.netWorth
  );
  state.status = 'ended';
  state.currentPhase = 'end_turn';
  state.winnerId = ranked[0].id;
  logAction(state, `${ranked[0].name} wins with a Financial Health Score of ${ranked[0].financialHealth.score}/100 and net worth of $${ranked[0].netWorth}.`);
}

export function setPlayerConnected(state: GameState, playerId: string, connected: boolean) {
  const player = state.players.find(item => item.id === playerId);
  if (player) player.connected = connected;
}
