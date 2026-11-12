/**
 * HazMan Game Tracker - Engine & State Management
 * Implements Game List, New Game Setup (3-5 players), Target Tracking (1000 pts),
 * Dynamic Scoreboard, and Round Score Validation (ensuring total scores stay at 360).
 */

const STORAGE_KEY_HAZMAN = "hazman_games_data_v1";
const MAX_COMPLETED_GAMES = 5;

// Toast Helper
let toastTimer = null;
function showToast(message) {
  if (!DOM.hazmanToast) return;
  DOM.hazmanToast.textContent = message;
  DOM.hazmanToast.classList.remove("hidden");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    DOM.hazmanToast.classList.add("hidden");
  }, 2800);
}

// Check if a game is completed
function isGameCompleted(game) {
  if (game.finished || game.winnerAnnounced) return true;
  const totals = calculatePlayerTotals(game);
  return totals.some(score => score >= game.finalTarget);
}

// Enforce game history limit: Retains max 5 completed games, automatically removing oldest
function enforceGameHistoryLimit() {
  const completed = [];
  const active = [];

  hazmanState.games.forEach(g => {
    if (isGameCompleted(g)) {
      completed.push(g);
    } else {
      active.push(g);
    }
  });

  // If completed games exceed 5, sort descending (newest first) and keep only last 5
  if (completed.length > MAX_COMPLETED_GAMES) {
    completed.sort((a, b) => {
      const timeA = a.completedAt || a.createdAt || 0;
      const timeB = b.completedAt || b.createdAt || 0;
      return timeB - timeA;
    });

    const keptCompleted = completed.slice(0, MAX_COMPLETED_GAMES);
    hazmanState.games = [...active, ...keptCompleted];
    saveGamesToStorage();
  }
}

// State
let hazmanState = {
  games: [],
  activeGameId: null
};

// Cached DOM Elements
const DOM = {
  // Views
  viewGameList: document.getElementById("view-game-list"),
  viewNewGame: document.getElementById("view-new-game"),
  viewGameDetail: document.getElementById("view-game-detail"),

  // Game List View
  emptyState: document.getElementById("empty-state-container"),
  gamesCollection: document.getElementById("games-collection"),
  btnFabNewGame: document.getElementById("btn-fab-new-game"),
  btnQuickAddGame: document.getElementById("btn-quick-add-game"),
  btnOpenSettings: document.getElementById("btn-open-settings"),

  // New Game Setup View
  formNewGame: document.getElementById("form-new-game"),
  btnCancelNewGame: document.getElementById("btn-cancel-new-game"),
  btnSaveCheckmark: document.getElementById("btn-save-checkmark"),
  btnSaveNewGame: document.getElementById("btn-save-new-game"),
  inputGameName: document.getElementById("input-game-name"),
  inputFinalTarget: document.getElementById("input-final-target"),
  inputRoundScore: document.getElementById("input-round-score"),
  playerInputsContainer: document.getElementById("player-inputs-container"),
  chkNotifyTarget: document.getElementById("chk-notify-target"),
  chkNotifyScoreMismatch: document.getElementById("chk-notify-score-mismatch"),

  // Game Detail View
  btnBackToList: document.getElementById("btn-back-to-list"),
  btnDeleteGame: document.getElementById("btn-delete-game"),
  detailGameTitle: document.getElementById("detail-game-title"),
  btnEditGame: document.getElementById("btn-edit-game"),
  infoFinalTarget: document.getElementById("info-final-target"),
  infoRoundScore: document.getElementById("info-round-score"),
  infoScoreNotify: document.getElementById("info-score-notify"),
  infoTargetNotify: document.getElementById("info-target-notify"),
  infoTotalPlayer: document.getElementById("info-total-player"),
  infoTotalRound: document.getElementById("info-total-round"),
  btnOpenAddScore: document.getElementById("btn-open-add-score"),
  btnUndoScore: document.getElementById("btn-undo-score"),
  scoreboardList: document.getElementById("scoreboard-list"),
  btnDeleteLastScore: document.getElementById("btn-delete-last-score"),
  pointTableHead: document.getElementById("point-table-head"),
  pointTableBody: document.getElementById("point-table-body"),
  hazmanToast: document.getElementById("hazman-toast"),

  // Add Score Modal
  modalAddScore: document.getElementById("modal-add-score"),
  modalRoundTitle: document.getElementById("modal-round-title"),
  balancePill: document.getElementById("balance-pill"),
  balanceStatusText: document.getElementById("balance-status-text"),
  balanceDiffText: document.getElementById("balance-diff-text"),
  formAddScore: document.getElementById("form-add-score"),
  addScoreInputs: document.getElementById("add-score-inputs"),
  btnAutoFillLast: document.getElementById("btn-auto-fill-last"),
  btnCancelAddScore: document.getElementById("btn-cancel-add-score"),
  btnSubmitScore: document.getElementById("btn-submit-score"),

  // Edit Game Modal
  modalEditGame: document.getElementById("modal-edit-game"),
  formEditGame: document.getElementById("form-edit-game"),
  editGameName: document.getElementById("edit-game-name"),
  editFinalTarget: document.getElementById("edit-final-target"),
  editPlayersContainer: document.getElementById("edit-players-container"),
  editChkTargetNotify: document.getElementById("edit-chk-target-notify"),
  editChkScoreNotify: document.getElementById("edit-chk-score-notify"),
  btnCancelEditGame: document.getElementById("btn-cancel-edit-game"),

  // Winner Modal
  modalHazmanWinner: document.getElementById("modal-hazman-winner"),
  hazmanWinnerBox: document.getElementById("hazman-winner-box"),
  btnCloseHazmanWinner: document.getElementById("btn-close-hazman-winner"),

  // Settings Modal
  modalSettings: document.getElementById("modal-settings"),
  btnCloseSettings: document.getElementById("btn-close-settings"),
  btnClearAllGames: document.getElementById("btn-clear-all-games")
};

