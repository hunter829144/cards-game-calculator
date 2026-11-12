/**
 * CallBreak Calculator - Game Engine & Score Tracker
 * Implements standard CallBreak rules, 5 rounds, mid-score at round 4, final score, ranks,
 * Web Audio API celebration sound effects & fanfare, and multi-stage confetti animations.
 */

// ========================================================
// Sound Engine (Web Audio API Synthesizer - 100% Offline)
// ========================================================
const SoundEngine = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem("callbreak_sound_enabled", this.enabled ? "1" : "0");
    } catch (e) {}
    this.updateUI();
    if (this.enabled) {
      this.playTone(587.33, 0.12, 'sine', 0.15); // gentle confirmation beep
    }
  },

  loadPreference() {
    try {
      const pref = localStorage.getItem("callbreak_sound_enabled");
      if (pref !== null) {
        this.enabled = pref === "1";
      }
    } catch (e) {}
    this.updateUI();
  },

  updateUI() {
    const iconOn = document.getElementById("icon-sound-on");
    const iconOff = document.getElementById("icon-sound-off");
    const label = document.getElementById("sound-label");
    const btn = document.getElementById("btn-sound-toggle");
    if (iconOn && iconOff && label && btn) {
      if (this.enabled) {
        iconOn.classList.remove("hidden");
        iconOff.classList.add("hidden");
        label.textContent = "Sound";
        btn.title = "Sound Effects: ON (Click to mute)";
      } else {
        iconOn.classList.add("hidden");
        iconOff.classList.remove("hidden");
        label.textContent = "Muted";
        btn.title = "Sound Effects: MUTED (Click to enable)";
      }
    }
  },

  playTone(freq, duration = 0.15, type = 'sine', volume = 0.2) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn("Audio playback error", e);
    }
  },

  playNoteAt(freq, startTime, duration, type = 'triangle', volume = 0.2) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {}
  },

  playLock() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playNoteAt(523.25, now, 0.12, 'triangle', 0.18); // C5
    this.playNoteAt(659.25, now + 0.08, 0.2, 'triangle', 0.22); // E5
  },

  playRoundComplete() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playNoteAt(440.00, now, 0.10, 'sine', 0.15); // A4
    this.playNoteAt(554.37, now + 0.09, 0.12, 'sine', 0.18); // C#5
    this.playNoteAt(659.25, now + 0.18, 0.28, 'sine', 0.22); // E5
  },

  playVictoryFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Victorious Champion Fanfare
      // Notes: C5 -> C5 -> C5 -> E5 -> D5 -> E5 -> G5 -> Full Major Chord
      const notes = [
        { f: 523.25, t: 0.00, d: 0.16, v: 0.28, type: 'triangle' }, // C5
        { f: 523.25, t: 0.18, d: 0.16, v: 0.28, type: 'triangle' }, // C5
        { f: 523.25, t: 0.36, d: 0.16, v: 0.28, type: 'triangle' }, // C5
        { f: 659.25, t: 0.54, d: 0.50, v: 0.35, type: 'triangle' }, // E5
        { f: 587.33, t: 1.10, d: 0.18, v: 0.30, type: 'triangle' }, // D5
        { f: 659.25, t: 1.32, d: 0.20, v: 0.32, type: 'triangle' }, // E5
        { f: 783.99, t: 1.56, d: 0.70, v: 0.38, type: 'triangle' }, // G5

        // Grand Finale Chord (C Major: C5, E5, G5, C6)
        { f: 523.25, t: 2.35, d: 1.5, v: 0.28, type: 'triangle' },
        { f: 659.25, t: 2.35, d: 1.5, v: 0.30, type: 'triangle' },
        { f: 783.99, t: 2.35, d: 1.5, v: 0.32, type: 'triangle' },
        { f: 1046.50, t: 2.35, d: 1.8, v: 0.35, type: 'triangle' },
        { f: 1318.51, t: 2.40, d: 1.5, v: 0.20, type: 'sine' }
      ];

      notes.forEach(note => {
        this.playNoteAt(note.f, now + note.t, note.d, note.type, note.v);
      });

      // Shimmering star arpeggios
      const chimes = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02, 3135.96];
      chimes.forEach((freq, idx) => {
        this.playNoteAt(freq, now + 2.5 + (idx * 0.1), 0.35, 'sine', 0.15);
      });
    } catch (e) {
      console.warn("Fanfare error", e);
    }
  }
};

