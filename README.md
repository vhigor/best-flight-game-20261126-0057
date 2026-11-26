# Skyhaven Courier

[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/c/best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/vhigor/best-flight-game-20261126-0057/rank.svg)](https://make.fun/c/best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/vhigor/best-flight-game-20261126-0057/reward.svg)](https://make.fun/c/best-flight-game-20261126-0057)

A complete flight game that plays offline in a desktop browser. Fly the
cream-and-crimson Courier over the Skyhaven valley: thread the rings of the
Ring Run, dive the Canyon Thread, then land on runway 36 and stop. Throttle
and bank trade against speed and height, fuel runs down, hard arrivals bend
the hull, and a gentle touchdown on the strip refuels and repairs her.

## Fly it

Serve `game/` with any static server (or run `node serve.ts`) and open it in
a desktop browser. No network requests, no build step.

- **W / S** — throttle up / down
- **Arrow keys** — pitch and bank (pull back to climb)
- **C** — chase / cockpit view
- **M** — mouse steering on / off
- **P** — pause, **R** — restart after a crash

## Layout

- `game/` — the playable game: `index.html`, `style.css`, and one module per
  job under `game/src/` (world, flight model, renderer, aircraft, HUD,
  missions, input, audio, screenshot scenes)
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to the
  output and writes `dossier.json` with the kit's vendored library
- `screenshots/` — renders of the game itself, cover first
- `vendor/makefun-game.ts` — the make.fun kit library, unchanged
