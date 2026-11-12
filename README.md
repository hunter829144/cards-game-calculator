# Card Games Suite — CallBreak Calculator & HazMan Game Tracker

A clean, modern, light-themed **Card Games Hub & PWA workspace** combining the **CallBreak Score Calculator** and the **HazMan / Hazari Game Tracker** into a single unified directory.

---

## 🌟 Architecture & Apps Included

```text
pr 1 cards/
│
├── index.html       # Clean, light-themed Startup Landing Screen (Launcher)
├── launcher.css     # Modern responsive styling for the app launcher
│
├── callbreak.html   # CallBreak Calculator (exact, pristine CallBreak code)
├── style.css        # CallBreak styles (blue palette, modal, table)
├── app.js           # CallBreak 5-round engine, mid-score & fanfare
│
├── hazman.html      # HazMan Game Tracker (3-5 players, 360-pt rounds, target 1000)
├── hazman.css       # Unique ivory-mint light gradient stylesheet
├── hazman.js        # HazMan state, 360-pt validation, scoreboard & table
│
├── manifest.json    # Combined PWA configuration for mobile installation
├── sw.js            # Offline service worker caching all suite components
├── icon.svg         # App Suite icon
└── README.md        # Complete documentation
```

---

## 🚀 1. Startup Landing Screen (Launcher)

Opening `index.html` greets the player with a clean, light-themed card launcher:
- **CallBreak Calculator Card**:
  - Direct 1-click launch into `callbreak.html`.
  - Highlights: 4-Player call locking, automatic mid-score after Round 4, final scores & fanfare celebration.
- **HazMan Game Tracker Card**:
  - Direct 1-click launch into `hazman.html`.
  - Highlights: 3, 4, or 5 players, strict 360 points-per-round balance, 1000 pts target alert, dynamic scoreboard, and point table history.
- **Bottom Copyright**:
  - Clean footer: `Copyright at hunter eight two nine one zero four`.

---

## ♠ 2. CallBreak Calculator (`callbreak.html`)

Kept **100% intact and untouched**:
- **Player Names Modal**: Prompts for 4 player names on startup.
- **Fixed Bids Locking**: Green "Fixed" button locks bids and enables achieved points.
- **CallBreak Scoring Rule**:
  - Made Call: $\text{Score} = \text{Bid} + (\text{Won} - \text{Bid}) \times 0.1$
  - Broken Call: $\text{Score} = -\text{Bid}$
- **Mid-Score after Round 4**: Automatically computed and highlighted.
- **Final-Score & Ranks after Round 5**: 1st through 4th place with medals (🥇 🥈 🥉).
- **Celebration & Sound**: Multi-stage confetti cannon and Web Audio API victory fanfare with mute toggle.

---

## 🂠 3. HazMan Game Tracker (`hazman.html`)

Designed with a **unique light color gradient** (fresh ivory-mint: `linear-gradient(145deg, #f4fbf7, #eaf6ef, #fefdf6)`) with high-contrast emerald green typography and soft card surfaces.

### Screens Implemented:
1. **Screen 1: Game List**:
   - Header with settings gear (⚙️) and quick add (+).
   - Shows "Empty game list" when no matches are saved, or card previews with leader score and round count.
   - Floating Action Button: `+ New game`.
2. **Screen 2: New Game Setup**:
   - Radio buttons for **3 players**, **4 players**, or **5 players**.
   - Dynamically generates input fields for each player name with clearable trash buttons.
   - Configurable **Game name**, **Final target** (default `1000`), and **Round score** (default `360`).
   - Notification toggles:
     - `Get notified when - final target reached by anyone`
     - `Get notified when - round score mis-match`
   - Save checkmark (`✔`) and bottom `Save` button.
3. **Screen 3: Game Detail & Live Tracker**:
   - **Game info** grid: Target, Round score (`360`), notifications status, player count, and total rounds played.
   - **Scoreboard**: Dynamic ranked leaderboard sorted by cumulative points (`1st`, `2nd`, `3rd`...) with tie-handling and leader highlight.
   - **Point table**: Full round-by-round point history with cumulative `#` total row.
   - **`↺ Undo` Button for Immediate Score Correction**:
     - Undoes the most recent round entry immediately, removes it from the scoreboard, and re-opens the score modal prefilled with those scores so any typos can be corrected in seconds!
   - **`+ Add score` Dialog with 360-Point Enforcement**:
     - Live balance indicator: Shows `Sum / 360` and `Remaining / Over`.
     - Turns green when balanced (`✓ Balanced (360)`) and warns when mismatched.
     - **Auto-balance remaining**: 1-click helper fills the last player's points so the sum equals exactly 360.
     - Strict validation ensures round scores total 360 points before recording.
   - **Automatic Game History Retention Limit**:
     - Retains a maximum of the last **5 completed games**.
     - Automatically removes the oldest completed record whenever a new game is started or when games finish.
   - **`Delete score`**: Quickly deletes/reverts the last round if a scorekeeper makes an error.
   - **Target Reached Celebration**: Announces the tournament winner with confetti when any player reaches the final target (1000 pts).

---

## 💻 How to Run

1. **In Any Web Browser**:
   - Double-click [index.html](file:///c:/Users/amitm/OneDrive/Documents/antigravity/pr%201%20cards/index.html) to open the Launcher.
   - Click **"Launch CallBreak"** to open CallBreak.
   - Click **"Launch HazMan"** to open HazMan.
2. **Offline & Mobile (PWA)**:
   - Deploy the folder to GitHub Pages, Netlify, or Vercel.
   - Open on mobile (Android Chrome or iOS Safari) and tap **"Add to Home Screen"** to install as a standalone native-like mobile app.

---

### Notice & Social
> **&copy; @hunter829104** &bull; [Follow on Instagram](https://www.instagram.com/hunter829104/)