// Initial State
const DEFAULT_PLAYERS = ["Player1", "Player2", "Player3", "Player4"];
const TOTAL_ROUNDS = 5;
const STORAGE_KEY = "callbreak_calculator_state_v1";

let gameState = {
  players: [...DEFAULT_PLAYERS],
  currentRound: 1, // 1 through 5
  isFixed: false,
  rounds: Array.from({ length: TOTAL_ROUNDS }, (_, i) => ({
    roundNum: i + 1,
    bids: [null, null, null, null],
    achieved: [null, null, null, null],
    scores: [0, 0, 0, 0],
    completed: false
  })),
  midScores: [0, 0, 0, 0],
  finalScores: [0, 0, 0, 0],
  ranks: ["--", "--", "--", "--"],
  gameFinished: false
};

// Pending submission callback for confirmation modal
let pendingSubmitCallback = null;

// DOM Elements Cache
const DOM = {
  // Modals
  modalNames: document.getElementById("modal-names"),
  modalWinner: document.getElementById("modal-winner"),
  modalConfirm: document.getElementById("modal-confirm"),
  formPlayerNames: document.getElementById("form-player-names"),
  btnNamesSubmit: document.getElementById("btn-names-submit"),
  
  // Header Buttons
  btnSoundToggle: document.getElementById("btn-sound-toggle"),
  btnEditPlayers: document.getElementById("btn-edit-players"),
  btnNewGame: document.getElementById("btn-new-game"),

  // Status Bar
  currentRoundPill: document.getElementById("current-round-pill"),
  roundInstruction: document.getElementById("round-instruction"),

  // Player Labels
  expLabels: [
    document.getElementById("label-exp-p1"),
    document.getElementById("label-exp-p2"),
    document.getElementById("label-exp-p3"),
    document.getElementById("label-exp-p4")
  ],
  achLabels: [
    document.getElementById("label-ach-p1"),
    document.getElementById("label-ach-p2"),
    document.getElementById("label-ach-p3"),
    document.getElementById("label-ach-p4")
  ],
  thPlayers: [
    document.getElementById("th-p1"),
    document.getElementById("th-p2"),
    document.getElementById("th-p3"),
    document.getElementById("th-p4")
  ],

  // Inputs
  expInputs: [
    document.getElementById("exp-p1"),
    document.getElementById("exp-p2"),
    document.getElementById("exp-p3"),
    document.getElementById("exp-p4")
  ],
  achInputs: [
    document.getElementById("ach-p1"),
    document.getElementById("ach-p2"),
    document.getElementById("ach-p3"),
    document.getElementById("ach-p4")
  ],

  // Action Buttons
  btnFix: document.getElementById("btn-fix"),
  btnSubmit: document.getElementById("btn-submit"),

  // Rows in Score Table
  roundRows: [
    document.getElementById("row-round-1"),
    document.getElementById("row-round-2"),
    document.getElementById("row-round-3"),
    document.getElementById("row-round-4"),
    document.getElementById("row-round-5")
  ],
  midScoreRow: document.getElementById("row-mid-score"),
  finalScoreRow: document.getElementById("row-final-score"),
  rankRow: document.getElementById("row-rank"),

  // Edit Round Elements
  modalEditRound: document.getElementById("modal-edit-round"),
  editRoundTitle: document.getElementById("edit-round-title"),
  editRoundGrid: document.getElementById("edit-round-grid"),
  btnEditCancel: document.getElementById("btn-edit-cancel"),
  btnEditSave: document.getElementById("btn-edit-save"),
  formEditRound: document.getElementById("form-edit-round"),

  // Winner Elements
  winnerAnnouncement: document.getElementById("winner-announcement"),
  winnerLeaderboard: document.getElementById("winner-leaderboard"),
  btnCloseWinner: document.getElementById("btn-close-winner"),
  btnPlayAgain: document.getElementById("btn-play-again"),
  btnReplaySound: document.getElementById("btn-replay-sound"),

  // Confirm Elements
  confirmTitle: document.getElementById("confirm-title"),
  confirmMsg: document.getElementById("confirm-msg"),
  btnConfirmOk: document.getElementById("btn-confirm-ok"),
  btnConfirmCancel: document.getElementById("btn-confirm-cancel")
};

