import { io, Socket } from 'socket.io-client';
import './style.css';

// Socket connection
const SERVER_URL = import.meta.env.VITE_SERVER_URL
  || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3002');
const socket: Socket = io(SERVER_URL, { autoConnect: false });

// Session State
const myId = localStorage.getItem('ww_player_id') || Math.random().toString(36).substring(2, 11);
localStorage.setItem('ww_player_id', myId);

let myName = localStorage.getItem('ww_player_name') || '';
let activeLobbyId = localStorage.getItem('ww_active_lobby_id') || '';
let isReady = false;

let lastProcessedRollId = '';
let isAnimatingDice = false;
let pendingGameState: any = null;
const previousStockPrices: Record<string, number> = { TECH: 100, CONS: 80, HEAL: 120, ENER: 90 };
const previousNetWorths: Record<string, number> = {};
let isSoundMuted = localStorage.getItem('ww_sound_muted') === 'true';

// Board Tile Layouts per level loop
const BOARD_TILES: Record<number, string[]> = {
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

const PLAYER_COLORS = ['#00D2FF', '#FFA000', '#FF2E93', '#00E676'];

// DOM Element Selectors
const screenRegister = document.getElementById('screen-register')!;
const screenLobbies = document.getElementById('screen-lobbies')!;
const screenRoom = document.getElementById('screen-room')!;
const screenGame = document.getElementById('screen-game')!;

// Screen 1: Registration
const inputUsername = document.getElementById('username') as HTMLInputElement;
const btnLogin = document.getElementById('btn-login') as HTMLButtonElement;
const lblMyName = document.getElementById('lbl-my-name')!;

// Screen 2: Lobbies Browser
const lobbiesContainer = document.getElementById('lobbies-container')!;
const inputLobbyName = document.getElementById('lobby-name') as HTMLInputElement;
const btnCreateLobby = document.getElementById('btn-create-lobby') as HTMLButtonElement;
const btnRefreshLobbies = document.getElementById('btn-refresh-lobbies') as HTMLButtonElement;

// Screen 3: Waiting Room
const roomTitle = document.getElementById('room-title')!;
const lblRoomId = document.getElementById('lbl-room-id')!;
const lblRoomCount = document.getElementById('lbl-room-count')!;
const roomPlayersList = document.getElementById('room-players-list')!;
const btnStartGame = document.getElementById('btn-start-game') as HTMLButtonElement;
const btnReady = document.getElementById('btn-ready') as HTMLButtonElement;
const btnLeaveRoom = document.getElementById('btn-leave-room') as HTMLButtonElement;

// Screen 4: Top Market Bar
const lblRoundNum = document.getElementById('lbl-round-num')!;
const roundDotsContainer = document.getElementById('round-dots-container')!;
const lblInflation = document.getElementById('lbl-inflation')!;
const lblEconomy = document.getElementById('lbl-economy')!;
const lblActivePlayer = document.getElementById('lbl-active-player')!;
const lblPhaseIndicator = document.getElementById('lbl-phase-indicator')!;
const btnSoundToggle = document.getElementById('btn-sound-toggle') as HTMLButtonElement;
const iconSoundOn = document.getElementById('icon-sound-on')!;
const iconSoundOff = document.getElementById('icon-sound-off')!;

// Screen 4: Left Standings
const standingsList = document.getElementById('standings-list')!;

// Screen 4: Central Board & Market Exchange
const gameBoard = document.getElementById('game-board')!;
const lblBoardLevelTitle = document.getElementById('lbl-board-level-title')!;
const chipUnlockBonds = document.getElementById('chip-unlock-bonds')!;
const chipUnlockRealEstate = document.getElementById('chip-unlock-realestate')!;
const lblExchangePhase = document.getElementById('lbl-exchange-phase')!;
const lblExchangeInstruction = document.getElementById('lbl-exchange-instruction')!;
const lblExchangePulse = document.getElementById('lbl-exchange-pulse')!;
const die1 = document.getElementById('die-1')!;
const die2 = document.getElementById('die-2')!;
const diceTotalCaption = document.getElementById('dice-total-caption')!;
const btnGameRoll = document.getElementById('btn-game-roll') as HTMLButtonElement;
const btnGameEndTurn = document.getElementById('btn-game-end-turn') as HTMLButtonElement;

// Screen 4: Right Personal Panel
const lblMyNetWorth = document.getElementById('lbl-my-networth')!;
const lblMyNetWorthDelta = document.getElementById('lbl-my-networth-delta')!;
const lblMyLevelBadge = document.getElementById('lbl-my-level-badge')!;
const lblNextThreshold = document.getElementById('lbl-next-threshold')!;
const barNetWorth = document.getElementById('bar-net-worth')!;
const lblMyCash = document.getElementById('lbl-my-cash')!;
const lblEmergencySavings = document.getElementById('lbl-emergency-savings')!;
const lblDebt = document.getElementById('lbl-debt')!;
const lblHealthScore = document.getElementById('lbl-health-score')!;
const btnSave100 = document.getElementById('btn-save-100') as HTMLButtonElement;
const btnWithdraw100 = document.getElementById('btn-withdraw-100') as HTMLButtonElement;
const lblTotalStocksVal = document.getElementById('lbl-total-stocks-val')!;
const lblTotalBondsVal = document.getElementById('lbl-total-bonds-val')!;
const lblPropertyProgressCount = document.getElementById('lbl-property-progress-count')!;
const bondsList = document.getElementById('bonds-list')!;
const propertiesList = document.getElementById('properties-list')!;
const reactionsContainer = document.getElementById('reactions-container')!;
const lblReactionTabCount = document.getElementById('lbl-reaction-tab-count')!;
const logsContainer = document.getElementById('logs-container')!;

// Donut Chart Elements
const donutSegCash = document.getElementById('donut-seg-cash')!;
const donutSegStocks = document.getElementById('donut-seg-stocks')!;
const donutSegBonds = document.getElementById('donut-seg-bonds')!;
const donutSegProperty = document.getElementById('donut-seg-property')!;
const lblDonutCashPct = document.getElementById('lbl-donut-cash-pct')!;
const lblPctCash = document.getElementById('lbl-pct-cash')!;
const lblPctStocks = document.getElementById('lbl-pct-stocks')!;
const lblPctBonds = document.getElementById('lbl-pct-bonds')!;
const lblPctProperty = document.getElementById('lbl-pct-property')!;

// Bottom Reaction Tray
const reactionTrayWrapper = document.getElementById('reaction-tray-cards-wrapper')!;

// Action Drawer
const actionDrawerOverlay = document.getElementById('action-drawer-overlay')!;
const drawerActionBadge = document.getElementById('drawer-action-badge')!;
const btnDrawerClose = document.getElementById('btn-drawer-close') as HTMLButtonElement;
const drawerBodyContent = document.getElementById('drawer-body-content')!;

// Center Modals
const modalEvent = document.getElementById('modal-event')!;
const lblEventTitle = document.getElementById('lbl-event-title')!;
const lblEventDescription = document.getElementById('lbl-event-description')!;
const lblEventImpact = document.getElementById('lbl-event-impact')!;
const btnEventContinue = document.getElementById('btn-event-continue') as HTMLButtonElement;

const modalTrade = document.getElementById('modal-trade')!;
const tradeSelectPlayer = document.getElementById('trade-select-player') as HTMLSelectElement;
const tradeOfferCash = document.getElementById('trade-offer-cash') as HTMLInputElement;
const tradeRequestCash = document.getElementById('trade-request-cash') as HTMLInputElement;
const valTradeOfferTotal = document.getElementById('val-trade-offer-total')!;
const valTradeRequestTotal = document.getElementById('val-trade-request-total')!;
const btnTradeSubmit = document.getElementById('btn-trade-submit') as HTMLButtonElement;
const btnTradeCancel = document.getElementById('btn-trade-cancel') as HTMLButtonElement;

const modalJackpot = document.getElementById('modal-jackpot')!;
const btnJackpotCash = document.getElementById('btn-jackpot-cash') as HTMLButtonElement;
const btnJackpotStock = document.getElementById('btn-jackpot-stock') as HTMLButtonElement;
const jackpotStockSelect = document.getElementById('jackpot-stock-select') as HTMLSelectElement;
const lblJackpotCashVal = document.getElementById('lbl-jackpot-cash-val')!;

const modalLevelUp = document.getElementById('modal-level-up')!;
const lblLevelUpName = document.getElementById('lbl-levelup-name')!;
const lblLevelUpUnlockText = document.getElementById('lbl-levelup-unlock-text')!;
const btnLevelUpYes = document.getElementById('btn-level-up-yes') as HTMLButtonElement;
const btnLevelUpNo = document.getElementById('btn-level-up-no') as HTMLButtonElement;

const modalGameOver = document.getElementById('modal-game-over')!;
const lblWinnerName = document.getElementById('lbl-winner-name')!;
const lblWinnerNetWorth = document.getElementById('lbl-winner-networth')!;
const finalStandingsBody = document.getElementById('final-standings-body')!;
const btnPlayAgain = document.getElementById('btn-play-again') as HTMLButtonElement;

const modalGeneric = document.getElementById('modal-generic')!;
const lblGenericTitle = document.getElementById('lbl-generic-title')!;
const lblGenericBody = document.getElementById('lbl-generic-body')!;
const btnGenericPrimary = document.getElementById('btn-generic-primary') as HTMLButtonElement;
const btnGenericSecondary = document.getElementById('btn-generic-secondary') as HTMLButtonElement;

const toastContainer = document.getElementById('toast-container')!;

// Web Audio Sound FX Engine
class SoundEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playClick() {
    if (isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playCash() {
    if (isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.12, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.25);
    });
  }

  playDice() {
    if (isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150 + Math.random() * 300, now + i * 0.1);
      gain.gain.setValueAtTime(0.08, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.08);
    }
  }

  playEvent() {
    if (isSoundMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }
}

