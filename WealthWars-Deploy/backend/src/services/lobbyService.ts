import { GameState } from '../models/types';
import { createGame } from './gameEngine';

export interface Lobby {
  lobbyId: string;
  name: string;
  hostId: string;
  players: { id: string; name: string; ready: boolean; connected: boolean }[];
  gameStarted: boolean;
}

const lobbies: Record<string, Lobby> = {};
const activeGames: Record<string, GameState> = {};

export function createLobby(hostId: string, hostName: string, lobbyName: string): Lobby {
  const lobbyId = Math.random().toString(36).substring(2, 9).toUpperCase();
  const lobby: Lobby = {
    lobbyId,
    name: lobbyName || `${hostName}'s Room`,
    hostId,
    players: [{ id: hostId, name: hostName, ready: false, connected: true }],
    gameStarted: false
  };
  lobbies[lobbyId] = lobby;
  return lobby;
}

export function joinLobby(lobbyId: string, playerId: string, playerName: string): Lobby | null {
  const lobby = lobbies[lobbyId.toUpperCase()];
  if (!lobby || lobby.gameStarted || lobby.players.length >= 4) {
    return null;
  }

  // Prevent duplicate joins
  const existing = lobby.players.find(p => p.id === playerId);
  if (existing) {
    existing.name = playerName;
    existing.connected = true;
  } else {
    lobby.players.push({ id: playerId, name: playerName, ready: false, connected: true });
  }

  return lobby;
}

export function leaveLobby(lobbyId: string, playerId: string): Lobby | null {
  const lobby = lobbies[lobbyId.toUpperCase()];
  if (!lobby) return null;

  lobby.players = lobby.players.filter(p => p.id !== playerId);

  if (lobby.players.length === 0) {
    delete lobbies[lobbyId.toUpperCase()];
    delete activeGames[lobbyId.toUpperCase()];
    return null;
  }

  // If host leaves, assign a new host
  if (lobby.hostId === playerId && lobby.players.length > 0) {
    lobby.hostId = lobby.players[0].id;
  }

  return lobby;
}

export function startGameInLobby(lobbyId: string, playerId: string): GameState | null {
  const lobby = lobbies[lobbyId.toUpperCase()];
  if (!lobby || lobby.hostId !== playerId || lobby.players.length < 3 || lobby.players.length > 4 || !lobby.players.every(p => p.ready && p.connected)) {
    // Game requires 3 to 4 players per the rulebook
    return null;
  }

  lobby.gameStarted = true;
  const game = createGame(lobbyId.toUpperCase(), lobby.players.map(({ id, name }) => ({ id, name })));
  activeGames[lobbyId.toUpperCase()] = game;
  return game;
}

export function setPlayerReady(lobbyId: string, playerId: string, ready: boolean): Lobby | null {
  const lobby = lobbies[lobbyId.toUpperCase()];
  const player = lobby?.players.find(p => p.id === playerId);
  if (!lobby || !player || lobby.gameStarted) return null;
  player.ready = ready;
  return lobby;
}

export function setLobbyPlayerConnected(lobbyId: string, playerId: string, connected: boolean): Lobby | null {
  const lobby = lobbies[lobbyId.toUpperCase()];
  const player = lobby?.players.find(p => p.id === playerId);
  if (!lobby || !player) return null;
  player.connected = connected;
  if (!connected) player.ready = false;
  return lobby;
}

export function getLobby(lobbyId: string): Lobby | undefined {
  return lobbies[lobbyId.toUpperCase()];
}

export function getActiveGame(gameId: string): GameState | undefined {
  return activeGames[gameId.toUpperCase()];
}

export function listAvailableLobbies(): Lobby[] {
  return Object.values(lobbies).filter(l => !l.gameStarted && l.players.length < 4);
}
