// The duel itself: pure state, no DOM, no canvas. main.js drives it and
// render.js draws it; the Node logic test imports this file directly and
// plays whole games through it.
//
// Turn flow: at the start of your turn your ember cap grows by 1 (to 10),
// your embers refill, and you draw 1 card. Play any number of cards you can
// afford, then end your turn; the Warden then takes its turn the same way.
// Ward absorbs damage before light does. The game ends the moment a side's
// light reaches 0 (or below).

import {
  CARD_BY_ID, FOE_NAME, HAND_CAP, MAX_EMBER, MAX_LIGHT, OPENING_HAND,
  PLAYER_NAME, START_EMBER_MAX, START_LIGHT,
} from './config.js';
import { buildDeck, drawCards, label } from './deck.js';
import { clamp, mulberry32 } from './random.js';

export function createGame(seed = 1) {
  const rng = mulberry32(seed);
  const state = {
    seed,
    rng,
    screen: 'title',
    round: 1,
    turn: 'player',
    turnCount: 0,
    over: null, // null | 'won' | 'lost'
    log: [],
    lastPlay: { player: null, foe: null },
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, rounds: 0 },
    player: newSide(rng),
    foe: newSide(rng),
  };
  state.player.name = PLAYER_NAME;
  state.foe.name = FOE_NAME;
  return state;
}

function newSide(rng) {
  return {
    name: '',
    light: START_LIGHT,
    maxLight: MAX_LIGHT,
    ward: 0,
    ember: 0,
    maxEmber: START_EMBER_MAX,
    deck: buildDeck(rng),
    hand: [],
    discard: [],
  };
}

export function startDuel(state) {
  state.screen = 'play';
  state.round = 1;
  state.turn = 'player';
  state.turnCount = 0;
  state.over = null;
  state.log = ['The lanterns are lit. Your move, Keeper.'];
  state.lastPlay = { player: null, foe: null };
  state.stats = { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, rounds: 0 };
  drawCards(state, 'player', OPENING_HAND, null);
  drawCards(state, 'foe', OPENING_HAND, null);
  beginTurn(state, 'player');
}

export function beginTurn(state, side) {
  const s = state[side];
  // Ember cap grows with the round, the same for both keepers: round 1
  // means 1 ember, round 2 means 2, up to 10. Embers refill every turn.
  s.maxEmber = clamp(state.round, 1, MAX_EMBER);
  s.ember = s.maxEmber;
  drawCards(state, side, 1, state.log);
  trimLog(state);
}

export function otherSide(side) {
  return side === 'player' ? 'foe' : 'player';
}

// The cards a side can afford right now, as hand indices.
export function affordableHand(state, side) {
  const s = state[side];
  const out = [];
  s.hand.forEach((id, i) => {
    if (CARD_BY_ID[id].cost <= s.ember) out.push(i);
  });
  return out;
}

export function canPlay(state, side, handIndex) {
  if (state.over || state.screen !== 'play' || state.turn !== side) return { ok: false, why: 'not your turn' };
  const s = state[side];
  const id = s.hand[handIndex];
  if (!id) return { ok: false, why: 'no such card' };
  if (CARD_BY_ID[id].cost > s.ember) return { ok: false, why: 'not enough embers' };
  return { ok: true, card: CARD_BY_ID[id] };
}

// Play the card at handIndex for side. Returns { ok, card } or { ok:false, why }.
export function playCard(state, side, handIndex) {
  const check = canPlay(state, side, handIndex);
  if (!check.ok) return check;
  const s = state[side];
  const foe = state[otherSide(side)];
  const card = check.card;
  s.hand.splice(handIndex, 1);
  s.discard.push(card.id);
  s.ember -= card.cost;
  state.lastPlay[side] = card;
  if (side === 'player') state.stats.cardsPlayed += 1;
  for (const fx of card.effects) applyEffect(state, side, s, foe, fx);
  state.log.push(`${label(state, side)} plays ${card.name}.`);
  trimLog(state);
  checkEnd(state);
  return { ok: true, card };
}

function applyEffect(state, side, s, foe, fx) {
  if (fx.kind === 'damage') {
    const dealt = dealDamage(state, foe, fx.n);
    if (side === 'player') state.stats.damageDealt += dealt;
    else state.stats.damageTaken += dealt;
  } else if (fx.kind === 'ward') {
    s.ward += fx.n;
  } else if (fx.kind === 'heal') {
    s.light = clamp(s.light + fx.n, 0, s.maxLight);
  } else if (fx.kind === 'draw') {
    drawCards(state, side, fx.n, state.log);
    if (s.hand.length > HAND_CAP) {
      const burned = s.hand.splice(HAND_CAP);
      s.discard.push(...burned);
      state.log.push(`${label(state, side)} burns ${burned.length} overdrawn card(s).`);
    }
  } else if (fx.kind === 'ember') {
    s.ember = clamp(s.ember + fx.n, 0, MAX_EMBER);
  } else if (fx.kind === 'self') {
    dealDamage(state, s, fx.n);
  }
}

// Damage hits ward first, then light. Returns the light damage actually dealt.
export function dealDamage(state, target, n) {
  let rest = n;
  if (target.ward > 0) {
    const absorbed = Math.min(target.ward, rest);
    target.ward -= absorbed;
    rest -= absorbed;
  }
  const before = target.light;
  target.light = Math.max(0, target.light - rest);
  return before - target.light;
}

export function checkEnd(state) {
  if (state.over) return state.over;
  if (state.foe.light <= 0) {
    state.over = 'won';
    state.screen = 'won';
    state.log.push('The Warden\u2019s lantern goes dark. You win!');
  } else if (state.player.light <= 0) {
    state.over = 'lost';
    state.screen = 'lost';
    state.log.push('Your lantern gutters out. The Warden wins.');
  }
  return state.over;
}

// End the current side's turn. When the player ends, the Warden's whole
// turn is decided here (runFoeTurn) so the caller only has to wait briefly
// and then show it; the world itself stays synchronous and deterministic.
export function endTurn(state) {
  if (state.over || state.screen !== 'play') return false;
  const side = state.turn;
  state.turn = otherSide(side);
  if (state.turn === 'player') {
    state.round += 1;
    state.stats.rounds = state.round;
  }
  beginTurn(state, state.turn);
  checkEnd(state);
  return true;
}

export function score(state) {
  const s = state.stats;
  const winBonus = state.over === 'won' ? 100 : 0;
  return winBonus + s.damageDealt * 2 + s.cardsPlayed * 3 + Math.max(0, state.player.light) * 2 - Math.max(0, state.round - 1) * 2;
}

function trimLog(state) {
  while (state.log.length > 4) state.log.shift();
}