const sounds = new SoundEngine();

// Toast Notification Manager (Section 9.1, 10)
function showToast(title: string, desc: string, type: 'income' | 'event' | 'info' = 'info', icon: string = '🔔') {
  const toast = document.createElement('div');
  toast.className = `toast-notification type-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <span class="toast-title">${title}</span>
      <span class="toast-desc">${desc}</span>
    </div>
  `;
  toastContainer.appendChild(toast);

  if (type === 'income') sounds.playCash();
  else if (type === 'event') sounds.playEvent();
  else sounds.playClick();

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Sparkline Canvas Renderer (Section 8.2, 14)
function drawSparkline(canvas: HTMLCanvasElement, trend: 'up' | 'down') {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width = canvas.parentElement?.clientWidth || 280;
  const h = canvas.height = canvas.parentElement?.clientHeight || 60;
  ctx.clearRect(0, 0, w, h);

  const pointsCount = 12;
  const points: number[] = [];
  let currentVal = trend === 'up' ? 20 : 80;
  for (let i = 0; i < pointsCount; i++) {
    const variance = (Math.random() - 0.45) * 20;
    currentVal = Math.max(10, Math.min(90, currentVal + (trend === 'up' ? 5 : -5) + variance));
    points.push(currentVal);
  }

  const step = w / (pointsCount - 1);
  const color = trend === 'up' ? '#2CCB9B' : '#FF6B6B';

  // Area gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, trend === 'up' ? 'rgba(44, 203, 155, 0.3)' : 'rgba(255, 107, 107, 0.3)');
  grad.addColorStop(1, 'transparent');

  ctx.beginPath();
  ctx.moveTo(0, h - (points[0] / 100) * (h - 12) - 6);
  for (let i = 1; i < pointsCount; i++) {
    const x = i * step;
    const y = h - (points[i] / 100) * (h - 12) - 6;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fillStyle = grad;
  ctx.fill();
}

// App Initialization
init();

function init() {
  if (myName) {
    inputUsername.value = myName;
    lblMyName.textContent = myName;
  }
  updateSoundUI();

  // Socket Lifecycle Handlers
  socket.on('connect', () => {
    console.log('Connected to Wealth Wars Server!');
    if (myName) {
      socket.emit('register_player', { playerId: myId, playerName: myName });
      if (activeLobbyId) {
        socket.emit('reconnect_game', { gameId: activeLobbyId, playerId: myId });
      }
    }
  });

  socket.on('disconnect', () => {
    showToast('Reconnecting', 'Connection lost. Your seat and game state are being preserved.', 'event', '↻');
  });

  socket.on('lobbies_list', (rooms: any[]) => {
    renderLobbies(rooms);
  });

  socket.on('lobby_joined', (room: any) => {
    activeLobbyId = room.lobbyId;
    localStorage.setItem('ww_active_lobby_id', activeLobbyId);
    showScreen(screenRoom);
    updateLobbyRoom(room);
  });

  socket.on('lobby_updated', (room: any) => {
    updateLobbyRoom(room);
  });

  socket.on('game_started', (gameState: any) => {
    if (gameState && gameState.gameId) {
      activeLobbyId = gameState.gameId;
      localStorage.setItem('ww_active_lobby_id', activeLobbyId);
    }
    handleIncomingGameState(gameState);
  });

  socket.on('game_updated', (gameState: any) => {
    if (gameState && gameState.gameId) {
      activeLobbyId = gameState.gameId;
      localStorage.setItem('ww_active_lobby_id', activeLobbyId);
    }
    handleIncomingGameState(gameState);
  });

  socket.on('error_message', (msg: string) => {
    showToast('Notice', msg, 'event', '⚠️');
  });

  bindEvents();
  socket.connect();
}

function showScreen(screen: HTMLElement) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function updateSoundUI() {
  if (isSoundMuted) {
    iconSoundOn.classList.add('hidden');
    iconSoundOff.classList.remove('hidden');
  } else {
    iconSoundOn.classList.remove('hidden');
    iconSoundOff.classList.add('hidden');
  }
}

function executeEndTurn() {
  if (activeLobbyId) {
    sounds.playClick();
    socket.emit('end_turn', { gameId: activeLobbyId });
  } else {
    showToast('Notice', 'No active game to end turn.', 'info', 'ℹ️');
  }
}

function bindEvents() {
  // Login
  btnLogin.addEventListener('click', () => {
    const val = inputUsername.value.trim();
    if (!val) return;
    myName = val;
    localStorage.setItem('ww_player_name', myName);
    lblMyName.textContent = myName;
    sounds.playClick();

    socket.emit('register_player', { playerId: myId, playerName: myName });
    showScreen(screenLobbies);
  });

  // Create Room
  btnCreateLobby.addEventListener('click', () => {
    const name = inputLobbyName.value.trim();
    sounds.playClick();
    socket.emit('create_lobby', { lobbyName: name });
    inputLobbyName.value = '';
  });

  // Refresh Lobbies
  btnRefreshLobbies.addEventListener('click', () => {
    sounds.playClick();
    socket.emit('get_lobbies');
  });

  // Leave Room
  btnLeaveRoom.addEventListener('click', () => {
    if (activeLobbyId) {
      sounds.playClick();
      socket.emit('leave_room', { lobbyId: activeLobbyId });
      activeLobbyId = '';
      localStorage.removeItem('ww_active_lobby_id');
      showScreen(screenLobbies);
      socket.emit('get_lobbies');
    }
  });

  // Start Game
  btnStartGame.addEventListener('click', () => {
    if (activeLobbyId) {
      sounds.playClick();
      socket.emit('start_game', { lobbyId: activeLobbyId });
    }
  });

  btnReady.addEventListener('click', () => {
    if (!activeLobbyId) return;
    isReady = !isReady;
    sounds.playClick();
    socket.emit('set_ready', { lobbyId: activeLobbyId, ready: isReady });
  });

  btnSave100.addEventListener('click', () => {
    socket.emit('manage_savings', { gameId: activeLobbyId, direction: 'deposit', amount: 100 });
  });

  btnWithdraw100.addEventListener('click', () => {
    socket.emit('manage_savings', { gameId: activeLobbyId, direction: 'withdraw', amount: 100 });
  });

  // Sound Toggle
  btnSoundToggle.addEventListener('click', () => {
    isSoundMuted = !isSoundMuted;
    localStorage.setItem('ww_sound_muted', isSoundMuted ? 'true' : 'false');
    updateSoundUI();
    if (!isSoundMuted) sounds.playClick();
  });

  // Panel Tabs Switcher
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.playClick();
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab')!;
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  // Roll Dice Action
  btnGameRoll.addEventListener('click', () => {
    if (activeLobbyId) {
      sounds.playDice();
      socket.emit('roll_dice', { gameId: activeLobbyId });
      animateDiceRolling();
    }
  });

  // End Turn Actions (Center Button and Top Bar Pill)
  btnGameEndTurn.addEventListener('click', () => {
    executeEndTurn();
  });

  lblPhaseIndicator.addEventListener('click', () => {
    if (lblPhaseIndicator.classList.contains('is-end-turn')) {
      executeEndTurn();
    }
  });

  // Close Action Drawer
  btnDrawerClose.addEventListener('click', () => {
    actionDrawerOverlay.classList.remove('open');
  });

  // Event Modal Continue
  btnEventContinue.addEventListener('click', () => {
    if (activeLobbyId) socket.emit('acknowledge_event', { gameId: activeLobbyId });
    modalEvent.classList.remove('active');
    sounds.playClick();
  });

  // Level Up Choices
  btnLevelUpYes.addEventListener('click', () => {
    sounds.playCash();
    socket.emit('answer_level_up', { gameId: activeLobbyId, advance: true });
    modalLevelUp.classList.remove('active');
  });

  btnLevelUpNo.addEventListener('click', () => {
    sounds.playClick();
    socket.emit('answer_level_up', { gameId: activeLobbyId, advance: false });
    modalLevelUp.classList.remove('active');
  });

  // Jackpot Modal Choices
  btnJackpotCash.addEventListener('click', () => {
    sounds.playCash();
    socket.emit('jackpot_choice', { gameId: activeLobbyId, choice: 'cash' });
    modalJackpot.classList.remove('active');
  });

  btnJackpotStock.addEventListener('click', () => {
    sounds.playCash();
    socket.emit('jackpot_choice', {
      gameId: activeLobbyId,
      choice: 'stock',
      stockSymbol: jackpotStockSelect.value
    });
    modalJackpot.classList.remove('active');
  });

  // Trade Modal Submit & Cancel
  btnTradeSubmit.addEventListener('click', () => {
    const receiverId = tradeSelectPlayer.value;
    const offeredCash = parseInt(tradeOfferCash.value || '0', 10);
    const requestedCash = parseInt(tradeRequestCash.value || '0', 10);

    const offeredStocks = {
      TECH: parseInt((document.getElementById('trade-offer-TECH') as HTMLInputElement).value || '0', 10),
      CONS: parseInt((document.getElementById('trade-offer-CONS') as HTMLInputElement).value || '0', 10),
      HEAL: parseInt((document.getElementById('trade-offer-HEAL') as HTMLInputElement).value || '0', 10),
      ENER: parseInt((document.getElementById('trade-offer-ENER') as HTMLInputElement).value || '0', 10)
    };

    const requestedStocks = {
      TECH: parseInt((document.getElementById('trade-request-TECH') as HTMLInputElement).value || '0', 10),
      CONS: parseInt((document.getElementById('trade-request-CONS') as HTMLInputElement).value || '0', 10),
      HEAL: parseInt((document.getElementById('trade-request-HEAL') as HTMLInputElement).value || '0', 10),
      ENER: parseInt((document.getElementById('trade-request-ENER') as HTMLInputElement).value || '0', 10)
    };

    sounds.playClick();
    socket.emit('propose_trade', {
      gameId: activeLobbyId,
      offer: {
        receiverId,
        offeredCash,
        requestedCash,
        offeredStocks,
        requestedStocks,
        offeredBonds: [],
        requestedBonds: []
      }
    });
    modalTrade.classList.remove('active');
  });

  btnTradeCancel.addEventListener('click', () => {
    modalTrade.classList.remove('active');
    btnGameEndTurn.classList.remove('hidden');
  });

  // Play Again / Return to Lobby
  btnPlayAgain.addEventListener('click', () => {
    modalGameOver.classList.remove('active');
    if (screenRegister) {
      // Screen references are ready
    }
    showScreen(screenLobbies);
    socket.emit('get_lobbies');
  });

  // Live Trade Estimate Calculation Listeners
  const tradeInputs = [
    tradeOfferCash, tradeRequestCash,
    'trade-offer-TECH', 'trade-offer-CONS', 'trade-offer-HEAL', 'trade-offer-ENER',
    'trade-request-TECH', 'trade-request-CONS', 'trade-request-HEAL', 'trade-request-ENER'
  ];
  tradeInputs.forEach(item => {
    const el = typeof item === 'string' ? document.getElementById(item) : item;
    el?.addEventListener('input', updateTradeEstimates);
  });
}

function updateTradeEstimates() {
  const offerCash = parseInt(tradeOfferCash.value || '0', 10);
  const reqCash = parseInt(tradeRequestCash.value || '0', 10);

  const getStockVal = (sym: string, id: string) => {
    const qty = parseInt((document.getElementById(id) as HTMLInputElement)?.value || '0', 10);
    return qty * (previousStockPrices[sym] || 100);
  };

  const offerTotal = offerCash +
    getStockVal('TECH', 'trade-offer-TECH') +
    getStockVal('CONS', 'trade-offer-CONS') +
    getStockVal('HEAL', 'trade-offer-HEAL') +
    getStockVal('ENER', 'trade-offer-ENER');

  const reqTotal = reqCash +
    getStockVal('TECH', 'trade-request-TECH') +
    getStockVal('CONS', 'trade-request-CONS') +
    getStockVal('HEAL', 'trade-request-HEAL') +
    getStockVal('ENER', 'trade-request-ENER');

  valTradeOfferTotal.textContent = `$${offerTotal.toLocaleString()}`;
  valTradeRequestTotal.textContent = `$${reqTotal.toLocaleString()}`;
}

function animateDiceRolling() {
  isAnimatingDice = true;
  die1.classList.add('tumbling');
  die2.classList.add('tumbling');
  diceTotalCaption.textContent = 'Tumbling...';
  lblExchangeInstruction.textContent = 'ANALYZING MARKET ENTRY...';
}

function renderLobbies(rooms: any[]) {
  lobbiesContainer.innerHTML = '';
  if (rooms.length === 0) {
    lobbiesContainer.innerHTML = '<div class="empty-state"><p>No active rooms found. Create a new room to begin.</p></div>';
    return;
  }

  rooms.forEach((room: any) => {
    const card = document.createElement('div');
    card.className = 'lobby-item-card';
    card.innerHTML = `
      <div class="lobby-item-info">
        <div class="lobby-item-name">${room.name}</div>
        <div class="lobby-item-meta">Capacity: ${room.players.length}/4 Executives</div>
      </div>
      <button class="btn btn-secondary btn-sm btn-join" data-id="${room.lobbyId}">Join Room</button>
    `;
    lobbiesContainer.appendChild(card);
  });

  document.querySelectorAll('.btn-join').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')!;
      sounds.playClick();
      socket.emit('join_lobby', { lobbyId: id });
    });
  });
}