// ========================================================
// Initialization
// ========================================================
function initApp() {
  loadFromStorage();
  SoundEngine.loadPreference();
  setupEventListeners();
  renderAll();

  // If players not configured yet or default visit, open modal
  const hasSavedGame = localStorage.getItem(STORAGE_KEY);
  if (!hasSavedGame) {
    openNamesModal();
  }
}

// ========================================================
// Storage Handlers
// ========================================================
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  } catch (e) {
    console.error("Failed to save state to localStorage", e);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.players) && Array.isArray(parsed.rounds)) {
        gameState = parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load state from localStorage", e);
  }
}

// ========================================================
// Event Listeners
// ========================================================
function setupEventListeners() {
  // Sound Toggle Button
  if (DOM.btnSoundToggle) {
    DOM.btnSoundToggle.addEventListener("click", () => {
      SoundEngine.toggle();
    });
  }

  // Modal Names Submission
  DOM.btnNamesSubmit.addEventListener("click", handleNamesSubmit);
  DOM.formPlayerNames.addEventListener("submit", (e) => {
    e.preventDefault();
    handleNamesSubmit();
  });

  // Edit Players button in header
  DOM.btnEditPlayers.addEventListener("click", () => {
    openNamesModal();
  });

  // New Game / Reset
  DOM.btnNewGame.addEventListener("click", () => {
    showConfirm(
      "Reset Game?",
      "Are you sure you want to start a new game? All current scores will be cleared.",
      () => {
        resetGame(false);
      }
    );
  });

  // Fix button (locks expected points)
  DOM.btnFix.addEventListener("click", handleFixToggle);

  // Submit button (submits achieved points for round)
  DOM.btnSubmit.addEventListener("click", handleSubmitRound);

  // Winner Modal Buttons
  DOM.btnCloseWinner.addEventListener("click", () => {
    DOM.modalWinner.classList.add("hidden");
  });
  DOM.btnPlayAgain.addEventListener("click", () => {
    DOM.modalWinner.classList.add("hidden");
    resetGame(true); // keep same players
  });
  if (DOM.btnReplaySound) {
    DOM.btnReplaySound.addEventListener("click", () => {
      SoundEngine.playVictoryFanfare();
    });
  }

  // Edit Round Modal Listeners
  DOM.roundRows.forEach((row, rIdx) => {
    row.addEventListener("click", () => {
      if (gameState.rounds[rIdx].completed) {
        openEditRoundModal(rIdx);
      }
    });
  });

  DOM.btnEditCancel.addEventListener("click", () => {
    DOM.modalEditRound.classList.add("hidden");
    editingRoundIndex = -1;
  });

  DOM.btnEditSave.addEventListener("click", handleEditRoundSave);
  DOM.formEditRound.addEventListener("submit", (e) => {
    e.preventDefault();
    handleEditRoundSave();
  });

  // Confirm Modal Buttons
  DOM.btnConfirmOk.addEventListener("click", () => {
    DOM.modalConfirm.classList.add("hidden");
    if (pendingSubmitCallback) {
      const cb = pendingSubmitCallback;
      pendingSubmitCallback = null;
      cb();
    }
  });

  DOM.btnConfirmCancel.addEventListener("click", () => {
    DOM.modalConfirm.classList.add("hidden");
    pendingSubmitCallback = null;
  });

  // Input auto-tabbing and validation
  setupInputHelpers();
}

