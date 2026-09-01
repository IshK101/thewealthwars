import { Server, Socket } from 'socket.io';
import { GameState, Player } from '../models/types';
import {
  createLobby,
  getActiveGame,
  getLobby,
  joinLobby,
  leaveLobby,
  listAvailableLobbies,
  setLobbyPlayerConnected,
  setPlayerReady,
  startGameInLobby
} from '../services/lobbyService';
import {
  acknowledgeEvent,
  endTurn,
  executeBuyAsset,
  executeCardChoice,
  executePassAsset,
  manageEmergencySavings,
  movePlayer,
  rollDice,
  setPlayerConnected
} from '../services/gameEngine';

const socketPlayerMap: Record<string, { playerId: string; lobbyId: string }> = {};

function session(socket: Socket): { playerId?: string; playerName?: string } {
  return socket.data as { playerId?: string; playerName?: string };
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('register_player', ({ playerId, playerName }: { playerId: string; playerName: string }) => {
      session(socket).playerId = playerId;
      session(socket).playerName = playerName;
      socket.emit('lobbies_list', listAvailableLobbies());
    });

    socket.on('get_lobbies', () => socket.emit('lobbies_list', listAvailableLobbies()));

    socket.on('create_lobby', ({ lobbyName }: { lobbyName: string }) => {
      const { playerId, playerName } = session(socket);
      if (!playerId || !playerName) return;
      const lobby = createLobby(playerId, playerName, lobbyName);
      socketPlayerMap[socket.id] = { playerId, lobbyId: lobby.lobbyId };
      socket.join(lobby.lobbyId);
      socket.emit('lobby_joined', lobby);
      io.emit('lobbies_list', listAvailableLobbies());
    });

    socket.on('join_lobby', ({ lobbyId }: { lobbyId: string }) => {
      const { playerId, playerName } = session(socket);
      if (!playerId || !playerName) return;
      const lobby = joinLobby(lobbyId, playerId, playerName);
      if (!lobby) {
        socket.emit('error_message', 'That room is unavailable, full, or already in progress.');
        return;
      }
      socketPlayerMap[socket.id] = { playerId, lobbyId: lobby.lobbyId };
      socket.join(lobby.lobbyId);
      socket.emit('lobby_joined', lobby);
      io.to(lobby.lobbyId).emit('lobby_updated', lobby);
      io.emit('lobbies_list', listAvailableLobbies());
    });

    socket.on('set_ready', ({ lobbyId, ready }: { lobbyId: string; ready: boolean }) => {
      const { playerId } = session(socket);
      if (!playerId) return;
      const lobby = setPlayerReady(lobbyId, playerId, ready);
      if (lobby) io.to(lobby.lobbyId).emit('lobby_updated', lobby);
    });

    socket.on('leave_room', ({ lobbyId }: { lobbyId: string }) => {
      const { playerId } = session(socket);
      if (!playerId) return;
      const lobby = leaveLobby(lobbyId, playerId);
      delete socketPlayerMap[socket.id];
      socket.leave(lobbyId);
      if (lobby) io.to(lobby.lobbyId).emit('lobby_updated', lobby);
      io.emit('lobbies_list', listAvailableLobbies());
    });

    socket.on('start_game', ({ lobbyId }: { lobbyId: string }) => {
      const { playerId } = session(socket);
      if (!playerId) return;
      const game = startGameInLobby(lobbyId, playerId);
      if (!game) {
        socket.emit('error_message', 'The host can start once 3–4 connected players are ready.');
        return;
      }
      broadcastGameUpdate(io, game.gameId, game, 'game_started');
      io.emit('lobbies_list', listAvailableLobbies());
    });

    socket.on('roll_dice', ({ gameId }: { gameId: string }) => {
      const game = getActiveGame(gameId);
      const { playerId } = session(socket);
      if (!game || !playerId || game.status !== 'playing') return;
      const activePlayer = game.players[game.activePlayerIndex];
      if (activePlayer.id !== playerId || game.currentPhase !== 'roll') return;
      const roll = rollDice();
      game.lastRoll = { ...roll, playerId, rollId: Math.random().toString(36).substring(2, 9) };
      movePlayer(game, roll.total);
      broadcastGameUpdate(io, gameId, game);
    });

    socket.on('choose_card', ({ gameId, choiceId }: { gameId: string; choiceId: string }) => {
      const game = getActiveGame(gameId);
      const { playerId } = session(socket);
      if (!game || !playerId) return;
      if (!executeCardChoice(game, playerId, choiceId)) {
        socket.emit('error_message', 'That option is unavailable with your current cash or savings.');
        return;
      }
      broadcastGameUpdate(io, gameId, game);
    });

    socket.on('buy_asset', ({ gameId }: { gameId: string }) => {
      const game = getActiveGame(gameId);
      const { playerId } = session(socket);
      if (!game || !playerId) return;
      if (!executeBuyAsset(game, playerId)) {
        socket.emit('error_message', 'You cannot afford or access this investment.');
        return;
      }
      broadcastGameUpdate(io, gameId, game);
    });

    socket.on('pass_asset', ({ gameId }: { gameId: string }) => {
      const game = getActiveGame(gameId);
      const { playerId } = session(socket);
      if (!game || !playerId || !executePassAsset(game, playerId)) return;
      broadcastGameUpdate(io, gameId, game);
    });

    socket.on('acknowledge_event', ({ gameId }: { gameId: string }) => {
      const game = getActiveGame(gameId);
      const { playerId } = session(socket);
      if (!game || !playerId || !acknowledgeEvent(game, playerId)) return;
      broadcastGameUpdate(io, gameId, game);
    });

    socket.on('manage_savings', ({ gameId, direction, amount }: { gameId: string; direction: 'deposit' | 'withdraw'; amount?: number }) => {
      const game = getActiveGame(gameId);
      const { playerId } = session(socket);
      if (!game || !playerId || !manageEmergencySavings(game, playerId, direction, amount)) {
        socket.emit('error_message', 'Savings can be moved in $100 steps during your turn when funds are available.');
        return;
      }
      broadcastGameUpdate(io, gameId, game);
    });

    socket.on('end_turn', ({ gameId }: { gameId: string }) => {
      const game = getActiveGame(gameId);
      const { playerId } = session(socket);
      if (!game || !playerId || game.status !== 'playing') return;
      if (game.players[game.activePlayerIndex].id !== playerId || game.currentPhase !== 'end_turn') return;
      endTurn(game);
      broadcastGameUpdate(io, gameId, game);
    });

    socket.on('reconnect_game', ({ gameId, playerId }: { gameId: string; playerId: string }) => {
      const game = getActiveGame(gameId);
      const lobby = getLobby(gameId);
      socketPlayerMap[socket.id] = { playerId, lobbyId: gameId.toUpperCase() };
      socket.join(gameId.toUpperCase());
      if (game) {
        setPlayerConnected(game, playerId, true);
        socket.emit('game_updated', cleanGameStateForPlayer(game, playerId));
        broadcastGameUpdate(io, gameId, game);
      } else if (lobby) {
        setLobbyPlayerConnected(gameId, playerId, true);
        socket.emit('lobby_joined', lobby);
        io.to(lobby.lobbyId).emit('lobby_updated', lobby);
      }
    });

    socket.on('disconnect', () => {
      const mapping = socketPlayerMap[socket.id];
      if (!mapping) return;
      delete socketPlayerMap[socket.id];
      const game = getActiveGame(mapping.lobbyId);
      if (game) {
        setPlayerConnected(game, mapping.playerId, false);
        broadcastGameUpdate(io, mapping.lobbyId, game);
        return;
      }
      const lobby = setLobbyPlayerConnected(mapping.lobbyId, mapping.playerId, false);
      if (lobby) io.to(lobby.lobbyId).emit('lobby_updated', lobby);
    });
  });
}

