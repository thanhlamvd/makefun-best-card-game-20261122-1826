// All drawing: the moonlit table, both hands, the cards, the HUD and the
// title / win / loss screens. Canvas 2D only, no images, no fonts fetched:
// every glyph is a vector path or a system font. Layout is fixed to the
// 1280x720 logical view; main.js scales the canvas to the window.

import { ASPECTS, CARD_BY_ID, PALETTE, VIEW_H, VIEW_W } from './config.js';
import { mulberry32 } from './random.js';
import { score } from './world.js';

const CARD_W = 148;
const CARD_H = 208;
const MINI_W = 118;
const MINI_H = 164;
const BACK_W = 74;
const BACK_H = 104;

export const END_TURN_RECT = { x: 1090, y: 470, w: 150, h: 52 };
export const TITLE_PLAY_RECT = { x: 500, y: 520, w: 280, h: 64 };

const STARS = (() => {
  const rng = mulberry32(99);
  return Array.from({ length: 90 }, () => ({
    x: rng() * VIEW_W, y: rng() * 300, r: 0.6 + rng() * 1.6, a: 0.25 + rng() * 0.6,
  }));
})();

// Where each card of a hand sits. Hands fan out from the centre bottom
// (player) or the centre top (foe backs); the hovered/selected card lifts.
export function handCardRects(count, selected = -1, hover = -1) {
  const rects = [];
  if (count === 0) return rects;
  const gap = Math.min(150, (VIEW_W - 360) / Math.max(1, count));
  const total = CARD_W + gap * (count - 1);
  const x0 = (VIEW_W - total) / 2;
  for (let i = 0; i < count; i += 1) {
    const lift = i === selected ? 26 : i === hover ? 14 : 0;
    rects.push({ x: x0 + gap * i, y: VIEW_H - CARD_H - 18 - lift, w: CARD_W, h: CARD_H, index: i });
  }
  return rects;
}

export function foeBackRects(count) {
  const rects = [];
  const gap = 58;
  const total = BACK_W + gap * (count - 1);
  const x0 = (VIEW_W - total) / 2;
  for (let i = 0; i < count; i += 1) {
    rects.push({ x: x0 + gap * i, y: 96, w: BACK_W, h: BACK_H, index: i });
  }
  return rects;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSigil(ctx, aspect, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (aspect === 'ember') {
    // Flame: a teardrop that leans, with an inner notch.
    ctx.moveTo(cx, cy - r);
    ctx.bezierCurveTo(cx + r * 0.9, cy - r * 0.2, cx + r * 0.7, cy + r * 0.7, cx, cy + r * 0.9);
    ctx.bezierCurveTo(cx - r * 0.7, cy + r * 0.7, cx - r * 0.9, cy - r * 0.2, cx, cy - r);
    ctx.moveTo(cx, cy + r * 0.55);
    ctx.bezierCurveTo(cx + r * 0.35, cy + r * 0.1, cx + r * 0.2, cy - r * 0.25, cx, cy - r * 0.4);
    ctx.bezierCurveTo(cx - r * 0.2, cy - r * 0.25, cx - r * 0.35, cy + r * 0.1, cx, cy + r * 0.55);
  } else if (aspect === 'tide') {
    // Droplet.
    ctx.moveTo(cx, cy - r);
    ctx.bezierCurveTo(cx + r * 0.85, cy + r * 0.1, cx + r * 0.6, cy + r, cx, cy + r);
    ctx.bezierCurveTo(cx - r * 0.6, cy + r, cx - r * 0.85, cy + r * 0.1, cx, cy - r);
  } else if (aspect === 'thorn') {
    // Leaf: two arcs meeting at tip and stem.
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + r, cy - r * 0.1, cx, cy + r);
    ctx.quadraticCurveTo(cx - r, cy - r * 0.1, cx, cy - r);
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.lineTo(cx, cy + r * 0.9);
  } else {
    // Crescent moon.
    ctx.arc(cx, cy, r, Math.PI * 0.25, Math.PI * 1.75);
    ctx.arc(cx + r * 0.55, cy - r * 0.15, r * 0.82, Math.PI * 1.7, Math.PI * 0.3, true);
  }
  ctx.fill();
  ctx.restore();
}

