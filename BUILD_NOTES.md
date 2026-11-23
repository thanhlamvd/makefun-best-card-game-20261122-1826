# BUILD_NOTES — LANTERN PACT: Duel of the Hollow Moon (best-card-game-20261122-1826)

## Concept

A complete, original turn-based card duel for the make.fun "Make the best card game" bounty ($50, top 10 share $50). Two lantern-keepers trade cards across a moonlit table: reduce the Warden's light from 30 to 0 before yours goes out.

- **Embers** — each round the ember cap grows by 1 (to 10) and embers refill. Every card costs embers.
- **Four Aspects, 12 original cards** — Ember burns (damage), Tide mends (heal + draw), Thorn wards (shield), Moon gambles (draw at a cost, big swings). 30-card decks.
- **Ward** absorbs damage before light; **fatigue** (2 light per draw from an empty deck) keeps every game finite.
- **The Warden** — greedy AI: hunts lethal, heals/wards when its lantern runs low, draws when its hand is thin, spends embers on the best damage-per-ember.
- **Win / lose** — first lantern to 0 ends the duel; score = 100 win bonus + 2/damage + 3/card played + 2/light kept − 2/round.
- **Controls** — click a card to select, Enter plays it, keys 1–7 select, E ends turn, M mute, R replay, Esc title. Synthesized WebAudio effects, no audio files. Canvas 2D vector art, no images, no network.

## Structure

- `game/index.html` — canvas + status line; loads `game/src/main.js`.
- `game/src/config.js` — tuning, the 12-card catalogue, deck list, palette.
- `game/src/random.js` — seeded RNG (mulberry32) + shuffle helpers.
- `game/src/deck.js` — deck building, drawing, reshuffle, fatigue.
- `game/src/world.js` — the duel: pure state, turns, card effects, win/lose.
- `game/src/ai.js` — the Warden's greedy turn planner.
- `game/src/render.js` — all drawing: table, hands, cards, HUD, screens.
- `game/src/input.js` — keyboard + pointer, mapped to logical coordinates.
- `game/src/audio.js` — synthesized WebAudio effects, no audio files.
- `game/src/shots.js` — deterministic screenshot staging (`?shot=`).
- `game/src/main.js` — boot, screen machine, frame loop, `__lantern` handle.
- `main.ts` — hands the game in: copies `game/` + `screenshots/` to `/output`, writes `dossier.json` via `vendor/makefun-game.ts`.
- `serve.ts` — tiny static server for local play on port 8080.
- `shots.json` — the four screenshot stages.
- `LICENSE` — MIT (written by `makefun init`). `.makefun/owner.json` — wallet-first ownership.

## Verification (all run, all pass, unless noted)

- `node --check` on all 10 `game/src/*.js` modules, plus `main.ts` and `serve.ts`: **pass, no errors**. ES-module parse check via `vm.SourceTextModule`: **pass**.
- Node logic test (`/tmp/test-card.mjs`, 83 checks): **83/83 pass** — opening hands/embers, ward absorbs before light, heal caps, unaffordable play refused, kindling feeds the turn, turn flow + ember-cap growth, determinism (same seed + plays → identical state), 60 full games all terminate (max 24 rounds), player wins 32/60 vs random play, lethal wins, fatigue costs 2, reshuffle refills.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice: **byte-identical** outputs (`diff -r` clean). `dossier.json` 321,017 bytes, 11 source files.
- Screenshots captured headless (Playwright chromium_headless_shell, 1280×720, JPEG): all four **≤256 KiB** (40–72 KiB). Each was viewed and fixed twice: end screens now use a solid panel (the table used to show through and collide with the stats); the moon moved clear of the Warden's deck line; the title button widened to one line; POWER label moved clear of card names; deck/discard/hand line and hints moved where wide hands cannot cover them.
- Interactive playtest (CDP + headless Chromium, seed 1): title → click PLAY → play, hand 5, ember 1; keyboard selects Cinder Slash (key 2) + Enter plays it, foe light 30 → 27, ember 1 → 0; E ends turn, the Warden answers (Stillwater, Kindling, Thornwall), back to player round 2; **0 console errors, 0 page errors, 0 external requests**. One real finding: pressing 1 + Enter on an unaffordable card correctly refuses (deny) — the first test run looked like a failure until the hand showed card 1 cost 2 embers against 1 available.

## Kit check (heist kit CLI, run 00:51 UTC 23/11 — WRONG competition, read carefully)

**14 passed, 2 failed, 6 skipped, 3 checked at submission** — run with the sibling heist kit's CLI because the card kit still returns 503 `kit_pending`. Passes include: snapshot (24 files, 322,562 bytes), license_osi (MIT), entrypoint (main.ts, node22), repo_created_after_open (anchor round 34196907), transcripts_present (1 muse-app session, 161 messages), transcripts_recorded, thinking_wellformed, thinking_in_window, thinking_reproduces (**96.0% authored: 1065/1109 lines**, 0 copied, 0 pasted; main.ts 8 authored lines), thinking_turns (58), thinking_revised (render.js from 3 messages), thinking_fresh (all 1065 credited lines show the anchor before their first write), transcripts_run_record, thinking_own_work (1065/1109 own lines, 0 from another entry's files, 0 from downloads).
**FAIL 1 — competition_open: only because the check ran against the HEIST kit (its deadline 17:59 UTC 22/11 passed). The CARD competition is open until 06:26 UTC 23/11 — not a real failure; re-run with the card kit CLI.**
**FAIL 2 — thinking_priced: 0 usage rows attached to the bundle's Muse app session.** Muse writes a message's usage row only when the message is delivered, so this run's rows do not exist yet. Fix, per the kit: end this turn, then in the next turn run the SELECT for agent 4707fc33-256b-49dc-939b-08a883380913 (and parent d249f9cb-1893-456f-9b18-5ab1a7aec480), save the rows to a file, and re-bundle with `--muse-usage <file>` — then re-check (expect thinking_priced to pass). The 3 submission-phase items (repo_owner / source_bundle / duplicate_snapshot) are server-side checks at submit time — expected before the repo exists on GitHub / before submit.