function updateLobbyRoom(room: any) {
  roomTitle.textContent = `Boardroom: ${room.name}`;
  lblRoomId.textContent = room.lobbyId;
  lblRoomCount.textContent = room.players.length;

  roomPlayersList.innerHTML = '';
  room.players.forEach((p: any, idx: number) => {
    const isHost = room.hostId === p.id;
    const isMe = p.id === myId;
    const slot = document.createElement('div');
    slot.className = `lobby-player-slot ${isMe ? 'me' : ''}`;
    slot.innerHTML = `
      <span class="lobby-player-dot" style="background: ${PLAYER_COLORS[idx % 4]};"></span>
      <span class="slot-player-name">${p.name} ${isMe ? '(You)' : ''}</span>
      <span class="slot-player-role ${p.ready ? 'is-ready' : ''}">${isHost ? 'Host · ' : ''}${p.connected === false ? 'Reconnecting' : p.ready ? 'Ready' : 'Not ready'}</span>
    `;
    roomPlayersList.appendChild(slot);
  });

  const me = room.players.find((p: any) => p.id === myId);
  isReady = Boolean(me?.ready);
  btnReady.classList.toggle('btn-primary', isReady);
  btnReady.classList.toggle('btn-secondary', !isReady);
  btnReady.querySelector('span')!.textContent = isReady ? 'Ready ✓' : 'Mark Ready';

  if (room.hostId === myId && room.players.length >= 3 && room.players.every((p: any) => p.ready && p.connected !== false)) {
    btnStartGame.disabled = false;
  } else {
    btnStartGame.disabled = true;
  }
}