function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const asp = ASPECTS[card.aspect];
  const scale = w / CARD_W;
  ctx.save();
  if (opts.dimmed) ctx.globalAlpha = 0.45;
  roundRect(ctx, x, y, w, h, 12 * scale);
  ctx.fillStyle = PALETTE.cardFace;
  ctx.fill();
  ctx.lineWidth = opts.selected ? 4 : 2;
  ctx.strokeStyle = opts.selected ? PALETTE.gold : asp.dark;
  ctx.stroke();
  // Aspect band.
  ctx.save();
  roundRect(ctx, x + 2, y + 2, w - 4, 34 * scale, 10 * scale);
  ctx.clip();
  ctx.fillStyle = asp.color;
  ctx.fillRect(x, y, w, 34 * scale);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${13 * scale}px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(asp.label.toUpperCase(), x + 34 * scale, y + 17 * scale);
  // Cost gem, top-left.
  ctx.beginPath();
  ctx.arc(x + 17 * scale, y + 17 * scale, 13 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#2b1a4d';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = `bold ${15 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), x + 17 * scale, y + 18 * scale);
  // Sigil, centre.
  drawSigil(ctx, card.aspect, x + w / 2, y + h * 0.42, 30 * scale, asp.color);
  // Power number under the sigil.
  ctx.fillStyle = PALETTE.cardInk;
  ctx.font = `bold ${30 * scale}px Georgia, serif`;
  ctx.fillText(String(card.power), x + w / 2, y + h * 0.56);
  ctx.font = `${10 * scale}px Georgia, serif`;
  ctx.fillStyle = asp.dark;
  ctx.fillText('POWER', x + w / 2, y + h * 0.56 + 22 * scale);
  // Name + rules text.
  ctx.fillStyle = PALETTE.cardInk;
  ctx.font = `bold ${14 * scale}px Georgia, serif`;
  ctx.fillText(card.name, x + w / 2, y + h - 44 * scale);
  ctx.font = `${11.5 * scale}px system-ui, sans-serif`;
  ctx.fillStyle = '#4a4038';
  const lines = wrapText(ctx, card.text, w - 18 * scale);
  lines.slice(0, 2).forEach((ln, i) => {
    ctx.fillText(ln, x + w / 2, y + h - 28 * scale + i * 14 * scale);
  });
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  const s = w / BACK_W;
  roundRect(ctx, x, y, w, h, 9 * s);
  ctx.fillStyle = PALETTE.cardBack;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#6a5a9e';
  ctx.stroke();
  roundRect(ctx, x + 6 * s, y + 6 * s, w - 12 * s, h - 12 * s, 6 * s);
  ctx.strokeStyle = '#8f7cc9';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawSigil(ctx, 'moon', x + w / 2, y + h / 2 - 6 * s, 16 * s, '#c9b8ff');
  ctx.fillStyle = '#c9b8ff';
  ctx.font = `bold ${9 * s}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('PACT', x + w / 2, y + h - 16 * s);
}

function lightBar(ctx, x, y, w, h, light, max, ward, label) {
  ctx.save();
  ctx.font = `bold 13px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(label, x, y + h / 2);
  const bx = x + 92;
  const bw = w - 92;
  roundRect(ctx, bx, y, bw, h, h / 2);
  ctx.fillStyle = '#1a0f0c';
  ctx.fill();
  const frac = Math.max(0, light / max);
  if (frac > 0) {
    roundRect(ctx, bx + 2, y + 2, (bw - 4) * frac, h - 4, (h - 4) / 2);
    const grad = ctx.createLinearGradient(bx, y, bx + bw, y);
    grad.addColorStop(0, '#ffb347');
    grad.addColorStop(1, '#ff5a4e');
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = `bold 14px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`${light} / ${max}`, bx + bw / 2, y + h / 2 + 1);
  if (ward > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9adcff';
    ctx.font = `bold 13px Georgia, serif`;
    ctx.fillText(`◆ ${ward} ward`, bx + bw + 10, y + h / 2);
  }
  ctx.restore();
}

function drawEmberOrbs(ctx, x, y, ember, maxEmber) {
  ctx.save();
  ctx.font = `bold 13px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('EMBERS', x, y);
  for (let i = 0; i < maxEmber; i += 1) {
    const cx = x + 78 + i * 24;
    ctx.beginPath();
    ctx.arc(cx, y, 9, 0, Math.PI * 2);
    if (i < ember) {
      ctx.fillStyle = '#ff8c2f';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffd9a0';
      ctx.stroke();
    } else {
      ctx.fillStyle = '#233026';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#4a5a4e';
      ctx.stroke();
    }
  }
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 14px Georgia, serif`;
  ctx.fillText(`${ember}/${maxEmber}`, x + 78 + maxEmber * 24 + 8, y);
  ctx.restore();
}

function drawButton(ctx, rect, text, enabled, hover) {
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fillStyle = enabled ? (hover ? '#f5c542' : '#d9a92c') : '#3a3f35';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = enabled ? '#8a6d1f' : '#555';
  ctx.stroke();
  ctx.fillStyle = enabled ? '#241d18' : '#9a9a8a';
  ctx.font = `bold 17px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

function drawTable(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, '#0b1f2a');
  grad.addColorStop(0.45, '#12291f');
  grad.addColorStop(1, '#0a1a13');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (const s of STARS) {
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#dfeaff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Crescent moon, top-right, clear of the Warden's deck line.
  ctx.save();
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath();
  ctx.arc(1226, 44, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0b1f2a';
  ctx.beginPath();
  ctx.arc(1238, 37, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Felt table.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(VIEW_W / 2, 400, 590, 250, 0, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.felt;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.feltLine;
  ctx.stroke();
  ctx.restore();
}

function drawLastPlayed(ctx, state) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold 12px Georgia, serif`;
  ctx.fillStyle = PALETTE.dim;
  const foeCard = state.lastPlay.foe;
  const youCard = state.lastPlay.player;
  ctx.fillText('WARDEN PLAYED', 300, 250);
  if (foeCard) drawCardFace(ctx, foeCard, 300 - MINI_W / 2, 264, MINI_W, MINI_H);
  else {
    ctx.globalAlpha = 0.5;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('— no card yet —', 300, 340);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `bold 12px Georgia, serif`;
  ctx.fillText('YOU PLAYED', 980, 250);
  if (youCard) drawCardFace(ctx, youCard, 980 - MINI_W / 2, 264, MINI_W, MINI_H);
  else {
    ctx.globalAlpha = 0.5;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('— no card yet —', 980, 340);
    ctx.globalAlpha = 1;
  }
  // Centre: round, score, log.
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold 20px Georgia, serif`;
  ctx.fillText(`ROUND ${state.round}`, 640, 268);
  ctx.font = `bold 15px Georgia, serif`;
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`SCORE ${score(state)}`, 640, 296);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  ctx.textAlign = 'left';
  state.log.slice(-3).forEach((line, i) => {
    ctx.fillText(`· ${line}`, 500, 326 + i * 20);
  });
  ctx.restore();
}

function drawTitle(ctx, ui) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 14, 20, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('LANTERN PACT', VIEW_W / 2, 150);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('— Duel of the Hollow Moon —', VIEW_W / 2, 192);
  drawSigil(ctx, 'moon', VIEW_W / 2, 252, 26, '#d9c2ff');
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  const rules = [
    'Two lantern-keepers, one table. Reduce the Warden\u2019s light from 30 to 0 before yours goes out.',
    'Each round your ember cap grows by 1. Play cards by clicking them (or keys 1–7, Enter to play).',
    'Ember burns, Tide mends, Thorn wards, Moon gambles. End your turn with E — then the Warden answers.',
  ];
  rules.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 310 + i * 26));
  const hover = ui.mouse.x >= TITLE_PLAY_RECT.x && ui.mouse.x <= TITLE_PLAY_RECT.x + TITLE_PLAY_RECT.w
    && ui.mouse.y >= TITLE_PLAY_RECT.y && ui.mouse.y <= TITLE_PLAY_RECT.y + TITLE_PLAY_RECT.h;
  drawButton(ctx, TITLE_PLAY_RECT, 'LIGHT THE LANTERNS', true, hover);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Mouse + keyboard  ·  M mute  ·  a complete original card duel — no network, no account', VIEW_W / 2, 620);
  ctx.restore();
}

