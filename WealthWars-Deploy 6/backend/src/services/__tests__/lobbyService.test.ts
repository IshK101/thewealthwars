import {
  createLobby,
  joinLobby,
  setPlayerReady,
  startGameInLobby
} from '../lobbyService';

describe('Wealth Wars lobby player limits', () => {
  test('does not start with only one player', () => {
    const lobby = createLobby('solo-host', 'Solo', 'Solo Test');
    setPlayerReady(lobby.lobbyId, 'solo-host', true);
    expect(startGameInLobby(lobby.lobbyId, 'solo-host')).toBeNull();
  });

  test('starts a complete game with two ready players', () => {
    const lobby = createLobby('host-two', 'Host', 'Two Player Test');
    expect(joinLobby(lobby.lobbyId, 'guest-two', 'Guest')).not.toBeNull();
    setPlayerReady(lobby.lobbyId, 'host-two', true);
    setPlayerReady(lobby.lobbyId, 'guest-two', true);

    const game = startGameInLobby(lobby.lobbyId, 'host-two');
    expect(game).not.toBeNull();
    expect(game?.players).toHaveLength(2);
  });

  test('still supports three and four players but rejects a fifth', () => {
    const lobby = createLobby('host-four', 'Host', 'Four Player Test');
    expect(joinLobby(lobby.lobbyId, 'guest-a', 'A')).not.toBeNull();
    expect(joinLobby(lobby.lobbyId, 'guest-b', 'B')).not.toBeNull();
    expect(joinLobby(lobby.lobbyId, 'guest-c', 'C')).not.toBeNull();
    expect(joinLobby(lobby.lobbyId, 'guest-d', 'D')).toBeNull();
    expect(lobby.players).toHaveLength(4);
  });
});