// ========================================================
// Initialization
// ========================================================
function initHazmanApp() {
  loadGamesFromStorage();
  setupEventListeners();
  renderPlayerInputsInSetup(4); // default 4 players
  showView("list");
  renderGamesList();
}

// ========================================================
// Storage Handlers
// ========================================================
function saveGamesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_HAZMAN, JSON.stringify(hazmanState.games));
  } catch (e) {
    console.error("Failed to save games to localStorage", e);
  }
}

function loadGamesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HAZMAN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        hazmanState.games = parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load games from localStorage", e);
  }
}

// ========================================================
// View Navigation
// ========================================================
function showView(viewName) {
  DOM.viewGameList.classList.add("hidden");
  DOM.viewNewGame.classList.add("hidden");
  DOM.viewGameDetail.classList.add("hidden");

  if (viewName === "list") {
    DOM.viewGameList.classList.remove("hidden");
    renderGamesList();
  } else if (viewName === "new") {
    DOM.viewNewGame.classList.remove("hidden");
    resetNewGameForm();
  } else if (viewName === "detail") {
    DOM.viewGameDetail.classList.remove("hidden");
    renderActiveGameDetail();
  }
}

// ========================================================
// Event Listeners
// ========================================================
function setupEventListeners() {
  // Navigation to New Game
  DOM.btnFabNewGame.addEventListener("click", () => showView("new"));
  DOM.btnQuickAddGame.addEventListener("click", () => showView("new"));
  DOM.btnCancelNewGame.addEventListener("click", () => showView("list"));

  // Settings Modal
  DOM.btnOpenSettings.addEventListener("click", () => DOM.modalSettings.classList.remove("hidden"));
  DOM.btnCloseSettings.addEventListener("click", () => DOM.modalSettings.classList.add("hidden"));
  DOM.btnClearAllGames.addEventListener("click", handleClearAllGames);

  // Player count radio change in New Game
  const radioPlayers = document.querySelectorAll('input[name="total-players"]');
  radioPlayers.forEach(radio => {
    radio.addEventListener("change", (e) => {
      const count = parseInt(e.target.value, 10);
      renderPlayerInputsInSetup(count);
    });
  });

  // Setup form submission
  DOM.btnSaveCheckmark.addEventListener("click", handleCreateNewGame);
  DOM.formNewGame.addEventListener("submit", (e) => {
    e.preventDefault();
    handleCreateNewGame();
  });

  // Clearable input helper buttons
  document.addEventListener("click", (e) => {
    const clearBtn = e.target.closest(".btn-input-clear");
    if (clearBtn) {
      const targetId = clearBtn.getAttribute("data-target");
      if (targetId) {
        const inp = document.getElementById(targetId);
        if (inp) {
          inp.value = "";
          inp.focus();
        }
      }
    }
  });

  // Back from Game Detail to List
  DOM.btnBackToList.addEventListener("click", () => {
    hazmanState.activeGameId = null;
    showView("list");
  });

  // Delete Current Game
  DOM.btnDeleteGame.addEventListener("click", handleDeleteActiveGame);

  // Edit Game
  DOM.btnEditGame.addEventListener("click", openEditGameModal);
  DOM.btnCancelEditGame.addEventListener("click", () => DOM.modalEditGame.classList.add("hidden"));
  DOM.formEditGame.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSaveEditGame();
  });

  // Add Score Modal & Undo
  DOM.btnOpenAddScore.addEventListener("click", () => openAddScoreModal());
  if (DOM.btnUndoScore) {
    DOM.btnUndoScore.addEventListener("click", handleUndoLastScore);
  }
  DOM.btnCancelAddScore.addEventListener("click", () => DOM.modalAddScore.classList.add("hidden"));
  DOM.formAddScore.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSaveRoundScore();
  });
  DOM.btnAutoFillLast.addEventListener("click", handleAutoBalanceScore);

  // Delete Last Score
  DOM.btnDeleteLastScore.addEventListener("click", handleDeleteLastScore);

  // Winner Modal Close
  DOM.btnCloseHazmanWinner.addEventListener("click", () => DOM.modalHazmanWinner.classList.add("hidden"));
}

