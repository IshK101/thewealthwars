import {
  BOND_RETURN,
  BOARD_LEVELS,
  calculateFinancialHealth,
  calculateNetWorth,
  createGame,
  endTurn,
  executeBuyAsset,
  executeCardChoice,
  manageEmergencySavings,
  movePlayer,
  resolveGameEnd,
  startTurn
} from '../gameEngine';
import { DECISION_CARDS, INVESTMENT_CARDS } from '../../data/cards';

const players = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Charlie' }
];

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

  test('BNPL creates debt and recurring ripple repayments', () => {
    const game = createGame('TEST', players);
    const laptop = DECISION_CARDS.find(card => card.id === 'decision_laptop')!;
    game.currentPendingAction = { type: 'decision', initiatorId: 'p1', details: { card: laptop } };
    game.currentPhase = 'tile_action';

    expect(executeCardChoice(game, 'p1', 'bnpl')).toBe(true);
    expect(game.players[0].cash).toBe(900);
    expect(game.players[0].debt).toBe(400);
    expect(game.players[0].scheduledEffects).toHaveLength(1);

    startTurn(game);
    expect(game.players[0].cash).toBe(800);
    expect(game.players[0].debt).toBe(300);
    expect(game.players[0].scheduledEffects[0].remainingTriggers).toBe(3);
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