function drawEnd(ctx, state, ui) {
  const won = state.over === 'won';
  ctx.save();
  ctx.fillStyle = won ? 'rgba(10, 26, 12, 0.94)' : 'rgba(20, 8, 12, 0.94)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Solid panel so the table underneath never collides with the result text.
  roundRect(ctx, 220, 140, 840, 360, 18);
  ctx.fillStyle = won ? '#0d2417' : '#260f13';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = won ? PALETTE.gold : PALETTE.red;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? PALETTE.gold : PALETTE.red;
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText(won ? 'THE LANTERN IS YOURS' : 'THE LANTERN FADES', VIEW_W / 2, 220);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText(
    won ? 'The Warden bows. The Hollow Moon keeps your light.' : 'The Warden keeps the table. Light it again, Keeper.',
    VIEW_W / 2, 262,
  );
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  const s = state.stats;
  const lines = [
    `Score ${score(state)}   ·   Damage dealt ${s.damageDealt}   ·   Cards played ${s.cardsPlayed}`,
    `Rounds ${state.round}   ·   Your light ${state.player.light} / ${state.player.maxLight}   ·   Warden light ${state.foe.light} / ${state.foe.maxLight}`,
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 330 + i * 30));
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText('Press R to play again  ·  Esc for the title screen', VIEW_W / 2, 430);
  ctx.restore();
}