// Perimeter coordinate calculation clockwise
function getGridPosition(index: number, level: number): { col: number; row: number } {
  let W = 8;
  let H = 6;
  if (level === 2) { W = 9; H = 7; }
  else if (level === 3) { W = 10; H = 8; }

  // 1. Top Edge (0 to W-1)
  if (index < W) return { col: index + 1, row: 1 };
  // 2. Right Edge (W to W+H-2)
  if (index < W + H - 1) return { col: W, row: (index - W) + 2 };
  // 3. Bottom Edge (W+H-1 to 2W+H-3)
  if (index < 2 * W + H - 2) return { col: (2 * W + H - 2) - index, row: H };
  // 4. Left Edge (2W+H-2 to 2W+2H-5)
  return { col: 1, row: (2 * W + 2 * H - 3) - index };
}

function renderGame(state: any) {
  const me = state.players.find((p: any) => p.id === myId);
  if (!me) return;

  // 1. Top Market Bar Updates (Section 4.A)
  lblRoundNum.textContent = `${state.currentRound}`;
  lblInflation.textContent = `${(state.inflationRate * 100).toFixed(1)}%`;
  lblEconomy.textContent = state.economy.state.toUpperCase();
  lblEconomy.title = state.economy.explanation;

  // Render 20 progression dots
  roundDotsContainer.innerHTML = '';
  for (let r = 1; r <= 20; r++) {
    const dot = document.createElement('div');
    dot.className = 'round-dot';
    if (r < state.currentRound) dot.classList.add('completed');
    else if (r === state.currentRound) dot.classList.add('current');
    roundDotsContainer.appendChild(dot);
  }

  const activePlayer = state.players[state.activePlayerIndex];
  const isMyTurn = activePlayer.id === myId;
  lblActivePlayer.textContent = isMyTurn ? 'Your Turn' : `${activePlayer.name}'s Turn`;
  lblPhaseIndicator.textContent = state.currentPhase.toUpperCase().replace('_', ' ');

  // If in end_turn phase and it is our turn, activate clickable pulse styling on top indicator
  if (state.currentPhase === 'end_turn' && isMyTurn) {
    lblPhaseIndicator.classList.add('is-end-turn');
    lblPhaseIndicator.title = 'Click to End Turn';
  } else {
    lblPhaseIndicator.classList.remove('is-end-turn');
    lblPhaseIndicator.removeAttribute('title');
  }

  // Update Market Prices & Ticker Flashes
  for (const [sym, price] of Object.entries(state.marketPrices.stocks as Record<string, number>)) {
    const priceCell = document.getElementById(`val-price-${sym}`);
    const changeCell = document.getElementById(`val-change-${sym}`);
    const pill = document.getElementById(`pill-${sym}`);
    const prevPrice = previousStockPrices[sym] || price;
    
    if (priceCell) priceCell.textContent = `$${price}`;
    
    if (changeCell) {
      const diff = price - prevPrice;
      const pct = prevPrice > 0 ? ((diff / prevPrice) * 100).toFixed(1) : '0.0';
      if (diff > 0) {
        changeCell.className = 'ticker-change up';
        changeCell.textContent = `▲ ${pct}%`;
        if (pill) {
          pill.classList.add('ticker-flash-up');
          setTimeout(() => pill.classList.remove('ticker-flash-up'), 600);
        }
      } else if (diff < 0) {
        changeCell.className = 'ticker-change down';
        changeCell.textContent = `▼ ${Math.abs(Number(pct))}%`;
        if (pill) {
          pill.classList.add('ticker-flash-down');
          setTimeout(() => pill.classList.remove('ticker-flash-down'), 600);
        }
      }
    }
    previousStockPrices[sym] = price;
  }

  // Update Exchange Pulse Snippet
  const topMover = Object.entries(state.marketPrices.stocks as Record<string, number>)[0];
  if (topMover) {
    lblExchangePulse.textContent = `${topMover[0]} currently trading at $${topMover[1]} per share`;
  }

  // 2. Left Standings Panel Updates (Section 4.B)
  renderStandings(state);

  // 3. Central Board Updates (Section 5, 6, 7)
  renderBoard(state, me);

  // 4. Right Personal Panel & Donut Chart (Section 4.D, 14)
  renderPersonalPanel(state, me);

  // 5. Bottom Reaction Tray (Section 11)
  renderReactionTray(state, me);

  // 6. Action Drawer & Modals System (Section 9, 10)
  handlePopOutsAndModals(state, me);
}

function renderStandings(state: any) {
  standingsList.innerHTML = '';
  const sortedPlayers = [...state.players].sort((a, b) =>
    b.financialHealth.score - a.financialHealth.score || b.netWorth - a.netWorth
  );

  sortedPlayers.forEach((p: any) => {
    const originalIdx = state.players.findIndex((pl: any) => pl.id === p.id);
    const isActive = originalIdx === state.activePlayerIndex;
    const rank = sortedPlayers.findIndex(pl => pl.id === p.id) + 1;
    const playerColor = p.color || PLAYER_COLORS[originalIdx % 4];

    const prevNw = previousNetWorths[p.id] || p.netWorth;
    const nwDelta = p.netWorth - prevNw;
    const isUp = nwDelta >= 0;
    previousNetWorths[p.id] = p.netWorth;

    const card = document.createElement('div');
    card.className = `standings-player-card lvl-${p.level} ${isActive ? 'active-turn' : ''} ${p.connected === false ? 'is-disconnected' : ''}`;

    card.innerHTML = `
      <div class="player-card-top">
        <span class="rank-badge">${rank}</span>
        <div class="executive-chip" style="background: ${playerColor};">
          ${p.avatar || p.name.substring(0, 2).toUpperCase()}
        </div>
        <div class="player-identity-wrap">
          <div class="player-card-name">${p.name} ${p.id === myId ? '(You)' : ''}</div>
          <div class="player-card-sub">
            <span class="health-public">◎ ${p.financialHealth.score}/100</span>
            <span class="level-tag">LVL ${p.level}</span>
          </div>
        </div>
        <span class="connection-state">${p.connected === false ? 'OFFLINE' : ''}</span>
      </div>
      <div class="player-card-bottom">
        <span class="player-networth-val">$${p.netWorth.toLocaleString()} net worth</span>
        <span class="player-delta-indicator ${isUp ? 'up' : 'down'}">
          ${isUp ? '▲' : '▼'} $${Math.abs(nwDelta).toLocaleString()}
        </span>
      </div>
    `;
    standingsList.appendChild(card);
  });
}

