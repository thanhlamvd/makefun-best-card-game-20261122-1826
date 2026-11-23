// Deck building and drawing. A deck is a plain array of card ids; a side
// owns a deck, a hand and a discard pile. Drawing from an empty deck
// reshuffles the discard back in; drawing with nothing left at all costs
// fatigue damage, so a game can never stall forever.

import { DECK_LIST, FATIGUE_DAMAGE } from './config.js';
import { shuffleInPlace } from './random.js';

export function buildDeck(rng) {
  return shuffleInPlace(rng, [...DECK_LIST]);
}

// Draw n cards for a side. Returns how many were actually drawn.
// Fatigue: each card that cannot be drawn costs the side FATIGUE_DAMAGE
// light, applied directly (ward does not stop it).
export function drawCards(state, side, n, log) {
  const s = state[side];
  let drawn = 0;
  for (let i = 0; i < n; i += 1) {
    if (s.deck.length === 0) {
      if (s.discard.length === 0) {
        s.light -= FATIGUE_DAMAGE;
        if (log) log.push(`${label(state, side)} takes ${FATIGUE_DAMAGE} fatigue — the deck is empty.`);
        continue;
      }
      s.deck = shuffleInPlace(state.rng, s.discard);
      s.discard = [];
      if (log) log.push(`${label(state, side)} reshuffles the discard into a new deck.`);
    }
    s.hand.push(s.deck.pop());
    drawn += 1;
  }
  return drawn;
}

export function label(state, side) {
  return side === 'player' ? 'You' : 'The Warden';
}
