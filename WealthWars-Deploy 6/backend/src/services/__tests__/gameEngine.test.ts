import {
  BOND_RETURN,
  BOARD_LEVELS,
  calculateFinancialHealth,
  calculateNetWorth,
  createGame,
  endTurn,
  executeDirectInvestment,
  executeDirectSale,
  executeBuyAsset,
  executeCardChoice,
  manageEmergencySavings,
  movePlayer,
  applyMarketCard,
  resolveTileAction,
  resolveGameEnd,
  startTurn
} from '../gameEngine';
import { DECISION_CARDS, INVESTMENT_CARDS } from '../../data/cards';

const players = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Charlie' }
];

function answerDecision(
  game: ReturnType<typeof createGame>,
  cardId: string,
  choiceId: string,
  extraDetails: Record<string, unknown> = {}
) {
  const card = DECISION_CARDS.find(item => item.id === cardId)!;
  game.currentPendingAction = { type: 'decision', initiatorId: 'p1', details: { card, ...extraDetails } };
  game.currentPhase = 'tile_action';
  return executeCardChoice(game, 'p1', choiceId);
}

describe('Wealth Wars v2 game engine', () => {
  test('initializes a synchronized 3-player game without legacy industries', () => {
    const game = createGame('TEST', players);
    expect(game.players).toHaveLength(3);
    expect(game.currentRound).toBe(1);
    expect(game.inflationRate).toBe(0.04);
    expect(game.economy.state).toBe('Normal Economy');
    game.players.forEach(player => {
      expect(player.cash).toBe(1000);
      expect(player.emergencySavings).toBe(0);
      expect(player.debt).toBe(0);
      expect(player.portfolio.stockCostBasis).toEqual({ TECH: 0, CONS: 0, HEAL: 0, ENER: 0 });
      expect(player.investorProgress).toBe(0);
      expect(player.progressMilestones).toEqual([]);
      expect(player.socialInfluenceProfile).toEqual({
        decisionsTracked: 0,
        verification: 50,
        hypePull: 50,
        independentJudgment: 50,
        patternTitle: 'Pattern forming',
        lastInsight: expect.any(String)
      });
      expect(player.financialHealth.score).toBeGreaterThan(0);
      expect((player as unknown as Record<string, unknown>).industry).toBeUndefined();
    });
  });

  test('net worth includes savings and subtracts debt', () => {
    const game = createGame('TEST', players);
    const player = game.players[0];
    player.cash = 500;
    player.emergencySavings = 300;
    player.debt = 200;
    player.portfolio.stocks.TECH = 2;
    expect(calculateNetWorth(player, game.marketPrices)).toBe(800);
  });

  test('board loops cleanly and opens a data-driven decision', () => {
    const game = createGame('TEST', players);
    game.players[0].position = BOARD_LEVELS[1].length - 2;
    movePlayer(game, 4);
    expect(game.players[0].position).toBe(2);
    expect(game.currentPendingAction?.type).toBe('decision');
  });

  test('decision questions change with the player investment level', () => {
    const game = createGame('TEST', players);
    game.players[0].level = 2;
    resolveTileAction(game, 'Decision');
    const card = game.currentPendingAction?.details.card as (typeof DECISION_CARDS)[number];
    expect(card.minLevel).toBe(2);
    expect(card.maxLevel).toBe(2);
    expect(card.objective).toBeTruthy();
    expect(card.evidence).toHaveLength(3);
  });

  test('players can invest outside their own turn without landing on a tile', () => {
    const game = createGame('TEST', players);
    const result = executeDirectInvestment(game, 'p2', 'CONS', 2);
    expect(result.ok).toBe(true);
    expect(game.players[1].portfolio.stocks.CONS).toBe(2);
    expect(game.players[1].cash).toBe(840);
    expect(game.currentPendingAction).toBeUndefined();
  });

  test('research-edge choices discount the next direct investment', () => {
    const game = createGame('TEST', players);
    const card = DECISION_CARDS.find(item => item.id === 'decision_l1_herding')!;
    game.currentPendingAction = { type: 'decision', initiatorId: 'p1', details: { card } };
    game.currentPhase = 'tile_action';
    expect(executeCardChoice(game, 'p1', 'verify_independently')).toBe(true);
    const result = executeDirectInvestment(game, 'p1', 'TECH', 1);
    expect(result.ok).toBe(true);
    expect(result.totalCost).toBe(85);
    expect(result.discountSaved).toBe(15);
    expect(game.players[0].investmentPerks.discountUses).toBe(0);
  });

  test('decision cards have clear evidence, graded outcomes, and named bias traps', () => {
    DECISION_CARDS.forEach(card => {
      expect(card.objective).toBeTruthy();
      expect(card.evidence).toHaveLength(3);
      expect(card.choices.map(choice => choice.outcome)).toEqual(
        expect.arrayContaining(['optimal', 'reasonable', 'costly'])
      );
      const costlyChoice = card.choices.find(choice => choice.outcome === 'costly');
      expect(costlyChoice?.bias).toBeTruthy();
      expect(costlyChoice?.impact).toBeTruthy();
    });
  });

  test('social-media decisions appear at every level with explicit influence signals', () => {
    const socialCards = DECISION_CARDS.filter(card => card.socialMediaScenario);
    expect(socialCards.length).toBeGreaterThanOrEqual(4);
    expect(new Set(socialCards.map(card => card.minLevel))).toEqual(new Set([1, 2, 3]));
    socialCards.forEach(card => {
      expect(card.socialSource).toBeTruthy();
      card.choices.forEach(choice => expect(choice.socialInfluence).toBeDefined());
    });
  });

  test('social-media choices update the private influence pattern in both directions', () => {
    const evidenceLedGame = createGame('TEST', players);
    expect(answerDecision(evidenceLedGame, 'decision_l1_herding', 'verify_independently')).toBe(true);
    expect(evidenceLedGame.players[0].socialInfluenceProfile).toMatchObject({
      decisionsTracked: 1,
      verification: 68,
      hypePull: 38,
      independentJudgment: 60,
      patternTitle: 'Evidence-led'
    });

    const hypeLedGame = createGame('TEST', players);
    expect(answerDecision(hypeLedGame, 'decision_l1_herding', 'follow_crowd')).toBe(true);
    expect(hypeLedGame.players[0].socialInfluenceProfile).toMatchObject({
      decisionsTracked: 1,
      verification: 38,
      hypePull: 68,
      independentJudgment: 40,
      patternTitle: 'Hype-sensitive'
    });
  });

  test('ordinary investment decisions do not change the social influence pattern', () => {
    const game = createGame('TEST', players);
    expect(answerDecision(game, 'decision_l1_familiarity', 'diversified_core')).toBe(true);
    expect(game.players[0].socialInfluenceProfile.decisionsTracked).toBe(0);
    expect(game.players[0].socialInfluenceProfile.patternTitle).toBe('Pattern forming');
  });

  test('decision quality awards 2, 1, or 0 Investor Progress points', () => {
    const strongest = createGame('STRONGEST', players);
    expect(answerDecision(strongest, 'decision_l1_herding', 'verify_independently')).toBe(true);
    expect(strongest.players[0].investorProgress).toBe(2);
    expect(strongest.players[0].cash).toBe(1120);

    const defensible = createGame('DEFENSIBLE', players);
    expect(answerDecision(defensible, 'decision_l1_loss_aversion', 'hold_review')).toBe(true);
    expect(defensible.players[0].investorProgress).toBe(1);
    expect(defensible.players[0].cash).toBe(1050);

    const biasTrap = createGame('BIAS', players);
    expect(answerDecision(biasTrap, 'decision_l1_loss_aversion', 'panic_exit')).toBe(true);
    expect(biasTrap.players[0].investorProgress).toBe(0);
    expect(biasTrap.players[0].cash).toBe(910);
  });

  test('every turn creates investable cash flow before tile rewards', () => {
    const game = createGame('CASHFLOW', players);
    for (let turn = 0; turn < 20; turn += 1) movePlayer(game, BOARD_LEVELS[1].length);
    expect(game.players[0].cash).toBe(3000);
    expect(game.players[0].history.filter(entry => entry.title === 'Investable cash flow')).toHaveLength(20);
  });

  test('five strongest decisions can unlock Level 3 within a 20-round game', () => {
    const game = createGame('PACE', players);
    expect(answerDecision(game, 'decision_l1_herding', 'verify_independently')).toBe(true);
    expect(answerDecision(game, 'decision_l1_herding', 'verify_independently')).toBe(true);
    expect(game.players[0].investorProgress).toBe(4);
    expect(game.players[0].level).toBe(2);
    expect(game.players[0].investmentPerks.nextTradeDiscount).toBeGreaterThanOrEqual(0.15);

    for (let index = 0; index < 3; index += 1) {
      expect(answerDecision(game, 'decision_l2_confirmation', 'test_both_sides')).toBe(true);
    }
    expect(game.players[0].investorProgress).toBe(10);
    expect(game.players[0].level).toBe(3);
    expect(game.players[0].investmentPerks.nextTradeDiscount).toBe(0.20);
    expect(game.players[0].investmentPerks.downsideShieldUses).toBeGreaterThanOrEqual(1);
  });

  test('rounds 6 and 13 guarantee one Investor Review without consuming the dice turn', () => {
    const game = createGame('REVIEW', players);
    game.currentRound = 6;
    startTurn(game);
    expect(game.currentPendingAction?.type).toBe('decision');
    expect(game.currentPendingAction?.details.tileSource).toBe('Investor Review');
    const card = game.currentPendingAction?.details.card as (typeof DECISION_CARDS)[number];
    const strongestChoice = card.choices.find(choice => choice.outcome === 'optimal')!;
    expect(executeCardChoice(game, 'p1', strongestChoice.id)).toBe(true);
    expect(game.currentPhase).toBe('roll');
    expect(game.players[0].progressMilestones).toContain('investor_review_round_6');

    startTurn(game);
    expect(game.currentPendingAction).toBeUndefined();
    expect(game.currentPhase).toBe('roll');
  });

  test('portfolio milestones award only once and cannot be farmed', () => {
    const game = createGame('MILESTONES', players);
    const player = game.players[0];

    expect(manageEmergencySavings(game, 'p1', 'deposit', 300)).toBe(true);
    expect(player.investorProgress).toBe(1);
    expect(manageEmergencySavings(game, 'p1', 'withdraw', 300)).toBe(true);
    expect(manageEmergencySavings(game, 'p1', 'deposit', 300)).toBe(true);
    expect(player.investorProgress).toBe(1);

    expect(executeDirectInvestment(game, 'p1', 'CONS', 1).ok).toBe(true);
    expect(executeDirectInvestment(game, 'p1', 'TECH', 1).ok).toBe(true);
    expect(player.investorProgress).toBe(2);
    expect(executeDirectSale(game, 'p1', 'TECH', 1).ok).toBe(true);
    expect(executeDirectInvestment(game, 'p1', 'TECH', 1).ok).toBe(true);
    expect(player.investorProgress).toBe(2);

    player.investmentPerks.nextTradeDiscount = 0.10;
    player.investmentPerks.discountUses = 1;
    expect(executeDirectInvestment(game, 'p1', 'HEAL', 1).ok).toBe(true);
    expect(player.investorProgress).toBe(3);
    player.investmentPerks.nextTradeDiscount = 0.10;
    player.investmentPerks.discountUses = 1;
    expect(executeDirectInvestment(game, 'p1', 'HEAL', 1).ok).toBe(true);
    expect(player.investorProgress).toBe(3);
  });

  test('holding a bond to maturity and disciplined rebalancing each award once', () => {
    const bondGame = createGame('BOND_PROGRESS', players);
    const bondPlayer = bondGame.players[0];
    bondPlayer.level = 2;
    expect(executeDirectInvestment(bondGame, 'p1', 'BOND', 1).ok).toBe(true);
    for (let turn = 0; turn < 4; turn += 1) startTurn(bondGame);
    expect(bondPlayer.progressMilestones).toContain('bond_maturity');
    expect(bondPlayer.investorProgress).toBe(1);
    startTurn(bondGame);
    expect(bondPlayer.investorProgress).toBe(1);

    const rebalanceGame = createGame('REBALANCE', players);
    const rebalancePlayer = rebalanceGame.players[0];
    rebalancePlayer.portfolio.stocks.TECH = 10;
    rebalancePlayer.portfolio.stocks.CONS = 1;
    expect(executeDirectSale(rebalanceGame, 'p1', 'TECH', 2).ok).toBe(true);
    expect(rebalancePlayer.progressMilestones).toContain('disciplined_rebalance');
    expect(rebalancePlayer.investorProgress).toBe(1);
    expect(executeDirectSale(rebalanceGame, 'p1', 'TECH', 2).ok).toBe(true);
    expect(rebalancePlayer.investorProgress).toBe(1);
  });

  test('players can sell stock at its current market price', () => {
    const game = createGame('TEST', players);
    expect(executeDirectInvestment(game, 'p1', 'CONS', 3).ok).toBe(true);
    const result = executeDirectSale(game, 'p1', 'CONS', 2);
    expect(result.ok).toBe(true);
    expect(game.players[0].portfolio.stocks.CONS).toBe(1);
    expect(game.players[0].portfolio.stockCostBasis.CONS).toBe(80);
    expect(game.players[0].cash).toBe(920);
  });

  test('stock cost basis records discounted buys and supports live return calculations', () => {
    const game = createGame('RETURNS', players);
    const player = game.players[0];
    player.investmentPerks.nextTradeDiscount = 0.20;
    player.investmentPerks.discountUses = 1;
    expect(executeDirectInvestment(game, 'p1', 'TECH', 2).ok).toBe(true);
    expect(player.portfolio.stockCostBasis.TECH).toBe(160);
    applyMarketCard(game, {
      id: 'test_gain',
      name: 'Test Gain',
      description: 'A controlled gain for return tracking.',
      economy: 'Growth',
      inflationDelta: 0,
      assetChanges: { TECH: 0.10 }
    });
    const marketValue = player.portfolio.stocks.TECH * game.marketPrices.stocks.TECH;
    expect(marketValue).toBe(220);
    expect((marketValue - player.portfolio.stockCostBasis.TECH) / player.portfolio.stockCostBasis.TECH).toBeCloseTo(0.375);
  });

  test('sale orders cannot exceed the assets a player owns', () => {
    const game = createGame('TEST', players);
    const result = executeDirectSale(game, 'p1', 'TECH', 1);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/own only 0 shares/i);
    expect(game.players[0].cash).toBe(1000);
  });

  test('bonds and property can be sold with clearly stated liquidity costs', () => {
    const game = createGame('TEST', players);
    const player = game.players[0];
    player.level = 3;
    player.cash = 2500;

    expect(executeDirectInvestment(game, 'p1', 'BOND', 1).ok).toBe(true);
    const bondSale = executeDirectSale(game, 'p1', 'BOND', 1);
    expect(bondSale.ok).toBe(true);
    expect(bondSale.totalCost).toBe(238);
    expect(player.portfolio.bonds).toHaveLength(0);

    expect(executeDirectInvestment(game, 'p1', 'PROP', 1).ok).toBe(true);
    expect(player.scheduledEffects.some(effect => effect.source === 'Property maintenance')).toBe(true);
    const propertySale = executeDirectSale(game, 'p1', 'PROP', 1);
    expect(propertySale.ok).toBe(true);
    expect(propertySale.totalCost).toBe(1440);
    expect(player.portfolio.properties).toHaveLength(0);
    expect(player.scheduledEffects.some(effect => effect.source === 'Property maintenance')).toBe(false);
  });

  test('a downside shield offsets the next equity market loss', () => {
    const game = createGame('TEST', players);
    const player = game.players[0];
    player.portfolio.stocks.TECH = 2;
    player.investmentPerks.downsideShieldUses = 1;
    const cashBefore = player.cash;
    applyMarketCard(game, {
      id: 'test_correction',
      name: 'Test Correction',
      description: 'A controlled test decline.',
      economy: 'Market Correction',
      inflationDelta: 0,
      assetChanges: { TECH: -0.10 }
    });
    expect(player.cash).toBe(cashBefore + 20);
    expect(player.investmentPerks.downsideShieldUses).toBe(0);
  });

  test('emergency savings transfer improves the liquidity component', () => {
    const game = createGame('TEST', players);
    const before = calculateFinancialHealth(game.players[0], game.marketPrices).liquidity;
    expect(manageEmergencySavings(game, 'p1', 'deposit', 300)).toBe(true);
    const after = calculateFinancialHealth(game.players[0], game.marketPrices).liquidity;
    expect(game.players[0].emergencySavings).toBe(300);
    expect(game.players[0].cash).toBe(700);
    expect(after).toBeGreaterThan(before);
  });

  test('bonds use a modest 8% return rather than a guaranteed 30%', () => {
    const game = createGame('TEST', players);
    const player = game.players[0];
    player.level = 2;
    const bond = INVESTMENT_CARDS.find(card => card.type === 'bond')!;
    game.currentPendingAction = { type: 'investment', initiatorId: 'p1', details: { card: bond } };
    game.currentPhase = 'tile_action';
    expect(executeBuyAsset(game, 'p1')).toBe(true);
    expect(game.players[0].portfolio.bonds[0].interestRate).toBe(0.08);
    expect(BOND_RETURN).toBe(270);
  });

  test('end-game ranking uses Financial Health Score before net worth', () => {
    const game = createGame('TEST', players);
    const reckless = game.players[0];
    reckless.cash = 7000;
    reckless.debt = 6000;
    reckless.emergencySavings = 0;

    const resilient = game.players[1];
    resilient.cash = 1800;
    resilient.emergencySavings = 1000;
    resilient.portfolio.stocks.CONS = 10;
    resilient.portfolio.stocks.HEAL = 4;

    resolveGameEnd(game);
    expect(game.winnerId).toBe('p2');
    expect(resilient.financialHealth.score).toBeGreaterThan(reckless.financialHealth.score);
  });

  test('market inflation updates at the round boundary, not every player turn', () => {
    const game = createGame('TEST', players);
    const initialInflation = game.inflationRate;
    game.currentPhase = 'end_turn';
    endTurn(game);
    expect(game.inflationRate).toBe(initialInflation);
    game.currentPhase = 'end_turn';
    endTurn(game);
    game.currentPhase = 'end_turn';
    endTurn(game);
    expect(game.currentRound).toBe(2);
    expect(game.economy.roundLastUpdated).toBeGreaterThanOrEqual(1);
  });
});