## Kit status — card kit NOT yet downloadable

- The card-game kit endpoint returns 503 `kit_pending` ("This kit is being built; send this again in 5 s") since the first attempt (~07:30 Hanoi); still 503 after 40+ minutes of retries. A background retry loop keeps polling every 45 s and saves the kit to `/tmp/cardkit/kit.tar.gz` if it ever lands.
- Workaround used: the sibling heist kit's CLI (same kit family, CLI 0.1.0) for `init` (with `--competition best-card-game-20261122-1826`), `bundle` and `check`, and its `vendor/makefun-game.ts` copied unchanged. The anchor printed: `makefun anchor 5b5cdfdd57a960a771a24dfbb6e4b3cb908e1455 round 34196907`. The CLI warned its copy is level 36 while the site is at level 37 — when the card kit (level 37) arrives, swap `vendor/makefun-game.ts` and re-run check + bundle with its CLI before submitting.
- `makefun check` against the heist kit tests the WRONG competition (heist, closed 17:59 UTC 22/11) — the competition_open FAIL above is an artifact of that, and thinking_in_window was judged against the heist opening (05:59 UTC 22/11); against the card opening (18:26 UTC 22/11) this session (started 00:27 UTC 23/11) is also inside the window.

## Bundle

- `~/workspace/makefun-submissions/best-card-game-20261122-1826/bundle.tar.gz` (208,651 bytes, sha256 `54add7a539fb1a06048c0a3a403513cba30ad9fdc5681a55d3860507d5a83fd5`): 1 session (67 turns, 254 lines), run record complete (scheduled prompt, system prompt uploaded, 1 instruction file, no MCP servers, provider meta, model muse-spark-1.3, effort default). **Missing usage rows — see above. Re-bundle with --muse-usage after this turn ends; the sha256 above will change, and the submit must use the FINAL bundle.**
- Prompt file used: `prompt.txt` beside the bundle (the schedule's configured task, origin scheduled).

## Local commit

- `d3c4550c4b20bf735515abea975973f2522a0cb7` on main (first commit; this BUILD_NOTES.md is a second commit — see git log for the final SHA).

## Known limits (honest)

- Canvas 2D vector art and synthesized sounds — no raster art, no music track. Deliberate scope choice for a deterministic, dependency-free entry.
- Screenshots are staged frames from the real simulation (`?shot=`), not real-time captures — same approach as the heist entry.
- Difficulty tuned from scripted + simulated games, not from real players: random play wins 32/60, so a thinking player should beat the Warden more often than not. If it plays too easy, the numbers to touch are the AI's `wardValue`/`healValue` in `config.js` and the Warden's opening hand.
- The `__lantern` read-only handle in `main.js` is a test hook (state only, no cheats); it ships in the game.

## Exact next step (needs the card kit + Truong's Chrome)

1. **When the card kit lands:** swap `vendor/makefun-game.ts` for the card kit's copy, re-run `MAKEFUN_OUTPUT_DIR=out node main.ts` (dossier must stay byte-identical across two runs), re-bundle, re-run `node cli/makefun.mjs check` with the card kit CLI (expect thinking_priced to pass after the usage-rows re-bundle).
2. **Re-bundle first (after this turn ends):** new turn → SELECT usage rows for agent `4707fc33-256b-49dc-939b-08a883380913` from muse.db → `node cli/makefun.mjs bundle` again with `--muse-usage <file>` → re-run `node cli/makefun.mjs check` (expect thinking_priced to pass).
3. **Push via Chrome:** create repo `makefun-best-card-game-20261122-1826` under **thanhlamvd** (public, created after 01:26 Hanoi 23/11), push the local main branch, set About: description "LANTERN PACT — Duel of the Hollow Moon. Built by an AI agent for make.fun's "Make the best card game" bounty, $50 in USDC.", homepage https://make.fun/bounty/best-card-game-20261122-1826, topics makefun, ai-agents, bounties, games.
4. **Submit before 13:26 Hanoi 23/11** (06:26 UTC 23/11): `node cli/makefun.mjs submit --competition best-card-game-20261122-1826 --repo-url https://github.com/thanhlamvd/makefun-best-card-game-20261122-1826 --commit <final SHA> --title "LANTERN PACT — Duel of the Hollow Moon" --bundle <final bundle.tar.gz> --keypair <wallet file>` (signed entry; payout wallet BedBMrz1mtuDyj3D8YGBM26xck8tF3puoeL3KVmSaGEy).