function renderBoard(state: any, me: any) {
  const boardLvl = me.level;
  const tiles = BOARD_TILES[boardLvl];

  // Update Board Banner Info
  const lvlNames: Record<number, string> = { 1: 'STREET INVESTOR', 2: 'PORTFOLIO MANAGER', 3: 'ASSET OWNER' };
  lblBoardLevelTitle.innerHTML = `<span class="lvl-badge">LEVEL ${boardLvl}</span><span class="lvl-name">${lvlNames[boardLvl]}</span>`;

  if (boardLvl >= 2) {
    chipUnlockBonds.className = 'unlock-chip active';
    chipUnlockBonds.textContent = '✓ Bonds Unlocked';
  } else {
    chipUnlockBonds.className = 'unlock-chip locked';
    chipUnlockBonds.textContent = '🔒 Bonds (Lvl 2)';
  }

  if (boardLvl >= 3) {
    chipUnlockRealEstate.className = 'unlock-chip active';
    chipUnlockRealEstate.textContent = '✓ Property Unlocked';
  } else {
    chipUnlockRealEstate.className = 'unlock-chip locked';
    chipUnlockRealEstate.textContent = '🔒 Real Estate (Lvl 3)';
  }

  // Clear previous board tiles
  document.querySelectorAll('.board-tile').forEach(t => t.remove());

  let W = 8; let H = 6;
  if (boardLvl === 2) { W = 9; H = 7; }
  else if (boardLvl === 3) { W = 10; H = 8; }

  gameBoard.style.gridTemplateColumns = `repeat(${W}, 1fr)`;
  gameBoard.style.gridTemplateRows = `repeat(${H}, 1fr)`;

  const centerArea = document.getElementById('market-exchange-center')!;
  centerArea.style.gridColumn = `2 / ${W}`;
  centerArea.style.gridRow = `2 / ${H}`;

  // Render individual tiles with accent strips (Section 7)
  tiles.forEach((tile: string, idx: number) => {
    const tileDiv = document.createElement('div');
    const pos = getGridPosition(idx, boardLvl);
    tileDiv.style.gridColumn = `${pos.col}`;
    tileDiv.style.gridRow = `${pos.row}`;

    let icon = '💵';
    let label = tile.toUpperCase();

    if (idx === 0) {
      icon = '🏁';
      label = 'START';
      tileDiv.className = 'board-tile tile-start';
    } else if (tile === 'Income') {
      icon = '💰';
      label = 'INCOME';
      tileDiv.className = 'board-tile tile-income';
    } else if (tile === 'Investment') {
      icon = '📈';
      label = 'INVEST';
      tileDiv.className = 'board-tile tile-investment';
    } else if (tile === 'Decision') {
      icon = '◆';
      label = 'DECIDE';
      tileDiv.className = 'board-tile tile-decision';
    } else if (tile === 'Market') {
      icon = '⚡';
      label = 'MARKET';
      tileDiv.className = 'board-tile tile-event';
    } else if (tile === 'LifeEvent') {
      icon = '♥';
      label = 'LIFE';
      tileDiv.className = 'board-tile tile-insider';
    } else if (tile === 'Opportunity') {
      icon = '↗';
      label = 'OPPORTUNITY';
      tileDiv.className = 'board-tile tile-trade';
    } else {
      icon = '⚪';
      label = 'NEUTRAL';
      tileDiv.className = 'board-tile tile-neutral';
    }

    tileDiv.id = `board-tile-${idx}`;
    tileDiv.innerHTML = `
      <div class="tile-accent-strip"></div>
      <div class="tile-header-row">
        <span class="tile-index-num">${idx}</span>
        <span class="tile-icon">${icon}</span>
      </div>
      <div class="tile-tokens-container" id="tile-tokens-${idx}"></div>
      <span class="tile-label">${label}</span>
    `;

    gameBoard.appendChild(tileDiv);
  });

  // Render player tokens on board tiles
  state.players.forEach((p: any, pIdx: number) => {
    if (p.level === boardLvl) {
      const cellContainer = document.getElementById(`tile-tokens-${p.position}`);
      if (cellContainer) {
        const token = document.createElement('div');
        token.className = 'token-chip-board';
        token.style.background = p.color || PLAYER_COLORS[pIdx % 4];
        token.textContent = p.avatar || '';
        token.title = `${p.name} (Lvl ${p.level})`;
        cellContainer.appendChild(token);
      }
    }
  });

  // Update Central Market Exchange Console (Section 6)
  const activePlayer = state.players[state.activePlayerIndex];
  const isMyTurn = activePlayer.id === myId;
  lblExchangePhase.textContent = isMyTurn ? 'YOUR TURN' : `${activePlayer.name.toUpperCase()}'S TURN`;

  if (state.currentPhase === 'roll') {
    lblExchangeInstruction.textContent = isMyTurn ? 'PRESS ROLL TO ENTER THE MARKET' : 'WAITING FOR ROLL...';
    btnGameRoll.classList.remove('hidden');
    btnGameRoll.disabled = !isMyTurn;
    btnGameEndTurn.classList.add('hidden');
  } else if (state.currentPhase === 'tile_action') {
    lblExchangeInstruction.textContent = 'EVALUATING OPPORTUNITY...';
    btnGameRoll.classList.add('hidden');
    btnGameEndTurn.classList.add('hidden');
  } else if (state.currentPhase === 'end_turn') {
    lblExchangeInstruction.textContent = isMyTurn ? 'READY TO COMPLETE TURN' : 'CONCLUDING TURN...';
    btnGameRoll.classList.add('hidden');
    if (isMyTurn) {
      btnGameEndTurn.classList.remove('hidden');
      btnGameEndTurn.disabled = false;
    } else {
      btnGameEndTurn.classList.add('hidden');
    }
  } else {
    btnGameRoll.classList.add('hidden');
    btnGameEndTurn.classList.add('hidden');
  }

  // Flash landed tile
  const activeTile = document.getElementById(`board-tile-${activePlayer.position}`);
  if (activeTile && state.currentPhase !== 'roll') {
    activeTile.classList.add('tile-landed');
    setTimeout(() => activeTile.classList.remove('tile-landed'), 1500);
  }
}