function setupInputHelpers() {
  // When Enter is pressed in expected points, if all filled, trigger Fix
  DOM.expInputs.forEach((input, idx) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (idx < 3) {
          DOM.expInputs[idx + 1].focus();
        } else {
          handleFixToggle();
        }
      }
    });
  });

  // When Enter is pressed in achieved points, submit
  DOM.achInputs.forEach((input, idx) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (idx < 3) {
          DOM.achInputs[idx + 1].focus();
        } else {
          handleSubmitRound();
        }
      }
    });
  });
}

// ========================================================
// Player Names Modal
// ========================================================
function openNamesModal() {
  document.getElementById("name-input-1").value = gameState.players[0] || "Player1";
  document.getElementById("name-input-2").value = gameState.players[1] || "Player2";
  document.getElementById("name-input-3").value = gameState.players[2] || "Player3";
  document.getElementById("name-input-4").value = gameState.players[3] || "Player4";
  DOM.modalNames.classList.remove("hidden");
  document.getElementById("name-input-1").focus();
}

function handleNamesSubmit() {
  const p1 = document.getElementById("name-input-1").value.trim() || "Player1";
  const p2 = document.getElementById("name-input-2").value.trim() || "Player2";
  const p3 = document.getElementById("name-input-3").value.trim() || "Player3";
  const p4 = document.getElementById("name-input-4").value.trim() || "Player4";

  gameState.players = [p1, p2, p3, p4];
  DOM.modalNames.classList.add("hidden");
  saveToStorage();
  renderPlayerLabels();
  renderTable();
}

// ========================================================
// Fix / Lock Expected Points (Bids)
// ========================================================
function handleFixToggle() {
  if (gameState.gameFinished) return;

  if (gameState.isFixed) {
    // Unlock to allow editing bids
    gameState.isFixed = false;
    renderInputControls();
    saveToStorage();
    return;
  }

  // Validate that all 4 expected points are entered
  const bids = [];
  for (let i = 0; i < 4; i++) {
    const val = parseInt(DOM.expInputs[i].value, 10);
    if (isNaN(val) || val < 1 || val > 13) {
      alert(`Please enter a valid bid (between 1 and 13) for ${gameState.players[i]}.`);
      DOM.expInputs[i].focus();
      return;
    }
    bids.push(val);
  }

  // Save bids in current round
  const rIdx = gameState.currentRound - 1;
  gameState.rounds[rIdx].bids = bids;
  gameState.isFixed = true;

  SoundEngine.playLock();
  saveToStorage();
  renderInputControls();

  // Focus the first achieved input
  setTimeout(() => {
    DOM.achInputs[0].focus();
  }, 50);
}

// ========================================================
// Submit Round Points & Calculate
// ========================================================
function handleSubmitRound() {
  if (gameState.gameFinished) return;
  if (!gameState.isFixed) {
    alert("Please enter expected points and click 'Fixed' before submitting achieved points.");
    return;
  }

  const achieved = [];
  let totalTricks = 0;

  for (let i = 0; i < 4; i++) {
    const val = parseInt(DOM.achInputs[i].value, 10);
    if (isNaN(val) || val < 0 || val > 13) {
      alert(`Please enter valid achieved points (0 to 13) for ${gameState.players[i]}.`);
      DOM.achInputs[i].focus();
      return;
    }
    achieved.push(val);
    totalTricks += val;
  }

  // CallBreak validation: Total tricks in standard 4-player deck is 13
  if (totalTricks !== 13) {
    showConfirm(
      "Trick Count Check",
      `The total tricks entered across all 4 players is ${totalTricks} (standard is 13). Do you want to submit anyway?`,
      () => {
        executeRoundSubmission(achieved);
      }
    );
    return;
  }

  executeRoundSubmission(achieved);
}