// ========================================================
// Dynamic Player Input Fields in New Game Setup
// ========================================================
function renderPlayerInputsInSetup(count) {
  let html = "";
  for (let i = 1; i <= count; i++) {
    const inputId = `input-player-${i}`;
    html += `
      <div style="margin-bottom: 12px;">
        <label for="${inputId}" class="form-label">Player name ${i}</label>
        <div class="input-clearable-row">
          <input type="text" id="${inputId}" class="input-clearable" placeholder="Tap to enter" value="player ${i}" required />
          <button type="button" class="btn-input-clear" data-target="${inputId}" title="Clear">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  }
  DOM.playerInputsContainer.innerHTML = html;
}

function resetNewGameForm() {
  const gameNumber = hazmanState.games.length + 1;
  DOM.inputGameName.value = `game ${gameNumber}`;
  DOM.inputFinalTarget.value = "1000";
  DOM.inputRoundScore.value = "360";

  const radio4 = document.querySelector('input[name="total-players"][value="4"]');
  if (radio4) radio4.checked = true;
  renderPlayerInputsInSetup(4);

  DOM.chkNotifyTarget.checked = true;
  DOM.chkNotifyScoreMismatch.checked = true;
}

// ========================================================
// Create New Game
// ========================================================
function handleCreateNewGame() {
  const name = DOM.inputGameName.value.trim() || "game name";
  const finalTarget = parseInt(DOM.inputFinalTarget.value, 10) || 1000;
  const roundScore = parseInt(DOM.inputRoundScore.value, 10) || 360;

  const selectedRadio = document.querySelector('input[name="total-players"]:checked');
  const playerCount = selectedRadio ? parseInt(selectedRadio.value, 10) : 4;

  const players = [];
  for (let i = 1; i <= playerCount; i++) {
    const inp = document.getElementById(`input-player-${i}`);
    const playerName = (inp && inp.value.trim()) ? inp.value.trim() : `player ${i}`;
    players.push(playerName);
  }

  const newGame = {
    id: "game_" + Date.now(),
    name: name,
    playerCount: playerCount,
    players: players,
    finalTarget: finalTarget,
    roundScore: roundScore,
    scoreNotification: DOM.chkNotifyScoreMismatch.checked,
    targetNotification: DOM.chkNotifyTarget.checked,
    rounds: [], // Array of arrays: e.g. [[120, 100, 80, 60], ...]
    createdAt: Date.now(),
    completedAt: null,
    finished: false,
    winnerAnnounced: false
  };

  // Enforce game history limit: retains max 5 completed games when a new game is started
  enforceGameHistoryLimit();

  hazmanState.games.unshift(newGame);
  hazmanState.activeGameId = newGame.id;
  saveGamesToStorage();

  showToast(`Started new game "${name}".`);
  showView("detail");
}

// ========================================================
// Render Game List
// ========================================================
function renderGamesList() {
  if (!hazmanState.games || hazmanState.games.length === 0) {
    DOM.emptyState.classList.remove("hidden");
    DOM.gamesCollection.classList.add("hidden");
    DOM.gamesCollection.innerHTML = "";
    return;
  }

  DOM.emptyState.classList.add("hidden");
  DOM.gamesCollection.classList.remove("hidden");

  let html = "";
  const completedCount = hazmanState.games.filter(g => isGameCompleted(g)).length;
  if (completedCount > 0) {
    html += `
      <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-dim); margin-bottom: 6px; padding: 0 4px; display:flex; justify-content:space-between;">
        <span>Saved Games (${hazmanState.games.length})</span>
        <span>Completed History: ${completedCount}/${MAX_COMPLETED_GAMES} max</span>
      </div>
    `;
  }

  hazmanState.games.forEach(game => {
    // Calculate leader
    const totals = calculatePlayerTotals(game);
    let leaderIndex = 0;
    let maxScore = -1;
    totals.forEach((sc, idx) => {
      if (sc > maxScore) {
        maxScore = sc;
        leaderIndex = idx;
      }
    });

    const leaderName = game.players[leaderIndex] || "player 1";
    const roundCount = game.rounds.length;
    const completed = isGameCompleted(game);

    html += `
      <div class="hazman-game-card" onclick="openGame('${game.id}')">
        <div class="game-card-info">
          <h3>${escapeHtml(game.name)}</h3>
          <div class="game-card-meta">
            <span class="${completed ? 'meta-status-completed' : 'meta-status-active'}">${completed ? 'Completed' : 'Active'}</span>
            <span class="meta-pill">${game.playerCount} players</span>
            <span>${roundCount} rounds</span>
            <span class="meta-leader">&#127942; ${escapeHtml(leaderName)}: ${maxScore} pts</span>
          </div>
        </div>
        <div style="color: var(--primary-emerald); font-weight:700;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </div>
    `;
  });

  DOM.gamesCollection.innerHTML = html;
}

window.openGame = function(gameId) {
  hazmanState.activeGameId = gameId;
  showView("detail");
};

// ========================================================
// Render Active Game Detail
// ========================================================
function getActiveGame() {
  return hazmanState.games.find(g => g.id === hazmanState.activeGameId) || null;
}

function renderActiveGameDetail() {
  const game = getActiveGame();
  if (!game) {
    showView("list");
    return;
  }

  // Header Title
  DOM.detailGameTitle.textContent = game.name;

  // Game Info Section (Matching Screenshot 2)
  DOM.infoFinalTarget.textContent = game.finalTarget;
  DOM.infoRoundScore.textContent = game.roundScore;
  DOM.infoScoreNotify.textContent = game.scoreNotification ? "On" : "Off";
  DOM.infoTargetNotify.textContent = game.targetNotification ? "On" : "Off";
  DOM.infoTotalPlayer.textContent = `${game.playerCount} players`;
  DOM.infoTotalRound.textContent = game.rounds.length;

  // Calculate Cumulative Player Totals
  const totals = calculatePlayerTotals(game);

  // Scoreboard Section (Ranked List)
  renderScoreboardList(game, totals);

  // Point Table Section (Round History)
  renderPointTable(game, totals);

  // Check if someone reached target
  checkFinalTargetReached(game, totals);
}

function calculatePlayerTotals(game) {
  const totals = new Array(game.playerCount).fill(0);
  game.rounds.forEach(round => {
    round.forEach((val, idx) => {
      if (idx < totals.length) {
        totals[idx] += val;
      }
    });
  });
  return totals;
}

function renderScoreboardList(game, totals) {
  // Build sortable list with original player indices
  const list = game.players.map((name, idx) => ({
    index: idx,
    name: name,
    score: totals[idx]
  }));

  // Sort descending by score
  list.sort((a, b) => b.score - a.score);

  // Determine ranks with ties
  let currentRank = 1;
  const rankedItems = list.map((item, i) => {
    if (i > 0 && item.score < list[i - 1].score) {
      currentRank = i + 1;
    }
    const suffix = getRankSuffix(currentRank);
    return {
      ...item,
      rankText: `${currentRank}${suffix}`,
      isLeader: (i === 0 && item.score > 0)
    };
  });

  let html = "";
  rankedItems.forEach(item => {
    html += `
      <div class="scoreboard-row ${item.isLeader ? 'leader-row' : ''}">
        <span class="player-rank">${item.rankText}</span>
        <span class="player-name-col">${escapeHtml(item.name)}</span>
        <span class="player-score-col">${item.score}</span>
      </div>
    `;
  });

  DOM.scoreboardList.innerHTML = html;
}

function renderPointTable(game, totals) {
  // Table Header
  let headHtml = `<tr><th class="col-index">#</th>`;
  game.players.forEach(p => {
    headHtml += `<th>${escapeHtml(p)}</th>`;
  });
  headHtml += `</tr>`;
  DOM.pointTableHead.innerHTML = headHtml;

  // Table Body
  let bodyHtml = "";

  // Cumulative Totals Row (# 0 0 0 0)
  bodyHtml += `<tr class="total-row"><td class="col-index">#</td>`;
  totals.forEach(tot => {
    bodyHtml += `<td><strong>${tot}</strong></td>`;
  });
  bodyHtml += `</tr>`;

  // Each Round Row
  game.rounds.forEach((round, rIdx) => {
    bodyHtml += `<tr class="round-row"><td class="col-index">${rIdx + 1}</td>`;
    round.forEach(val => {
      bodyHtml += `<td>${val}</td>`;
    });
    bodyHtml += `</tr>`;
  });

  DOM.pointTableBody.innerHTML = bodyHtml;
}

