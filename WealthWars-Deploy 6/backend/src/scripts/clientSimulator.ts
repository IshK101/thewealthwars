import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.WEALTH_WARS_SERVER_URL || 'http://localhost:3002';
const players = [
  { id: 'sim_alice', name: 'Alice' },
  { id: 'sim_bob', name: 'Bob' },
  { id: 'sim_charlie', name: 'Charlie' }
];

let gameId = '';
const actedStates = new Set<string>();
const clients = players.map(player => ({ ...player, socket: io(SERVER_URL, { autoConnect: false }) }));

function act(socket: Socket, playerId: string, state: any) {
  if (state.status !== 'playing' || state.players[state.activePlayerIndex].id !== playerId) return;
  const pending = state.currentPendingAction;
  const key = [state.currentRound, playerId, state.currentPhase, state.lastRoll?.rollId, pending?.type, pending?.details?.card?.id].join(':');
  if (actedStates.has(key)) return;
  actedStates.add(key);

  setTimeout(() => {
    if (state.currentPhase === 'roll') {
      socket.emit('roll_dice', { gameId });
    } else if (state.currentPhase === 'end_turn') {
      socket.emit('end_turn', { gameId });
    } else if (pending?.type === 'decision') {
      const me = state.players.find((player: any) => player.id === playerId);
      const choice = pending.details.card.choices.find((item: any) =>
        me.cash + (item.effect.cash || 0) >= 0 && me.emergencySavings + (item.effect.emergencySavings || 0) >= 0
      );
      socket.emit('choose_card', { gameId, choiceId: choice.id });
    } else if (pending?.type === 'investment') {
      const card = pending.details.card;
      const me = state.players.find((player: any) => player.id === playerId);
      const cost = ['stock', 'fund'].includes(card.type) ? card.price * card.quantity : card.price;
      socket.emit(me.cash >= cost ? 'buy_asset' : 'pass_asset', { gameId });
    } else if (pending?.type === 'event') {
      socket.emit('acknowledge_event', { gameId });
    }
  }, 250);
}

clients.forEach((client, index) => {
  client.socket.on('connect', () => {
    client.socket.emit('register_player', { playerId: client.id, playerName: client.name });
    if (index === 0) client.socket.emit('create_lobby', { lobbyName: 'Automated Ripple Test' });
  });

  client.socket.on('lobby_joined', (lobby: any) => {
    gameId = lobby.lobbyId;
    if (index === 0) clients.slice(1).forEach(other => other.socket.emit('join_lobby', { lobbyId: gameId }));
  });

  client.socket.on('lobby_updated', (lobby: any) => {
    gameId = lobby.lobbyId;
    const me = lobby.players.find((player: any) => player.id === client.id);
    if (me && !me.ready) client.socket.emit('set_ready', { lobbyId: gameId, ready: true });
    if (lobby.hostId === client.id && lobby.players.length === 3 && lobby.players.every((player: any) => player.ready)) {
      client.socket.emit('start_game', { lobbyId: gameId });
    }
  });

  client.socket.on('game_started', (state: any) => act(client.socket, client.id, state));
  client.socket.on('game_updated', (state: any) => {
    const active = state.players[state.activePlayerIndex];
    console.log(`[${client.name}] Round ${state.currentRound} · ${active.name} · ${state.currentPhase} · ${state.economy.state}`);
    act(client.socket, client.id, state);
  });
  client.socket.on('error_message', (message: string) => console.error(`[${client.name}] ${message}`));
  client.socket.connect();
});
