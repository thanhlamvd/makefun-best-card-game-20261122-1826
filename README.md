# makefun-best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/thanhlamvd/makefun-best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/thanhlamvd/makefun-best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

LANTERN PACT — Duel of the Hollow Moon: a complete, original turn-based card duel that plays offline in a desktop browser. Two lantern-keepers trade cards across a moonlit table; reduce the Warden's light from 30 to 0 before yours goes out.

## Run it

```sh
node serve.ts
# open http://localhost:8080 — click a card to select it, Enter plays it, E ends your turn
```

## How it plays

- **Embers** — each round your ember cap grows by 1 (to 10) and your embers refill. Every card costs embers.
- **Four Aspects** — Ember burns (damage), Tide mends (heal + draw), Thorn wards (shield), Moon gambles (draw at a cost, big swings). 12 original cards, 30-card decks.
- **Ward** — absorbs damage before light does. **Fatigue** — an empty deck costs 2 light per draw, so no game stalls.
- **The Warden** — an AI opponent that hunts lethal, heals and wards when its lantern runs low, and spends its embers greedily.
- **Win / lose** — first lantern to 0 ends the duel. Score is damage dealt, cards played, light kept, and rounds taken.

## Layout

- `game/index.html` — canvas + status line; loads `game/src/main.js`.
- `game/src/config.js` — tuning, the 12-card catalogue, palette.
- `game/src/random.js` — seeded RNG and shuffle helpers.
- `game/src/deck.js` — deck building, drawing, reshuffle, fatigue.
- `game/src/world.js` — the duel: pure state, turns, card effects, win/lose.
- `game/src/ai.js` — the Warden's greedy turn planner.
- `game/src/render.js` — all drawing: table, hands, cards, HUD, screens.
- `game/src/input.js` — keyboard + pointer, mapped to logical coordinates.
- `game/src/audio.js` — synthesized WebAudio effects, no audio files.
- `game/src/shots.js` — deterministic screenshot staging (`?shot=`).
- `game/src/main.js` — boot, screen machine, frame loop.
- `main.ts` — hands the game in: copies `game/` + `screenshots/` to `/output`, writes `dossier.json` via `vendor/makefun-game.ts`.
- `serve.ts` — tiny static server for local play on port 8080.
- `shots.json` — the four screenshot stages.
- `LICENSE` — MIT.

---

<sub>Entered on [make.fun](https://make.fun/?ref=2zg6fps3&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
