// Deterministic screenshot staging. ?shot=start|play|win|lose builds a
// fixed table from a fixed seed, so the four screenshots are reproducible
// renders of the game's own code — never composited, never hand-drawn.
//
//   start — the title screen.
//   play  — mid-duel, round 5: both lanterns hurt, hands full, each side has
//           played a card, embers half spent.
//   win   — the duel just won: the Warden's lantern at 0, victory screen.
//   lose  — the duel just lost: your lantern at 0, defeat screen.

import { CARD_BY_ID } from './config.js';
import { playCard, startDuel } from './world.js';

function setHand(state, side, ids) {
  const s = state[side];
  s.deck = s.deck.filter((id) => !ids.includes(id));
  s.hand = [...ids];
}

function forcePlay(state, side, id) {
  const s = state[side];
  const idx = s.hand.indexOf(id);
  if (idx < 0) return false;
  s.ember = Math.max(s.ember, CARD_BY_ID[id].cost);
  const res = playCard(state, side, idx);
  return res.ok;
}

function midDuel(state) {
  startDuel(state);
  state.round = 5;
  state.player.maxEmber = 5;
  state.player.ember = 3;
  state.foe.maxEmber = 5;
  state.foe.ember = 2;
  state.player.light = 21;
  state.foe.light = 17;
  state.player.ward = 4;
  state.foe.ward = 0;
  setHand(state, 'player', ['wildfire', 'mend', 'thornwall', 'cinder', 'stillwater']);
  setHand(state, 'foe', ['cinder', 'wildfire', 'mend', 'snare']);
  state.player.deck = state.player.deck.slice(0, 18);
  state.foe.deck = state.foe.deck.slice(0, 16);
  state.turn = 'foe';
  forcePlay(state, 'foe', 'snare');
  state.turn = 'player';
  forcePlay(state, 'player', 'cinder');
  state.turn = 'player';
  state.log = [
    'The Warden plays Bramble Snare.',
    'You play Cinder Slash.',
    'Round 5 — the moon is high and both lanterns burn low.',
  ];
  state.stats.damageDealt = 14;
  state.stats.cardsPlayed = 6;
}

export function applyShot(state, shot) {
  if (shot === 'start') {
    state.screen = 'title';
    return true;
  }
  if (shot === 'play') {
    midDuel(state);
    return true;
  }
  if (shot === 'win') {
    midDuel(state);
    state.foe.light = 3;
    state.foe.ward = 0;
    setHand(state, 'player', ['wildfire', 'mend', 'thornwall']);
    state.player.ember = 5;
    forcePlay(state, 'player', 'wildfire');
    return true;
  }
  if (shot === 'lose') {
    midDuel(state);
    state.player.light = 2;
    state.player.ward = 0;
    state.turn = 'foe';
    state.foe.ember = 5;
    setHand(state, 'foe', ['wildfire', 'cinder']);
    forcePlay(state, 'foe', 'wildfire');
    return true;
  }
  return false;
}
