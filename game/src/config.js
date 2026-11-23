// LANTERN PACT — Duel of the Hollow Moon. Tuning, card catalogue and palette.
// A turn-based duel card game: two lantern-keepers trade cards across a
// moonlit table. First keeper whose lantern light reaches 0 loses.
// Original cards, names and art: nothing here copies a commercial game.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const START_LIGHT = 30;
export const MAX_LIGHT = 30;
export const OPENING_HAND = 4;
export const HAND_CAP = 7;
export const START_EMBER_MAX = 1;
export const MAX_EMBER = 10;
export const FATIGUE_DAMAGE = 2;

// Four Aspects. Each card belongs to one; the aspect sets its colour and
// the sigil drawn on its face. Costs are paid in embers.
export const ASPECTS = {
  ember: { label: 'Ember', color: '#ff7a2f', dark: '#a34a12', glow: '#ffb37a' },
  tide: { label: 'Tide', color: '#38b6ff', dark: '#14669e', glow: '#9adcff' },
  thorn: { label: 'Thorn', color: '#58c96b', dark: '#2c7a38', glow: '#a9e8b2' },
  moon: { label: 'Moon', color: '#b388ff', dark: '#6a3fb5', glow: '#d9c2ff' },
};

// The catalogue: 12 original cards. effect is one of:
//   damage n | ward n | heal n | draw n | ember n | self n (self damage)
// A card may carry up to two effects; the text line is written out in full
// so the card is readable at a glance.
export const CARDS = [
  { id: 'cinder', name: 'Cinder Slash', aspect: 'ember', cost: 1, power: 3, text: 'Deal 3 damage.', effects: [{ kind: 'damage', n: 3 }] },
  { id: 'wildfire', name: 'Wildfire', aspect: 'ember', cost: 3, power: 6, text: 'Deal 6 damage.', effects: [{ kind: 'damage', n: 6 }] },
  { id: 'nova', name: 'Ember Nova', aspect: 'ember', cost: 5, power: 10, text: 'Deal 10 damage.', effects: [{ kind: 'damage', n: 10 }] },
  { id: 'mend', name: 'Tide Mend', aspect: 'tide', cost: 2, power: 6, text: 'Restore 6 light.', effects: [{ kind: 'heal', n: 6 }] },
  { id: 'stillwater', name: 'Stillwater', aspect: 'tide', cost: 1, power: 2, text: 'Draw 2 cards.', effects: [{ kind: 'draw', n: 2 }] },
  { id: 'thornwall', name: 'Thornwall', aspect: 'thorn', cost: 2, power: 6, text: 'Gain 6 ward.', effects: [{ kind: 'ward', n: 6 }] },
  { id: 'snare', name: 'Bramble Snare', aspect: 'thorn', cost: 2, power: 2, text: 'Deal 2 damage. Gain 4 ward.', effects: [{ kind: 'damage', n: 2 }, { kind: 'ward', n: 4 }] },
  { id: 'gambit', name: 'Moonlit Gambit', aspect: 'moon', cost: 0, power: 1, text: 'Draw 1 card. Take 2 damage.', effects: [{ kind: 'draw', n: 1 }, { kind: 'self', n: 2 }] },
  { id: 'eclipse', name: 'Eclipse', aspect: 'moon', cost: 4, power: 5, text: 'Deal 5 damage. Gain 5 ward.', effects: [{ kind: 'damage', n: 5 }, { kind: 'ward', n: 5 }] },
  { id: 'kindling', name: 'Kindling', aspect: 'ember', cost: 0, power: 2, text: 'Gain 2 embers this turn.', effects: [{ kind: 'ember', n: 2 }] },
  { id: 'frostbite', name: 'Frostbite', aspect: 'tide', cost: 2, power: 4, text: 'Deal 4 damage. Restore 2 light.', effects: [{ kind: 'damage', n: 4 }, { kind: 'heal', n: 2 }] },
  { id: 'bell', name: 'Hollow Bell', aspect: 'moon', cost: 3, power: 2, text: 'Deal 2 damage. Draw 2 cards.', effects: [{ kind: 'damage', n: 2 }, { kind: 'draw', n: 2 }] },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// A 30-card deck: two of every catalogue card, plus a third copy of the
// cheap workhorses so opening hands usually have something to play.
export const DECK_LIST = [
  ...CARDS.map((c) => c.id),
  ...CARDS.map((c) => c.id),
  'cinder', 'cinder', 'wildfire', 'thornwall', 'mend', 'stillwater',
];

export const FOE_NAME = 'WARDEN OF THE HOLLOW MOON';
export const PLAYER_NAME = 'YOU — KEEPER OF THE LAST LANTERN';

// AI tuning: how the Warden values a play. Damage is worth its face value,
// ward about two-thirds of that while healthy, healing more the lower its
// light, card draw about 1.5 per card, embers about 1 per ember.
export const AI = {
  healUrgencyLight: 12,
  wardUrgencyLight: 14,
  drawWhenHandBelow: 4,
  wardValue: 0.65,
  healValue: 1.0,
  drawValue: 1.5,
  emberValue: 1.0,
};

export const PALETTE = {
  table: '#12291f',
  tableEdge: '#0a1a13',
  felt: '#1d4a35',
  feltLine: '#2c6b4d',
  panel: '#0e1f18',
  panelLine: '#2c6b4d',
  ink: '#f2ead8',
  dim: '#b9c4ae',
  gold: '#f5c542',
  red: '#ff5a4e',
  cardBack: '#241a3a',
  cardFace: '#f7f1de',
  cardInk: '#241d18',
};
