const API_BASE = 'http://localhost:3000';
let token = localStorage.getItem('ttt_token') || 'secret-token';
let currentGame = null;
let eventSource = null;
let matchmakingSource = null;
let playerName = '';

function saveToken() {
  token = document.getElementById('apiToken').value.trim();
  localStorage.setItem('ttt_token', token);
  addLog('Token saved', 'success');
}

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function joinQueue() {
  try {
    playerName = document.getElementById('playerName').value.trim();
    if (!playerName) return alert('Please enter your name');
    document.getElementById('joinBtn').disabled = true;
    document.getElementById('joinBtn').textContent = 'Joining...';
    const result = await api('/matchmaking/join', {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    });
    if (result.game) {
      addLog(`Match found with ${result.opponentName}!`, 'success');
      showMatchBanner(result.opponentName, result.game);
      currentGame = result.game;
      renderGame(result.game);
      connectGameEvents(result.game.id);
    } else {
      addLog(`In queue (position ${result.queuePosition})`, 'info');
      updateQueueStatus('waiting');
    }
  } catch (e) {
    addLog(`Erro: ${e.message}`, 'error');
    document.getElementById('joinBtn').disabled = false;
    document.getElementById('joinBtn').textContent = 'Join Queue';
  }
}

async function leaveQueue() {
  try {
    addLog('Leaving queue...', 'info');
    await api('/matchmaking/leave', {
      method: 'DELETE',
      body: JSON.stringify({ playerName }),
    });
    document.getElementById('leaveBtn').classList.add('hidden');
    document.getElementById('joinBtn').disabled = false;
    document.getElementById('joinBtn').textContent = 'Join Queue';
    updateQueueStatus('left');
    addLog('Left the queue', 'success');
  } catch (e) {
    addLog(`Erro: ${e.message}`, 'error');
  }
}

async function loadGame(id) {
  try {
    const game = await api(`/games/${id}`);
    currentGame = game;
    document.getElementById('gameCard').classList.remove('hidden');
    renderGame(game);
    connectGameEvents(game.id);
  } catch (e) {
    addLog(`Erro: ${e.message}`, 'error');
  }
}

async function makeMove(row, col) {
  if (!currentGame || currentGame.status !== 'PLAYING') return;
  try {
    const game = await api(`/games/${currentGame.id}/moves`, {
      method: 'POST',
      body: JSON.stringify({ playerSymbol: currentGame.turn, row, col }),
    });
    currentGame = game;
    renderGame(game);
    addLog(`${game.turn} played (${row},${col})`, 'success');
  } catch (e) {
    addLog(`Erro: ${e.message}`, 'error');
  }
}

function leaveGame() {
  currentGame = null;
  if (eventSource) { eventSource.close(); eventSource = null; }
  document.getElementById('gameCard').classList.add('hidden');
  addLog('Left the game');
}

function showMatchBanner(opponent, game) {
  document.getElementById('matchBanner').classList.remove('hidden');
  document.getElementById('matchInfo').textContent = `You vs ${opponent}`;
  document.getElementById('joinBtn').disabled = false;
  document.getElementById('joinBtn').textContent = 'Join Queue';
}

function updateQueueStatus(state) {
  const area = document.getElementById('queueArea');
  if (state === 'waiting') {
    area.innerHTML = `
      <div class="queue-status">
        <div class="spinner"></div>
        <div>Looking for opponent...</div>
        <div class="players-waiting">You are in queue</div>
      </div>`;
    document.getElementById('leaveBtn').classList.remove('hidden');
  } else if (state === 'left') {
    area.innerHTML = '<div class="empty-state">You left the queue</div>';
    document.getElementById('leaveBtn').classList.add('hidden');
  }
}