function getRankSuffix(rank) {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
}

// ========================================================
// Add Score Modal & 360 Points Validator
// ========================================================
function openAddScoreModal(prefillScores = null) {
  const game = getActiveGame();
  if (!game) return;

  const nextRoundNum = game.rounds.length + 1;
  DOM.modalRoundTitle.textContent = prefillScores 
    ? `Correct Round ${nextRoundNum} Score` 
    : `Add Round ${nextRoundNum} Score`;

  let html = "";
  for (let i = 0; i < game.playerCount; i++) {
    const prefillVal = (prefillScores && prefillScores[i] !== undefined) ? prefillScores[i] : "";
    html += `
      <div class="player-score-input-item">
        <label for="round-pts-${i}">${escapeHtml(game.players[i])}</label>
        <input type="number" id="round-pts-${i}" class="input-points-val hazman-score-input" min="0" max="${game.roundScore}" placeholder="0" value="${prefillVal}" />
      </div>
    `;
  }
  DOM.addScoreInputs.innerHTML = html;

  // Attach live balance listener
  const inputs = DOM.addScoreInputs.querySelectorAll(".hazman-score-input");
  inputs.forEach(inp => {
    inp.addEventListener("input", updateBalanceValidator);
  });

  updateBalanceValidator();
  DOM.modalAddScore.classList.remove("hidden");

  // Focus first input
  setTimeout(() => {
    if (inputs[0]) inputs[0].focus();
  }, 100);
}