function executeRoundSubmission(achieved) {
  const rIdx = gameState.currentRound - 1;
  const round = gameState.rounds[rIdx];
  round.achieved = achieved;

  // Calculate scores for each player
  // Standard CallBreak Rule:
  // If Achieved >= Bid: Score = Bid + (Achieved - Bid) * 0.1
  // If Achieved < Bid:  Score = -Bid
  round.scores = [];
  for (let i = 0; i < 4; i++) {
    const bid = round.bids[i];
    const ach = round.achieved[i];
    let score = 0;
    if (ach >= bid) {
      score = bid + (ach - bid) * 0.1;
    } else {
      score = -bid;
    }
    // Round to 1 decimal place
    score = Math.round(score * 10) / 10;
    round.scores.push(score);
  }

  round.completed = true;

  // Check if Round 4 is completed -> Calculate Mid-score!
  if (gameState.currentRound >= 4) {
    calculateMidScore();
  }

  // Advance Round or Finish Game
  if (gameState.currentRound < TOTAL_ROUNDS) {
    gameState.currentRound += 1;
    gameState.isFixed = false;
    SoundEngine.playRoundComplete();
  } else {
    // Round 5 completed! Game Finished!
    gameState.gameFinished = true;
    calculateFinalScore();
    calculateRanks();
    triggerCelebration();
  }

  saveToStorage();
  renderAll();
}

// ========================================================
// Score Calculations
// ========================================================
function calculateMidScore() {
  // Sum rounds 1 to 4
  const mid = [0, 0, 0, 0];
  for (let r = 0; r < 4; r++) {
    if (gameState.rounds[r].completed) {
      for (let p = 0; p < 4; p++) {
        mid[p] += gameState.rounds[r].scores[p];
      }
    }
  }
  gameState.midScores = mid.map(s => Math.round(s * 10) / 10);
}

function calculateFinalScore() {
  // Sum all 5 rounds
  const final = [0, 0, 0, 0];
  for (let r = 0; r < TOTAL_ROUNDS; r++) {
    if (gameState.rounds[r].completed) {
      for (let p = 0; p < 4; p++) {
        final[p] += gameState.rounds[r].scores[p];
      }
    }
  }
  gameState.finalScores = final.map(s => Math.round(s * 10) / 10);
}

function calculateRanks() {
  // Create sortable array of players with their final scores
  const playerScores = gameState.players.map((name, index) => ({
    index,
    name,
    score: gameState.finalScores[index]
  }));

  // Sort descending by score
  playerScores.sort((a, b) => b.score - a.score);

  // Assign ranks handling ties
  const ranks = ["--", "--", "--", "--"];
  let currentRank = 1;

  for (let i = 0; i < playerScores.length; i++) {
    if (i > 0 && playerScores[i].score < playerScores[i - 1].score) {
      currentRank = i + 1;
    }
    const suffix = getRankSuffix(currentRank);
    ranks[playerScores[i].index] = `${currentRank}${suffix}`;
  }

  gameState.ranks = ranks;
}

function getRankSuffix(rank) {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
}

// ========================================================
// Rendering Functions
// ========================================================
function renderAll() {
  renderPlayerLabels();
  renderInputControls();
  renderTable();
  renderStatus();
}

function renderPlayerLabels() {
  for (let i = 0; i < 4; i++) {
    const name = gameState.players[i] || `Player${i + 1}`;
    DOM.expLabels[i].textContent = name;
    DOM.achLabels[i].textContent = name;
    DOM.thPlayers[i].textContent = name;
  }
}

