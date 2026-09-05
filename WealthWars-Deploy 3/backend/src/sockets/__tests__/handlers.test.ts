import { createGame } from '../../services/gameEngine';
import { cleanGameStateForPlayer } from '../handlers';

describe('player-specific game state privacy', () => {
  test('keeps influence patterns private from other players', () => {
    const game = createGame('TEST', [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' }
    ]);
    game.players[0].socialInfluenceProfile = {
      decisionsTracked: 3,
      verification: 32,
      hypePull: 76,
      independentJudgment: 35,
      patternTitle: 'Hype-sensitive',
      lastInsight: 'A private insight.'
    };

    const aliceView = cleanGameStateForPlayer(game, 'p1');
    const bobView = cleanGameStateForPlayer(game, 'p2');

    expect(aliceView.players[0].socialInfluenceProfile.patternTitle).toBe('Hype-sensitive');
    expect(bobView.players[0].socialInfluenceProfile).toMatchObject({
      decisionsTracked: 0,
      verification: 0,
      hypePull: 0,
      independentJudgment: 0,
      patternTitle: 'Private'
    });
  });
});
