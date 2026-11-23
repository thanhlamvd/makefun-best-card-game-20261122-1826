// The Warden's brain: a greedy heuristic over its hand, run once per turn.
// It looks for a killing blow first, then heals or wards when its lantern
// is low, draws when its hand is thin, and otherwise plays the best
// damage-per-ember it can afford. Deterministic from the game's seed:
// ties break by hand order, never by wall-clock randomness.

import { AI, CARD_BY_ID } from './config.js';
import { playCard } from './world.js';

function cardValue(state, card) {
  const foe = state.foe;
  let v = 0;
  for (const fx of card.effects) {
    if (fx.kind === 'damage') v += fx.n;
    else if (fx.kind === 'ward') v += fx.n * AI.wardValue;
    else if (fx.kind === 'heal') v += fx.n * AI.healValue * (foe.light <= AI.healUrgencyLight ? 1.6 : 0.7);
    else if (fx.kind === 'draw') v += fx.n * AI.drawValue;
    else if (fx.kind === 'ember') v += fx.n * AI.emberValue;
    else if (fx.kind === 'self') v -= fx.n;
  }
  // A card that can end the game right now is worth everything.
  const target = state.player;
  const lethal = card.effects.some((fx) => fx.kind === 'damage')
    && totalDamage(card) >= target.light + target.ward;
  if (lethal) v += 1000;
  return v;
}

function totalDamage(card) {
  return card.effects.filter((fx) => fx.kind === 'damage').reduce((a, fx) => a + fx.n, 0);
}

// Decide the Warden's whole turn: a list of hand indices in play order.
// Indices are resolved one at a time against the live hand (each play
// removes a card), so the caller re-derives the index by card id.
export function planFoeTurn(state) {
  const plan = [];
  // Simulate on a light copy of the hand so indices stay honest.
  const hand = [...state.foe.hand];
  let ember = state.foe.ember;
  for (;;) {
    let best = -1;
    let bestScore = -Infinity;
    hand.forEach((id, i) => {
      const card = CARD_BY_ID[id];
      if (card.cost > ember) return;
      const score = cardValue(state, card) / Math.max(1, card.cost);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best < 0 || bestScore <= 0.15) break;
    const id = hand[best];
    plan.push(id);
    ember -= CARD_BY_ID[id].cost;
    hand.splice(best, 1);
    // Kindling feeds the rest of the turn: apply its embers to the plan.
    if (id === 'kindling') ember += 2;
    if (plan.length >= 7) break;
  }
  return plan;
}

// Play the planned turn against the real state, one card at a time.
export function runFoeTurn(state) {
  const plan = planFoeTurn(state);
  for (const id of plan) {
    if (state.over) break;
    const idx = state.foe.hand.indexOf(id);
    if (idx < 0) continue;
    playCard(state, 'foe', idx);
  }
  return plan.length;
}
