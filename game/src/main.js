// Boot, screen machine and the frame loop. The world is pure state
// (world.js); this file owns the canvas, the input queue, the Warden's
// thinking pause, and the ?shot= staging hook used for screenshots.
//
//   http://localhost:8080/?shot=start   title screen
//   http://localhost:8080/?shot=play    mid-duel table
//   http://localhost:8080/?shot=win     victory screen
//   http://localhost:8080/?shot=lose    defeat screen
//   &seed=N pins the shuffle (default 1).
//
// A read-only handle, window.__lantern, exposes the state for automated
// playtests: state only, no cheats — the game itself never reads it.

import { CARD_BY_ID } from './config.js';
import { runFoeTurn } from './ai.js';
import { sfx, toggleMute } from './audio.js';
import { createInput, handCardAt, inside, END_TURN_RECT, TITLE_PLAY_RECT } from './input.js';
import { drawScene, handCardRects } from './render.js';
import { applyShot } from './shots.js';
import { canPlay, createGame, endTurn, playCard, startDuel } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shot = params.get('shot') || '';

const state = createGame(seed);
const input = createInput(canvas);
const ui = { mouse: input.mouse, selected: -1, hover: -1, muted: false };

if (shot) {
  applyShot(state, shot);
  state.screen = shot === 'start' ? 'title' : state.screen;
} else {
  state.screen = 'title';
}

// The Warden answers after a short pause, so its plays read as a turn
// instead of an instant. foeTimer counts down in ms while it is thinking.
let foeTimer = -1;

function startPlaying() {
  startDuel(state);
  ui.selected = -1;
  foeTimer = -1;
  sfx.turn();
}

function endPlayerTurn() {
  if (state.screen !== 'play' || state.turn !== 'player' || state.over) return;
  if (!endTurn(state)) return;
  ui.selected = -1;
  sfx.turn();
  foeTimer = 650;
}

function playSelected() {
  if (ui.selected < 0) return;
  const res = playCard(state, 'player', ui.selected);
  if (!res.ok) {
    sfx.deny();
    return;
  }
  const card = res.card;
  if (card.effects.some((fx) => fx.kind === 'damage')) sfx.hit();
  else if (card.effects.some((fx) => fx.kind === 'heal')) sfx.heal();
  else if (card.effects.some((fx) => fx.kind === 'draw')) sfx.draw();
  else if (card.effects.some((fx) => fx.kind === 'ward')) sfx.ward();
  else sfx.play();
  ui.selected = -1;
  if (state.over) {
    if (state.over === 'won') sfx.win();
    else sfx.lose();
  }
}

function handleClick(p) {
  if (state.screen === 'title') {
    if (inside(p, TITLE_PLAY_RECT)) {
      sfx.click();
      startPlaying();
    }
    return;
  }
  if (state.screen === 'won' || state.screen === 'lost') return;
  if (state.turn !== 'player' || state.over) return;
  if (inside(p, END_TURN_RECT)) {
    endPlayerTurn();
    return;
  }
  const idx = handCardAt(state, p);
  if (idx >= 0) {
    if (idx === ui.selected) {
      playSelected();
    } else {
      ui.selected = idx;
      sfx.select();
    }
  } else {
    ui.selected = -1;
  }
}

function handleKey(key) {
  if (key === 'm') {
    ui.muted = toggleMute();
    return;
  }
  if (key === 'Escape') {
    if (state.screen === 'won' || state.screen === 'lost' || state.screen === 'play') {
      state.screen = 'title';
      ui.selected = -1;
      foeTimer = -1;
    }
    return;
  }
  if ((key === 'r' || key === 'R') && (state.screen === 'won' || state.screen === 'lost')) {
    startPlaying();
    return;
  }
  if (state.screen === 'title' && (key === 'Enter' || key === ' ')) {
    startPlaying();
    return;
  }
  if (state.screen !== 'play' || state.turn !== 'player' || state.over) return;
  if (key >= '1' && key <= '7') {
    const idx = Number(key) - 1;
    if (idx < state.player.hand.length) {
      ui.selected = idx;
      sfx.select();
    }
    return;
  }
  if (key === 'Enter' || key === ' ') {
    playSelected();
    return;
  }
  if (key === 'e') endPlayerTurn();
}

function frame(now) {
  // Drain latched input first: one click / key per frame, in order.
  while (input.clicks.length > 0) handleClick(input.clicks.shift());
  while (input.keys.length > 0) handleKey(input.keys.shift());

  // Hover tracking for the player's hand.
  ui.hover = state.screen === 'play' && state.turn === 'player'
    ? handCardAt(state, input.mouse)
    : -1;

  // The Warden's turn: wait out the thinking pause, then play, then hand
  // the table back. endTurn() starts the player's next round.
  if (foeTimer > 0) {
    foeTimer -= 16;
    if (foeTimer <= 0) {
      foeTimer = -1;
      if (state.screen === 'play' && state.turn === 'foe' && !state.over) {
        const played = runFoeTurn(state);
        if (played > 0) sfx.play();
        if (!state.over) {
          endTurn(state);
          sfx.turn();
        } else if (state.over === 'lost') sfx.lose();
      }
    }
  }

  // Keep the canvas crisp: fixed 1280x720 backing store, CSS scales it.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawScene(ctx, state, ui);
  requestAnimationFrame(frame);
}

window.__lantern = {
  version: 'lantern-pact-1.0.0',
  get state() { return state; },
  get screen() { return state.screen; },
  startDuel() { startPlaying(); },
  playCard(i) { return playCard(state, 'player', i); },
  endTurn() { endPlayerTurn(); },
};

requestAnimationFrame(frame);