export function drawScene(ctx, state, ui) {
  drawTable(ctx);
  if (state.screen === 'title') {
    drawTitle(ctx, ui);
    return;
  }
  const foe = state.foe;
  const you = state.player;
  // Foe panel.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(foe.name, 40, 30);
  lightBar(ctx, 40, 52, 430, 22, foe.light, foe.maxLight, foe.ward, 'LIGHT');
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Deck ${foe.deck.length}  ·  Discard ${foe.discard.length}`, 980, 30);
  ctx.fillText(`Embers ${foe.ember}/${foe.maxEmber}`, 980, 56);
  const backs = foeBackRects(Math.min(7, foe.hand.length));
  for (const r of backs) drawCardBack(ctx, r.x, r.y, r.w, r.h);
  ctx.restore();

  drawLastPlayed(ctx, state);

  // Player panel.
  ctx.save();
  lightBar(ctx, 40, 452, 430, 22, you.light, you.maxLight, you.ward, 'LIGHT');
  drawEmberOrbs(ctx, 40, 492, you.ember, you.maxEmber);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Deck ${you.deck.length}  ·  Discard ${you.discard.length}  ·  Hand ${you.hand.length}/${7}`, VIEW_W / 2, 463);
  const canEnd = state.screen === 'play' && state.turn === 'player' && !state.over;
  const hoverEnd = ui.mouse.x >= END_TURN_RECT.x && ui.mouse.x <= END_TURN_RECT.x + END_TURN_RECT.w
    && ui.mouse.y >= END_TURN_RECT.y && ui.mouse.y <= END_TURN_RECT.y + END_TURN_RECT.h;
  drawButton(ctx, END_TURN_RECT, 'END TURN  (E)', canEnd, hoverEnd);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Click a card to select · Enter plays it', VIEW_W - 40, 80);
  ctx.fillText(ui.muted ? 'Keys 1–7 select · E end turn · M sound off' : 'Keys 1–7 select · E end turn · M sound on', VIEW_W - 40, 98);
  ctx.restore();

  // Player hand.
  const rects = handCardRects(you.hand.length, ui.selected, ui.hover);
  rects.forEach((r) => {
    const card = CARD_BY_ID[you.hand[r.index]];
    const affordable = card.cost <= you.ember && state.turn === 'player' && !state.over;
    drawCardFace(ctx, card, r.x, r.y, r.w, r.h, {
      selected: r.index === ui.selected,
      dimmed: !affordable,
    });
  });

  if (state.screen === 'won' || state.screen === 'lost') drawEnd(ctx, state, ui);
}