function updateBalanceValidator() {
  const game = getActiveGame();
  if (!game) return;

  const targetScore = game.roundScore || 360;
  const inputs = DOM.addScoreInputs.querySelectorAll(".hazman-score-input");
  let sum = 0;

  inputs.forEach(inp => {
    const val = parseInt(inp.value, 10);
    if (!isNaN(val) && val >= 0) {
      sum += val;
    }
  });

  const diff = targetScore - sum;
  DOM.balanceStatusText.textContent = `Sum: ${sum} / ${targetScore}`;

  if (diff === 0) {
    DOM.balancePill.className = "balance-validator-pill balanced";
    DOM.balanceDiffText.textContent = "✓ Balanced (360)";
  } else if (diff > 0) {
    DOM.balancePill.className = "balance-validator-pill mismatch";
    DOM.balanceDiffText.textContent = `Remaining: ${diff}`;
  } else {
    DOM.balancePill.className = "balance-validator-pill mismatch";
    DOM.balanceDiffText.textContent = `Over by: ${Math.abs(diff)}`;
  }

  return { sum, diff, targetScore };
}

function handleAutoBalanceScore() {
  const game = getActiveGame();
  if (!game) return;

  const targetScore = game.roundScore || 360;
  const inputs = Array.from(DOM.addScoreInputs.querySelectorAll(".hazman-score-input"));
  if (inputs.length === 0) return;

  // Sum all inputs except the last one
  let subtotal = 0;
  for (let i = 0; i < inputs.length - 1; i++) {
    const val = parseInt(inputs[i].value, 10);
    if (!isNaN(val) && val >= 0) {
      subtotal += val;
    }
  }

  const remainder = targetScore - subtotal;
  if (remainder >= 0) {
    inputs[inputs.length - 1].value = remainder;
  } else {
    inputs[inputs.length - 1].value = 0;
  }

  updateBalanceValidator();
}

