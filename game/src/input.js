// Keyboard + pointer input, mapped to the 1280x720 logical view. Clicks
// and keys are latched into a small queue that main.js drains once a
// frame, so a quick tap can never vanish between frames.

import { END_TURN_RECT, TITLE_PLAY_RECT, handCardRects } from './render.js';

export function createInput(canvas) {
  const input = {
    mouse: { x: -1, y: -1 },
    clicks: [], // {x, y}
    keys: [], // latched key names, drained by main.js
    hover: -1,
  };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const sx = 1280 / rect.width;
    const sy = 720 / rect.height;
    return {
      x: (event.clientX - rect.left) * sx,
      y: (event.clientY - rect.top) * sy,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    input.mouse = toLogical(event);
  });
  canvas.addEventListener('mouseleave', () => {
    input.mouse = { x: -1, y: -1 };
  });
  canvas.addEventListener('click', (event) => {
    input.clicks.push(toLogical(event));
  });
  window.addEventListener('keydown', (event) => {
    if ([' ', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    input.keys.push(event.key.length === 1 ? event.key.toLowerCase() : event.key);
  });
  return input;
}

function inside(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

// Which hand card (if any) sits under point p, topmost card first: cards
// overlap, and the rightmost card is on top where they overlap.
export function handCardAt(state, p) {
  const rects = handCardRects(state.player.hand.length);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    if (inside(p, rects[i])) return rects[i].index;
  }
  return -1;
}

export { END_TURN_RECT, TITLE_PLAY_RECT, inside };