function renderInputControls() {
  const rIdx = gameState.currentRound - 1;
  const currentRoundData = gameState.rounds[rIdx];

  if (gameState.gameFinished) {
    // Disable everything when game is over
    DOM.expInputs.forEach(inp => {
      inp.value = "";
      inp.disabled = true;
    });
    DOM.achInputs.forEach(inp => {
      inp.value = "";
      inp.disabled = true;
    });
    DOM.btnFix.disabled = true;
    DOM.btnSubmit.disabled = true;
    DOM.btnFix.textContent = "Finished";
    DOM.btnFix.classList.remove("locked");
    return;
  }

  DOM.btnFix.disabled = false;

  if (gameState.isFixed) {
    // Expected inputs are locked
    DOM.expInputs.forEach((inp, idx) => {
      inp.value = currentRoundData.bids[idx] !== null ? currentRoundData.bids[idx] : "";
      inp.disabled = true;
    });

    // Achieved inputs are active
    DOM.achInputs.forEach((inp, idx) => {
      inp.disabled = false;
      inp.value = currentRoundData.achieved[idx] !== null ? currentRoundData.achieved[idx] : "";
    });

    DOM.btnFix.textContent = "Edit Bids";
    DOM.btnFix.classList.add("locked");
    DOM.btnSubmit.disabled = false;
  } else {
    // Expected inputs are editable
    DOM.expInputs.forEach((inp, idx) => {
      inp.disabled = false;
      inp.value = currentRoundData.bids[idx] !== null ? currentRoundData.bids[idx] : "";
    });

    // Achieved inputs are locked
    DOM.achInputs.forEach((inp) => {
      inp.disabled = true;
      inp.value = "";
    });

    DOM.btnFix.textContent = "Fixed";
    DOM.btnFix.classList.remove("locked");
    DOM.btnSubmit.disabled = true;
  }
}

function renderStatus() {
  if (gameState.gameFinished) {
    DOM.currentRoundPill.textContent = "Tournament Complete";
    DOM.currentRoundPill.style.backgroundColor = "#2e7d32";
    DOM.roundInstruction.textContent = "All 5 rounds finished! View final scores and ranks below.";
  } else {
    DOM.currentRoundPill.textContent = `Round ${gameState.currentRound} of 5`;
    DOM.currentRoundPill.style.backgroundColor = "";

    if (!gameState.isFixed) {
      DOM.roundInstruction.textContent = "Enter expected points (bids) and click Fixed";
    } else {
      DOM.roundInstruction.textContent = "Enter achieved points (tricks won) and click Submit";
    }
  }
}

function renderTable() {
  // 1. Render Round 1 to 5 rows
  for (let r = 0; r < TOTAL_ROUNDS; r++) {
    const roundData = gameState.rounds[r];
    const rowEl = DOM.roundRows[r];

    if (rowEl) {
      if (roundData.completed) {
        rowEl.classList.add("clickable");
        rowEl.setAttribute("title", `Click to edit Round ${r + 1} scores`);
      } else {
        rowEl.classList.remove("clickable");
        rowEl.removeAttribute("title");
      }
    }

    for (let p = 0; p < 4; p++) {
      const cell = document.getElementById(`score-r${r + 1}-p${p + 1}`);
      if (cell) {
        if (roundData.completed) {
          const score = roundData.scores[p];
          cell.textContent = formatScore(score);
          cell.setAttribute(
            "data-breakdown",
            `Bid: ${roundData.bids[p]} | Won: ${roundData.achieved[p]} -> ${formatScore(score)}`
          );
        } else {
          cell.textContent = "0";
          cell.removeAttribute("data-breakdown");
        }
      }
    }
  }

  // 2. Render Mid-score (Calculated after Round 4)
  // Per requirement: "and mid scorce shows after round = 4"
  const isRound4Completed = gameState.rounds[3].completed;
  if (isRound4Completed) {
    DOM.midScoreRow.classList.add("calculated");
    for (let p = 0; p < 4; p++) {
      const cell = document.getElementById(`score-mid-p${p + 1}`);
      if (cell) {
        cell.textContent = formatScore(gameState.midScores[p]);
      }
    }
  } else {
    DOM.midScoreRow.classList.remove("calculated");
    for (let p = 0; p < 4; p++) {
      const cell = document.getElementById(`score-mid-p${p + 1}`);
      if (cell) {
        cell.textContent = "0";
      }
    }
  }

  // 3. Render Final-score (Calculated after Round 5)
  const isRound5Completed = gameState.rounds[4].completed;
  if (isRound5Completed) {
    DOM.finalScoreRow.classList.add("calculated");
    for (let p = 0; p < 4; p++) {
      const cell = document.getElementById(`score-final-p${p + 1}`);
      if (cell) {
        cell.textContent = formatScore(gameState.finalScores[p]);
      }
    }
  } else {
    DOM.finalScoreRow.classList.remove("calculated");
    for (let p = 0; p < 4; p++) {
      const cell = document.getElementById(`score-final-p${p + 1}`);
      if (cell) {
        cell.textContent = "0";
      }
    }
  }

  // 4. Render Ranks
  for (let p = 0; p < 4; p++) {
    const rankCell = document.getElementById(`rank-p${p + 1}`);
    if (rankCell) {
      const rankText = gameState.ranks[p] || "--";
      rankCell.textContent = rankText;
      rankCell.className = "rank-cell";

      if (rankText.startsWith("1")) {
        rankCell.classList.add("rank-badge-1");
      } else if (rankText.startsWith("2")) {
        rankCell.classList.add("rank-badge-2");
      } else if (rankText.startsWith("3")) {
        rankCell.classList.add("rank-badge-3");
      }
    }
  }
}