function handleSaveRoundScore() {
  const game = getActiveGame();
  if (!game) return;

  const targetScore = game.roundScore || 360;
  const inputs = DOM.addScoreInputs.querySelectorAll(".hazman-score-input");
  const roundPoints = [];
  let sum = 0;

  for (let i = 0; i < inputs.length; i++) {
    const val = parseInt(inputs[i].value, 10);
    if (isNaN(val) || val < 0) {
      alert(`Please enter a valid score (0 or greater) for ${game.players[i]}.`);
      inputs[i].focus();
      return;
    }
    roundPoints.push(val);
    sum += val;
  }

  // Ensure total score stays at 360 (per user prompt)
  if (sum !== targetScore) {
    const diffMsg = sum < targetScore ? `under by ${targetScore - sum}` : `over by ${sum - targetScore}`;
    if (game.scoreNotification) {
      alert(`Round score mismatch!\nTotal entered is ${sum}, but HazMan round score must stay at ${targetScore} (${diffMsg}).\n\nPlease adjust the scores to equal exactly ${targetScore}.`);
      return;
    } else {
      if (!confirm(`Warning: Total round score is ${sum} (standard is ${targetScore}). Do you still want to save?`)) {
        return;
      }
    }
  }

  // Save the round
  game.rounds.push(roundPoints);
  saveGamesToStorage();

  DOM.modalAddScore.classList.add("hidden");
  renderActiveGameDetail();
}

// ========================================================
// Undo Last Score Entry for Immediate Correction
// ========================================================
function handleUndoLastScore() {
  const game = getActiveGame();
  if (!game || game.rounds.length === 0) {
    alert("No score entries to undo.");
    return;
  }

  const roundNum = game.rounds.length;
  const undoneScores = game.rounds.pop();

  // Reset completion flags if undone
  game.winnerAnnounced = false;
  game.finished = false;

  saveGamesToStorage();
  renderActiveGameDetail();

  showToast(`Undid Round ${roundNum} score. Correct entries below.`);
  // Re-open modal prefilled with undone scores for immediate correction
  openAddScoreModal(undoneScores);
}