function broadcastGameUpdate(io: Server, gameId: string, game: GameState, eventName = 'game_updated') {
  game.players.forEach(player => {
    const playerSockets = Object.keys(socketPlayerMap).filter(socketId => {
      const mapping = socketPlayerMap[socketId];
      return mapping.playerId === player.id && mapping.lobbyId === gameId.toUpperCase();
    });
    playerSockets.forEach(socketId => io.to(socketId).emit(eventName, cleanGameStateForPlayer(game, player.id)));
  });
}

function publicPlayer(player: Player, isSelf: boolean): Player {
  if (isSelf) return player;
  return {
    ...player,
    cash: -1,
    emergencySavings: -1,
    debt: -1,
    scheduledEffects: [],
    history: [],
    portfolio: {
      stocks: Object.fromEntries(Object.keys(player.portfolio.stocks).map(symbol => [symbol, -1])),
      bonds: [],
      properties: player.portfolio.properties.map((_, index) => `property_${index + 1}`)
    }
  };
}

function cleanGameStateForPlayer(game: GameState, playerId: string): Omit<GameState, 'decisionDeck' | 'lifeEventDeck' | 'opportunityDeck' | 'marketDeck' | 'investmentDeck'> {
  const {
    decisionDeck: _decisionDeck,
    lifeEventDeck: _lifeEventDeck,
    opportunityDeck: _opportunityDeck,
    marketDeck: _marketDeck,
    investmentDeck: _investmentDeck,
    ...publicState
  } = game;
  return { ...publicState, players: game.players.map(player => publicPlayer(player, player.id === playerId)) };
}