function formatScore(val) {
  if (val === null || val === undefined || isNaN(val)) return "0";
  // Display clean decimal (e.g. 3.2, -4, 0)
  return Number(val.toFixed(1)).toString();
}

// ========================================================
// Winner Announcement & Celebration
// ========================================================
function triggerCelebration() {
  // Play Victorious Champion Fanfare!
  SoundEngine.playVictoryFanfare();

  // Multi-Stage High-Energy Celebration Confetti
  if (typeof confetti === "function") {
    try {
      // Stage 1: Explosive Center Blast
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#00b0ff', '#facc15', '#ef4444', '#22c55e', '#ffffff']
      });

      // Stage 2: Dual Cross-Cannons (Left & Right)
      setTimeout(() => {
        confetti({
          particleCount: 75,
          angle: 60,
          spread: 65,
          origin: { x: 0, y: 0.75 },
          colors: ['#facc15', '#00b0ff', '#ec4899', '#ffffff']
        });
        confetti({
          particleCount: 75,
          angle: 120,
          spread: 65,
          origin: { x: 1, y: 0.75 },
          colors: ['#facc15', '#22c55e', '#f97316', '#ffffff']
        });
      }, 350);

      // Stage 3: Golden Star & Shimmer Rain (3 Seconds)
      const endCelebration = Date.now() + 2800;
      const celebrationInterval = setInterval(() => {
        if (Date.now() > endCelebration) {
          clearInterval(celebrationInterval);
          return;
        }
        confetti({
          particleCount: 30,
          startVelocity: 30,
          spread: 360,
          ticks: 70,
          origin: {
            x: Math.random() * 0.8 + 0.1,
            y: Math.random() * 0.4
          },
          colors: ['#facc15', '#fde047', '#00b0ff', '#ffffff']
        });
      }, 400);

    } catch (e) {
      console.warn("Confetti error", e);
    }
  }

  // Build Leaderboard
  const sorted = gameState.players.map((name, idx) => ({
    name,
    score: gameState.finalScores[idx],
    rank: gameState.ranks[idx]
  })).sort((a, b) => b.score - a.score);

  const winner = sorted[0];
  DOM.winnerAnnouncement.innerHTML = `&#129351; <strong>${winner.name}</strong> Wins with <strong>${winner.score}</strong> points!`;

  let leaderboardHtml = "";
  sorted.forEach((item, index) => {
    const isFirst = index === 0;
    const medal = index === 0 ? "&#129351;" : index === 1 ? "&#129352;" : index === 2 ? "&#129353;" : "&#10148;";
    leaderboardHtml += `
      <div class="leaderboard-item ${isFirst ? 'first-place' : ''}">
        <span>${medal} ${item.rank} - <strong>${item.name}</strong></span>
        <span>${item.score} pts</span>
      </div>
    `;
  });

  DOM.winnerLeaderboard.innerHTML = leaderboardHtml;

  // Show modal after slight pause
  setTimeout(() => {
    DOM.modalWinner.classList.remove("hidden");
  }, 400);
}