// ========================================================
// Delete Last Score
// ========================================================
function handleDeleteLastScore() {
  const game = getActiveGame();
  if (!game || game.rounds.length === 0) {
    alert("No rounds to delete.");
    return;
  }

  const lastRoundIdx = game.rounds.length;
  if (confirm(`Delete the score for Round ${lastRoundIdx}?`)) {
    game.rounds.pop();
    saveGamesToStorage();
    renderActiveGameDetail();
  }
}

// ========================================================
// Delete Active Game
// ========================================================
function handleDeleteActiveGame() {
  const game = getActiveGame();
  if (!game) return;

  if (confirm(`Are you sure you want to delete "${game.name}"? This cannot be undone.`)) {
    hazmanState.games = hazmanState.games.filter(g => g.id !== game.id);
    hazmanState.activeGameId = null;
    saveGamesToStorage();
    showView("list");
  }
}

// ========================================================
// Edit Game Modal
// ========================================================
function openEditGameModal() {
  const game = getActiveGame();
  if (!game) return;

  DOM.editGameName.value = game.name;
  DOM.editFinalTarget.value = game.finalTarget;
  DOM.editChkTargetNotify.checked = game.targetNotification;
  DOM.editChkScoreNotify.checked = game.scoreNotification;

  let html = "";
  for (let i = 0; i < game.playerCount; i++) {
    html += `
      <div style="margin-bottom: 8px;">
        <label class="form-label">Player ${i + 1}</label>
        <input type="text" id="edit-player-${i}" class="input-clearable" value="${escapeHtml(game.players[i])}" required />
      </div>
    `;
  }
  DOM.editPlayersContainer.innerHTML = html;

  DOM.modalEditGame.classList.remove("hidden");
}

function handleSaveEditGame() {
  const game = getActiveGame();
  if (!game) return;

  const newName = DOM.editGameName.value.trim() || game.name;
  const newTarget = parseInt(DOM.editFinalTarget.value, 10) || game.finalTarget;

  const newPlayers = [];
  for (let i = 0; i < game.playerCount; i++) {
    const inp = document.getElementById(`edit-player-${i}`);
    newPlayers.push((inp && inp.value.trim()) ? inp.value.trim() : game.players[i]);
  }

  game.name = newName;
  game.finalTarget = newTarget;
  game.players = newPlayers;
  game.targetNotification = DOM.editChkTargetNotify.checked;
  game.scoreNotification = DOM.editChkScoreNotify.checked;

  saveGamesToStorage();
  DOM.modalEditGame.classList.add("hidden");
  renderActiveGameDetail();
}

// ========================================================
// Target Reached & Celebration
// ========================================================
function checkFinalTargetReached(game, totals) {
  if (!game.targetNotification || game.winnerAnnounced) return;

  const winners = [];
  totals.forEach((score, idx) => {
    if (score >= game.finalTarget) {
      winners.push({ name: game.players[idx], score });
    }
  });

  if (winners.length > 0) {
    game.winnerAnnounced = true;
    game.finished = true;
    game.completedAt = Date.now();
    enforceGameHistoryLimit();
    saveGamesToStorage();

    // Trigger celebration confetti
    if (typeof confetti === "function") {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#16a34a', '#86efac', '#facc15', '#ffffff']
      });
    }

    let winnerHtml = "";
    winners.forEach(w => {
      winnerHtml += `<p>&#127942; <strong>${escapeHtml(w.name)}</strong> reached <strong>${w.score}</strong> points! (Target: ${game.finalTarget})</p>`;
    });

    DOM.hazmanWinnerBox.innerHTML = winnerHtml;
    DOM.modalHazmanWinner.classList.remove("hidden");
  }
}

// ========================================================
// Clear All Games
// ========================================================
function handleClearAllGames() {
  if (confirm("Are you sure you want to delete ALL saved HazMan games?")) {
    hazmanState.games = [];
    hazmanState.activeGameId = null;
    saveGamesToStorage();
    DOM.modalSettings.classList.add("hidden");
    showView("list");
  }
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Start app
document.addEventListener("DOMContentLoaded", initHazmanApp);