function renderPersonalPanel(state: any, me: any) {
  // Hero Net Worth & Threshold Progress
  lblMyNetWorth.textContent = `$${me.netWorth.toLocaleString()}`;
  lblMyCash.textContent = `$${me.cash.toLocaleString()}`;
  lblEmergencySavings.textContent = `$${me.emergencySavings.toLocaleString()}`;
  lblDebt.textContent = `$${me.debt.toLocaleString()}`;
  lblHealthScore.textContent = `${me.financialHealth.score}`;
  const canManageSavings = state.players[state.activePlayerIndex].id === myId && ['roll', 'end_turn'].includes(state.currentPhase);
  btnSave100.disabled = !canManageSavings || me.cash < 100;
  btnWithdraw100.disabled = !canManageSavings || me.emergencySavings < 100;

  const prevNw = previousNetWorths[myId] || me.netWorth;
  const nwDelta = me.netWorth - prevNw;
  const isUp = nwDelta >= 0;
  lblMyNetWorthDelta.className = `nw-delta ${isUp ? 'up' : 'down'}`;
  lblMyNetWorthDelta.textContent = `${isUp ? '▲' : '▼'} $${Math.abs(nwDelta).toLocaleString()} (${me.netWorth > 0 ? ((Math.abs(nwDelta) / me.netWorth) * 100).toFixed(1) : '0'}%)`;

  let nextThreshold = 2500;
  if (me.level === 2) nextThreshold = 6000;
  else if (me.level === 3) nextThreshold = 10000;

  lblMyLevelBadge.textContent = `LVL ${me.level} ${me.level === 1 ? 'STREET INVESTOR' : me.level === 2 ? 'PORTFOLIO MANAGER' : 'ASSET OWNER'}`;
  lblNextThreshold.textContent = me.level === 3 ? `Health: ${me.financialHealth.score}/100` : `Threshold: $${nextThreshold.toLocaleString()}`;
  const progressPercent = Math.min(100, Math.max(0, (me.netWorth / nextThreshold) * 100));
  barNetWorth.style.width = `${progressPercent}%`;

  // Calculate Asset Breakdown & Values
  let totalStockVal = 0;
  for (const [sym, qty] of Object.entries(me.portfolio.stocks as Record<string, number>)) {
    const price = state.marketPrices.stocks[sym] || 100;
    const val = qty * price;
    totalStockVal += val;

    const sharesEl = document.getElementById(`val-shares-${sym}`);
    const valEl = document.getElementById(`val-holdings-${sym}`);
    if (sharesEl) sharesEl.textContent = `${qty} shares`;
    if (valEl) valEl.textContent = `$${val.toLocaleString()}`;
  }
  lblTotalStocksVal.textContent = `$${totalStockVal.toLocaleString()}`;

  let totalBondsVal = 0;
  bondsList.innerHTML = '';
  if (me.portfolio.bonds.length === 0) {
    bondsList.innerHTML = '<p class="empty-list-note">No active bonds. Purchase government bonds at Level 2.</p>';
  } else {
    me.portfolio.bonds.forEach((bond: any) => {
      totalBondsVal += bond.principal;
      const bRow = document.createElement('div');
      bRow.className = 'bond-holding-item';
      bRow.innerHTML = `
        <span>Gov Bond ($${bond.principal})</span>
        <span class="bond-countdown-tag">${bond.turnsLeft} turns left</span>
      `;
      bondsList.appendChild(bRow);
    });
  }
  lblTotalBondsVal.textContent = `$${totalBondsVal.toLocaleString()}`;

  const propCount = me.portfolio.properties.length;
  const totalPropertyVal = propCount * 1600;
  lblPropertyProgressCount.textContent = `${propCount} owned`;
  propertiesList.innerHTML = '';
  if (propCount === 0) {
    propertiesList.innerHTML = '<p class="empty-list-note">No property yet. Level 3 property adds income but also maintenance.</p>';
  } else {
    me.portfolio.properties.forEach((_: any, idx: number) => {
      const pRow = document.createElement('div');
      pRow.className = 'property-badge-item';
      pRow.innerHTML = `
        <span>🏛️ Harbor Studio #${idx + 1}</span>
        <span>+$90 income · $80 maintenance</span>
      `;
      propertiesList.appendChild(pRow);
    });
  }

  // Donut Chart SVG Segment Rendering (Section 4.D, 14)
  const liquidAssets = me.cash + me.emergencySavings;
  const totalAssets = Math.max(1, liquidAssets + totalStockVal + totalBondsVal + totalPropertyVal);
  const cashPct = Math.round((liquidAssets / totalAssets) * 100);
  const stockPct = Math.round((totalStockVal / totalAssets) * 100);
  const bondPct = Math.round((totalBondsVal / totalAssets) * 100);
  const propPct = Math.max(0, 100 - (cashPct + stockPct + bondPct));

  lblPctCash.textContent = `${cashPct}%`;
  lblPctStocks.textContent = `${stockPct}%`;
  lblPctBonds.textContent = `${bondPct}%`;
  lblPctProperty.textContent = `${propPct}%`;
  lblDonutCashPct.textContent = `${cashPct}%`;

  // Circumference of radius 40 circle is 2 * PI * 40 = 251.32
  const C = 251.32;
  const cashLen = (cashPct / 100) * C;
  const stockLen = (stockPct / 100) * C;
  const bondLen = (bondPct / 100) * C;
  const propLen = (propPct / 100) * C;

  donutSegCash.setAttribute('stroke-dasharray', `${cashLen} ${C}`);
  donutSegCash.setAttribute('stroke-dashoffset', '0');

  donutSegStocks.setAttribute('stroke-dasharray', `${stockLen} ${C}`);
  donutSegStocks.setAttribute('stroke-dashoffset', `-${cashLen}`);

  donutSegBonds.setAttribute('stroke-dasharray', `${bondLen} ${C}`);
  donutSegBonds.setAttribute('stroke-dashoffset', `-${cashLen + stockLen}`);

  donutSegProperty.setAttribute('stroke-dasharray', `${propLen} ${C}`);
  donutSegProperty.setAttribute('stroke-dashoffset', `-${cashLen + stockLen + bondLen}`);

  // Activity Logs
  logsContainer.innerHTML = '';
  state.logs.forEach((log: string) => {
    const entry = document.createElement('div');
    entry.className = 'activity-feed-item';
    entry.textContent = log;
    logsContainer.appendChild(entry);
  });

  // Financial Ripple timeline
  lblReactionTabCount.textContent = `${me.scheduledEffects.length}`;
  reactionsContainer.innerHTML = '';
  if (me.scheduledEffects.length === 0) {
    reactionsContainer.innerHTML = '<p class="empty-list-note">No future payments or delayed rewards are scheduled.</p>';
  } else {
    me.scheduledEffects.forEach((effect: any) => {
      const cDiv = document.createElement('div');
      const isPayment = effect.effectType === 'debt_payment';
      cDiv.className = `tactical-card-list-item ripple-item ${isPayment ? 'ripple-payment' : 'ripple-reward'}`;
      cDiv.innerHTML = `
        <div class="card-list-item-top">
          <span class="card-type-chip">${isPayment ? 'FUTURE PAYMENT' : 'FUTURE BENEFIT'}</span>
          <span class="card-status-badge badge-idle">IN ${effect.turnsUntilTrigger} TURN${effect.turnsUntilTrigger === 1 ? '' : 'S'}</span>
        </div>
        <div class="card-title-text">${effect.source}</div>
        <div class="card-trigger-desc">${effect.description}</div>
        <div class="ripple-amount ${isPayment ? 'negative' : 'positive'}">${isPayment ? '−' : '+'}$${effect.amount} · ${effect.remainingTriggers} remaining</div>
      `;
      reactionsContainer.appendChild(cDiv);
    });
  }
}

function renderReactionTray(_state: any, _me: any) {
  reactionTrayWrapper.innerHTML = '';
}