// ========================================================
// Edit Round Modal Logic
// ========================================================
let editingRoundIndex = -1;

function openEditRoundModal(rIdx) {
  editingRoundIndex = rIdx;
  const round = gameState.rounds[rIdx];
  DOM.editRoundTitle.textContent = `Edit Round ${rIdx + 1}`;

  let html = `
    <div class="edit-grid-header">Player</div>
    <div class="edit-grid-header">Bid</div>
    <div class="edit-grid-header">Won</div>
  `;

  for (let i = 0; i < 4; i++) {
    html += `
      <div class="edit-player-label" title="${gameState.players[i]}">${gameState.players[i]}</div>
      <input type="number" id="edit-bid-${i}" class="edit-input" min="1" max="13" value="${round.bids[i] !== null ? round.bids[i] : 1}" />
      <input type="number" id="edit-ach-${i}" class="edit-input" min="0" max="13" value="${round.achieved[i] !== null ? round.achieved[i] : 0}" />
    `;
  }

  DOM.editRoundGrid.innerHTML = html;
  DOM.modalEditRound.classList.remove("hidden");
}

function handleEditRoundSave() {
  if (editingRoundIndex < 0) return;
  const round = gameState.rounds[editingRoundIndex];
  const newBids = [];
  const newAch = [];
  let totalTricks = 0;

  for (let i = 0; i < 4; i++) {
    const b = parseInt(document.getElementById(`edit-bid-${i}`).value, 10);
    const a = parseInt(document.getElementById(`edit-ach-${i}`).value, 10);
    if (isNaN(b) || b < 1 || b > 13) {
      alert(`Please enter a valid bid (1-13) for ${gameState.players[i]}`);
      return;
    }
    if (isNaN(a) || a < 0 || a > 13) {
      alert(`Please enter valid tricks won (0-13) for ${gameState.players[i]}`);
      return;
    }
    newBids.push(b);
    newAch.push(a);
    totalTricks += a;
  }

  // Check tricks count warning
  if (totalTricks !== 13) {
    if (!confirm(`Warning: Total tricks won across all 4 players is ${totalTricks} (standard is 13). Save anyway?`)) {
      return;
    }
  }

  round.bids = newBids;
  round.achieved = newAch;
  round.scores = [];
  for (let i = 0; i < 4; i++) {
    const b = newBids[i];
    const a = newAch[i];
    let score = a >= b ? (b + (a - b) * 0.1) : -b;
    score = Math.round(score * 10) / 10;
    round.scores.push(score);
  }

  if (gameState.currentRound >= 4 || gameState.rounds[3].completed) {
    calculateMidScore();
  }
  if (gameState.gameFinished || gameState.rounds[4].completed) {
    calculateFinalScore();
    calculateRanks();
  }

  DOM.modalEditRound.classList.add("hidden");
  editingRoundIndex = -1;
  saveToStorage();
  renderAll();
}

// ========================================================
// Reset Game
// ========================================================
function resetGame(keepPlayers = false) {
  const currentPlayers = keepPlayers ? [...gameState.players] : [...DEFAULT_PLAYERS];

  gameState = {
    players: currentPlayers,
    currentRound: 1,
    isFixed: false,
    rounds: Array.from({ length: TOTAL_ROUNDS }, (_, i) => ({
      roundNum: i + 1,
      bids: [null, null, null, null],
      achieved: [null, null, null, null],
      scores: [0, 0, 0, 0],
      completed: false
    })),
    midScores: [0, 0, 0, 0],
    finalScores: [0, 0, 0, 0],
    ranks: ["--", "--", "--", "--"],
    gameFinished: false
  };

  saveToStorage();
  renderAll();

  if (!keepPlayers) {
    openNamesModal();
  }
}

// ========================================================
// Confirmation Modal Helper
// ========================================================
function showConfirm(title, message, onOk) {
  DOM.confirmTitle.textContent = title;
  DOM.confirmMsg.textContent = message;
  pendingSubmitCallback = onOk;
  DOM.modalConfirm.classList.remove("hidden");
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);