function renderGame(game) {
  document.getElementById('gameCard').classList.remove('hidden');
  document.getElementById('gameIdDisplay').textContent = game.id;

  const turnEl = document.getElementById('turnIndicator');
  turnEl.textContent = `Turn: ${game.turn}`;
  turnEl.className = `turn-indicator ${game.turn.toLowerCase()}`;

  const statusEl = document.getElementById('gameStatus');
  statusEl.textContent = game.status;
  statusEl.className = `game-status ${game.status.toLowerCase()}`;

  const playersInfoEl = document.getElementById('playersInfo');
  playersInfoEl.innerHTML = '';
  const badgeX = document.createElement('span');
  badgeX.className = 'player-badge x';
  badgeX.textContent = `X: ${game.players.X}`;
  const badgeO = document.createElement('span');
  badgeO.className = 'player-badge o';
  badgeO.textContent = `O: ${game.players.O}`;
  playersInfoEl.appendChild(badgeX);
  playersInfoEl.appendChild(badgeO);

  document.getElementById('winnerInfo').textContent =
    game.status === 'WON' ? `🏆 Winner: ${game.players[game.winner]}` :
    game.status === 'DRAW' ? '🤝 Draw!' : '';

  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell = document.createElement('div');
      const val = game.board[r][c];
      if (val) {
        cell.className = 'cell taken ' + val.toLowerCase();
        cell.textContent = val;
      } else if (game.status === 'PLAYING') {
        cell.className = 'cell';
        cell.onclick = () => makeMove(r, c);
      } else {
        cell.className = 'cell disabled';
      }
      boardEl.appendChild(cell);
    }
  }
}

async function listGames() {
  try {
    const games = await api('/games');
    renderGamesList(games);
    addLog(`${games.length} game(s) found`, 'success');
  } catch (e) {
    addLog(`Erro: ${e.message}`, 'error');
  }
}

function renderGamesList(games) {
  const ul = document.getElementById('gamesList');
  ul.innerHTML = '';
  if (!games.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'No games';
    ul.appendChild(li);
    return;
  }
  for (const g of games) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = `${g.players.X} vs ${g.players.O} — `;
    const strong = document.createElement('strong');
    strong.textContent = g.status;
    span.appendChild(strong);
    li.appendChild(span);

    const btn = document.createElement('button');
    btn.textContent = 'Join';
    btn.onclick = () => loadGame(g.id);
    li.appendChild(btn);

    ul.appendChild(li);
  }
}

function connectSSE(url, options = {}) {
  const { headers = {}, onopen, onmessage, onerror } = options;
  let closed = false;

  fetch(url, { headers })
    .then((res) => {
      if (closed) return;
      if (!res.ok) { onerror?.(); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function read() {
        reader.read().then(({ done, value }) => {
          if (done || closed) return;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed.startsWith('data:')) {
              const data = trimmed.slice(5).trim();
              try { onmessage?.(JSON.parse(data)); } catch {}
            }
          }

          read();
        }).catch(() => { onerror?.(); });
      }

      onopen?.();
      read();
    })
    .catch(() => { onerror?.(); });

  return {
    close: () => { closed = true; },
  };
}

function connectGameEvents(gameId) {
  if (eventSource) eventSource.close();
  eventSource = connectSSE(`${API_BASE}/games/${gameId}/events`, {
    headers: { Authorization: `Bearer ${token}` },
    onopen: () => {
      document.getElementById('connDot').className = 'connection-dot online';
      addLog('Connected to game stream', 'success');
    },
    onmessage: (data) => {
      currentGame = data;
      renderGame(data);
    },
    onerror: () => {
      document.getElementById('connDot').className = 'connection-dot offline';
      addLog('Game stream disconnected', 'error');
    },
  });
}

function connectMatchmakingEvents() {
  if (matchmakingSource) matchmakingSource.close();
  matchmakingSource = connectSSE(`${API_BASE}/matchmaking/events`, {
    headers: { Authorization: `Bearer ${token}` },
    onopen: () => addLog('Connected to matchmaking stream', 'success'),
    onmessage: (event) => {
      try {
        addLog(`[MATCHMAKING] ${event.type}${event.playerName ? ': ' + event.playerName : ''}${event.opponentName ? ' vs ' + event.opponentName : ''}${event.gameId ? ' jogo:' + event.gameId : ''}`, 'info');

        if (event.type === 'MATCH_FOUND' && event.gameId) {
          addLog('Match found! Loading game...', 'success');
          loadGame(event.gameId);
        }
        if (event.type === 'PLAYER_LEFT') {
          updateQueueStatus('left');
        }
      } catch {}
    },
    onerror: () => {
      addLog('Matchmaking stream disconnected', 'error');
    },
  });
}

function addLog(msg, type = '') {
  const log = document.getElementById('eventLog');
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${time}] ${msg}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

document.getElementById('apiToken').value = token;
connectMatchmakingEvents();
listGames();