function handlePopOutsAndModals(state: any, me: any) {
  const isMyTurn = state.players[state.activePlayerIndex].id === myId;
  const pending = state.currentPendingAction;

  if (state.winnerId) {
    const winner = state.players.find((p: any) => p.id === state.winnerId);
    if (!winner) return;
    modalGameOver.classList.add('active');
    lblWinnerName.textContent = winner.name;
    lblWinnerNetWorth.textContent = `${winner.financialHealth.score} / 100`;
    const winnerCaption = document.getElementById('lbl-winner-caption')!;
    winnerCaption.textContent = winner.financialHealth.summary.join(' ');
    finalStandingsBody.innerHTML = '';
    const sorted = [...state.players].sort((a, b) =>
      b.financialHealth.score - a.financialHealth.score || b.netWorth - a.netWorth
    );
    sorted.forEach((p: any, idx: number) => {
      const row = document.createElement('div');
      row.className = 'final-row';
      row.title = p.financialHealth.summary.join(' ');
      row.innerHTML = `
        <span>#${idx + 1}</span>
        <span><strong>${p.name}</strong></span>
        <span>${p.financialHealth.score}/100</span>
        <span>$${p.netWorth.toLocaleString()}</span>
      `;
      finalStandingsBody.appendChild(row);
    });
    return;
  }

  if (pending?.type === 'decision' && pending.details.card) {
    actionDrawerOverlay.classList.toggle('open', isMyTurn);
    if (!isMyTurn) return;
    const card = pending.details.card;
    drawerActionBadge.textContent = `${card.category.replace('_', ' ').toUpperCase()} · ${card.concept.toUpperCase()}`;
    drawerBodyContent.innerHTML = `
      <div class="decision-card-intro">
        <span class="decision-concept">${card.concept}</span>
        <h2>${card.title}</h2>
        <p>${card.scenario}</p>
      </div>
      <div class="decision-choice-list">
        ${card.choices.map((choice: any, index: number) => {
          const affordable = me.cash + (choice.effect.cash || 0) >= 0 && me.emergencySavings + (choice.effect.emergencySavings || 0) >= 0;
          return `
            <button class="decision-choice" data-choice-id="${choice.id}" ${affordable ? '' : 'disabled'}>
              <span class="choice-letter">${String.fromCharCode(65 + index)}</span>
              <span class="choice-copy"><strong>${choice.label}</strong><small>${choice.description}</small></span>
              <span class="choice-arrow">→</span>
            </button>
          `;
        }).join('')}
      </div>
      <p class="decision-footnote">There may be more than one reasonable choice. Think about cash now and commitments later.</p>
    `;
    drawerBodyContent.querySelectorAll<HTMLButtonElement>('.decision-choice').forEach(button => {
      button.addEventListener('click', () => {
        sounds.playClick();
        socket.emit('choose_card', { gameId: activeLobbyId, choiceId: button.dataset.choiceId });
        actionDrawerOverlay.classList.remove('open');
      });
    });
    return;
  }

  if (pending?.type === 'investment' && pending.details.card) {
    actionDrawerOverlay.classList.toggle('open', isMyTurn);
    if (!isMyTurn) return;
    const card = pending.details.card;
    const total = ['stock', 'fund'].includes(card.type) ? card.price * card.quantity : card.price;
    const cashAfter = me.cash - total;
    drawerActionBadge.textContent = 'INVESTMENT OPPORTUNITY';
    drawerBodyContent.innerHTML = `
      <div class="offer-asset-header">
        <div class="offer-icon-box">${card.type === 'bond' ? '◫' : card.type === 'property' ? '▥' : '↗'}</div>
        <div><div class="offer-name">${card.assetName}</div><div class="offer-class">${card.type.toUpperCase()} · ${card.assetSymbol}</div></div>
      </div>
      <p class="offer-description">${card.description}</p>
      <div class="offer-meta-grid">
        <div class="meta-box"><span class="meta-box-label">RISK</span><span class="meta-box-val risk-${card.risk.toLowerCase()}">${card.risk}</span></div>
        <div class="meta-box"><span class="meta-box-label">QUANTITY</span><span class="meta-box-val">${card.quantity}</span></div>
        <div class="meta-box"><span class="meta-box-label">TOTAL COST</span><span class="meta-box-val">$${total}</span></div>
        <div class="meta-box"><span class="meta-box-label">CASH AFTER</span><span class="meta-box-val ${cashAfter < 0 ? 'risk-high' : ''}">$${cashAfter}</span></div>
      </div>
      <div class="drawer-actions-row">
        <button id="btn-v2-buy" class="btn btn-primary btn-block" ${cashAfter < 0 ? 'disabled' : ''}>BUY FOR $${total}</button>
        <button id="btn-v2-pass" class="btn btn-ghost btn-block">PASS</button>
      </div>
    `;
    document.getElementById('btn-v2-buy')?.addEventListener('click', () => {
      sounds.playCash();
      socket.emit('buy_asset', { gameId: activeLobbyId });
      actionDrawerOverlay.classList.remove('open');
    });
    document.getElementById('btn-v2-pass')?.addEventListener('click', () => {
      sounds.playClick();
      socket.emit('pass_asset', { gameId: activeLobbyId });
      actionDrawerOverlay.classList.remove('open');
    });
    return;
  }

  if (pending?.type === 'event' && pending.details.event) {
    const event = pending.details.event;
    actionDrawerOverlay.classList.remove('open');
    modalEvent.classList.add('active');
    lblEventTitle.textContent = event.name.toUpperCase();
    lblEventDescription.textContent = event.description;
    lblEventImpact.textContent = `${event.economy} · Inflation ${(state.inflationRate * 100).toFixed(1)}%`;
    btnEventContinue.disabled = !isMyTurn;
    btnEventContinue.textContent = isMyTurn ? 'CONTINUE' : `WAITING FOR ${state.players[state.activePlayerIndex].name.toUpperCase()}`;
    return;
  }

  // Level Up Check (Section 11)
  if (me.hasPendingAdvancePrompt) {
    modalLevelUp.classList.add('active');
    sounds.playEvent();
    const nextLvl = me.level + 1;
    lblLevelUpName.textContent = nextLvl === 2 ? 'LEVEL 2: PORTFOLIO MANAGER' : 'LEVEL 3: ASSET OWNER';
    lblLevelUpUnlockText.textContent = nextLvl === 2
      ? 'Government Bonds and increased salary are now available.'
      : 'Real Estate Properties unlocked. Acquire 2 properties for instant victory!';
    return;
  } else {
    modalLevelUp.classList.remove('active');
  }

  // Game Winner / Over Check (Section 17)
  if (state.winnerId) {
    const winner = state.players.find((p: any) => p.id === state.winnerId);
    if (winner) {
      modalGameOver.classList.add('active');
      sounds.playCash();
      lblWinnerName.textContent = winner.name;
      lblWinnerNetWorth.textContent = `$${winner.netWorth.toLocaleString()}`;

      finalStandingsBody.innerHTML = '';
      const sorted = [...state.players].sort((a, b) => b.netWorth - a.netWorth);
      sorted.forEach((p, idx) => {
        const row = document.createElement('div');
        row.className = 'final-row';
        row.innerHTML = `
          <span>#${idx + 1}</span>
          <span><strong>${p.name}</strong></span>
          <span>${p.industry}</span>
          <span>$${p.netWorth.toLocaleString()}</span>
        `;
        finalStandingsBody.appendChild(row);
      });
      return;
    }
  }

  if (!pending) {
    actionDrawerOverlay.classList.remove('open');
    modalEvent.classList.remove('active');
    modalTrade.classList.remove('active');
    modalJackpot.classList.remove('active');
    modalGeneric.classList.remove('active');
    return;
  }

  // 1. Right Action Drawer for Investment Decisions (Section 8.2, 9.2)
  if (isMyTurn && state.currentPhase === 'tile_action' && pending.type === 'reaction' && pending.details.card) {
    const card = pending.details.card;
    const price = pending.details.adjustedPrice ?? card.price;
    drawerActionBadge.textContent = card.action === 'buy' ? 'INVESTMENT OFFER' : 'STOCK LIQUIDATION';
    actionDrawerOverlay.classList.add('open');

    if (card.action === 'buy') {
      const qty = card.quantity ?? 5;
      const total = price * qty;
      const cashAfter = me.cash - total;
      const canAfford = me.cash >= total;

      drawerBodyContent.innerHTML = `
        <div class="offer-asset-header">
          <div class="offer-icon-box">📈</div>
          <div>
            <div class="offer-name">${card.assetName}</div>
            <div class="offer-class">EQUITY ASSET • ${card.assetSymbol}</div>
          </div>
        </div>
        <div class="offer-price-row">
          <span class="offer-current-price">$${price}</span>
          <span class="ticker-change up">▲ 4.2% Market Trend</span>
        </div>
        <div class="sparkline-canvas-box">
          <canvas id="drawer-sparkline"></canvas>
        </div>
        <div class="offer-meta-grid">
          <div class="meta-box">
            <span class="meta-box-label">RISK LEVEL</span>
            <span class="meta-box-val risk-medium">MEDIUM</span>
          </div>
          <div class="meta-box">
            <span class="meta-box-label">OFFER QUANTITY</span>
            <span class="meta-box-val">${qty} Shares</span>
          </div>
          <div class="meta-box">
            <span class="meta-box-label">TOTAL COST</span>
            <span class="meta-box-val">$${total}</span>
          </div>
          <div class="meta-box">
            <span class="meta-box-label">CASH AFTER</span>
            <span class="meta-box-val ${cashAfter < 0 ? 'risk-high' : ''}">$${cashAfter}</span>
          </div>
        </div>
        <div class="drawer-actions-row" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
          <button id="btn-drawer-buy" class="btn btn-primary btn-block" ${!canAfford ? 'disabled' : ''}>
            <span>BUY FOR $${total}</span>
          </button>
          <button id="btn-drawer-pass" class="btn btn-ghost btn-block">
            <span>PASS OFFER</span>
          </button>
        </div>
      `;

      const sparklineCanvas = document.getElementById('drawer-sparkline') as HTMLCanvasElement;
      if (sparklineCanvas) drawSparkline(sparklineCanvas, 'up');

      document.getElementById('btn-drawer-buy')?.addEventListener('click', () => {
        sounds.playCash();
        socket.emit('buy_asset', { gameId: activeLobbyId });
        actionDrawerOverlay.classList.remove('open');
      });

      document.getElementById('btn-drawer-pass')?.addEventListener('click', () => {
        sounds.playClick();
        socket.emit('pass_asset', { gameId: activeLobbyId });
        actionDrawerOverlay.classList.remove('open');
      });
      return;
    } else if (card.action === 'sell') {
      const myShares = me.portfolio.stocks[card.assetSymbol] || 0;
      drawerBodyContent.innerHTML = `
        <div class="offer-asset-header">
          <div class="offer-icon-box">📉</div>
          <div>
            <div class="offer-name">Liquidate ${card.assetName}</div>
            <div class="offer-class">CURRENT PRICE: $${price} / share</div>
          </div>
        </div>
        <div class="input-field-group">
          <label for="input-sell-shares-qty">Shares to Sell (Owned: ${myShares})</label>
          <input type="number" id="input-sell-shares-qty" min="1" max="${myShares}" value="${myShares}" />
        </div>
        <div class="drawer-actions-row" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
          <button id="btn-drawer-sell" class="btn btn-primary btn-block" ${myShares === 0 ? 'disabled' : ''}>
            <span>SELL SHARES</span>
          </button>
          <button id="btn-drawer-sell-pass" class="btn btn-ghost btn-block">
            <span>PASS</span>
          </button>
        </div>
      `;

      document.getElementById('btn-drawer-sell')?.addEventListener('click', () => {
        const inputQty = document.getElementById('input-sell-shares-qty') as HTMLInputElement;
        const qty = parseInt(inputQty?.value || '0', 10);
        sounds.playCash();
        socket.emit('sell_stock', { gameId: activeLobbyId, shares: qty });
        actionDrawerOverlay.classList.remove('open');
      });

      document.getElementById('btn-drawer-sell-pass')?.addEventListener('click', () => {
        sounds.playClick();
        socket.emit('pass_asset', { gameId: activeLobbyId });
        actionDrawerOverlay.classList.remove('open');
      });
      return;
    }
  }

  // 2. Global Event Center Modal (Section 9.3, 10)
  if (pending.type === 'event' && pending.details.event) {
    const event = pending.details.event;
    modalEvent.classList.add('active');
    sounds.playEvent();
    lblEventTitle.textContent = event.name.toUpperCase();
    lblEventDescription.textContent = event.description;
    lblEventImpact.textContent = event.isNegative ? '⚠️ Negative Economic Pressure' : '📈 Positive Market Catalyst';
    
    // Market Shock board tint animation
    if (event.isNegative) {
      gameBoard.classList.add('shock-recession');
      setTimeout(() => gameBoard.classList.remove('shock-recession'), 1000);
    } else {
      gameBoard.classList.add('shock-rally');
      setTimeout(() => gameBoard.classList.remove('shock-rally'), 1000);
    }
    return;
  }

  // 3. Jackpot Center Modal (Section 11)
  if (isMyTurn && pending.type === 'jackpot') {
    modalJackpot.classList.add('active');
    sounds.playCash();
    const isSabotaged = pending.details.sabotaged === true;
    const cashVal = isSabotaged ? 150 : 300;
    lblJackpotCashVal.textContent = `+$${cashVal} Instant Cash`;
    return;
  }

  // 4. Trade Modal (Section 10)
  if (isMyTurn && pending.type === 'trade' && pending.details.step === 'initiate') {
    modalTrade.classList.add('active');
    tradeSelectPlayer.innerHTML = '';
    state.players.forEach((p: any) => {
      if (p.id !== myId) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.industry})`;
        tradeSelectPlayer.appendChild(opt);
      }
    });
    updateTradeEstimates();
    return;
  }

  // 5. Incoming Trade Response Modal
  if (pending.type === 'trade' && pending.details.step === 'pending_response') {
    const offer = pending.details.offer;
    if (offer.receiverId === myId) {
      modalGeneric.classList.add('active');
      sounds.playEvent();
      const sender = state.players.find((p: any) => p.id === offer.senderId);
      lblGenericTitle.textContent = `Trade Proposal from ${sender.name}`;

      const formatStocks = (stk: Record<string, number>) =>
        Object.entries(stk).filter(([_, q]) => q > 0).map(([s, q]) => `${q}x ${s}`).join(', ') || 'None';

      lblGenericBody.innerHTML = `
        <p><strong>Offered to You:</strong> $${offer.offeredCash} Cash, Stocks: ${formatStocks(offer.offeredStocks)}</p>
        <p style="margin-top: 8px;"><strong>Requested in Return:</strong> $${offer.requestedCash} Cash, Stocks: ${formatStocks(offer.requestedStocks)}</p>
      `;

      btnGenericPrimary.textContent = 'Accept Trade';
      btnGenericPrimary.onclick = () => {
        sounds.playCash();
        socket.emit('respond_to_trade', { gameId: activeLobbyId, accept: true });
        modalGeneric.classList.remove('active');
      };

      btnGenericSecondary.textContent = 'Reject';
      btnGenericSecondary.onclick = () => {
        sounds.playClick();
        socket.emit('respond_to_trade', { gameId: activeLobbyId, accept: false });
        modalGeneric.classList.remove('active');
      };
      return;
    }
  }
}

function handleIncomingGameState(gameState: any) {
  const roll = gameState.lastRoll;

  if (roll && roll.rollId !== lastProcessedRollId) {
    lastProcessedRollId = roll.rollId;
    isAnimatingDice = true;
    pendingGameState = gameState;

    animateDiceRolling();

    setTimeout(() => {
      die1.classList.remove('tumbling');
      die2.classList.remove('tumbling');
      (die1.querySelector('.die-face') as HTMLElement).textContent = `${roll.d1}`;
      (die2.querySelector('.die-face') as HTMLElement).textContent = `${roll.d2}`;
      diceTotalCaption.textContent = `Total: ${roll.total}`;
      isAnimatingDice = false;

      showScreen(screenGame);
      renderGame(pendingGameState || gameState);
      pendingGameState = null;
    }, 700);
  } else {
    if (!isAnimatingDice) {
      showScreen(screenGame);
      renderGame(gameState);
    } else {
      pendingGameState = gameState;
    }
  }
}
