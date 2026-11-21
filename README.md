# Neon Palms — Spot the Difference

[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/emasinves0-commits/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/emasinves0-commits/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

Two near-identical neon pictures sit side by side. The right one has been quietly altered, and you have to click every change before the clock runs dry. Neon Palms is an invented palm-lined boulevard (with an invented stray gator, an invented motel and a sign that says GATOR BITES), and every pixel of it is drawn in code on a canvas: no image files, no audio files, no libraries.

## Levels

| # | Scene | Differences | Time limit |
|---|-------|-------------|------------|
| 1 | Boulevard Dusk | 7 | 3:00 |
| 2 | Boardwalk Night | 10 | 2:30 |
| 3 | Marina Dawn | 12 (small and subtle) | 2:00 |
| 4 | Rooftop Sunrise | 14 (hardest) | 1:40 |

## How to play

- Click a difference on **either** picture. A green ring appears on both, a chime plays, and you score 100 points plus a time bonus.
- **Combo:** finds in a row without a miss build a multiplier, shown with a flame beside your score: 2 in a row is x2, 4 in a row is x3, and it multiplies every find. A wrong click drops it back to x1.
- A wrong click costs 25 points (no time penalty), breaks your combo and shakes the picture.
- **H** gives a hint: a golden glow, ripples and a shrinking timer ring pulse on an unfound difference for 2 seconds. Three hints per level, 50 points each.
- **R** restarts the level, **1-4** jump to a level, **Esc** returns to the menu, **M** mutes sound.
- Every level has a count-up timer (best times and best scores are saved in your browser and shown on the level-select cards) and a draining countdown bar. Clear a level fast for three stars.
- Clear all four levels for the victory screen with your total score, total time and longest streak.

## Run locally

The game is plain static files. Serve the `game/` folder with any static server and open it in a desktop browser:

```sh
cd game
python3 -m http.server 8080
# then open http://localhost:8080
```

Add `?shot=cover`, `?shot=level4`, `?shot=hint` or `?shot=win` to the URL for the deterministic states used in the screenshots.

## Code map

- `game/src/main.js` boots the game, wires input and runs the loop
- `game/src/game.js` rules, scoring, combo, timer, hints and the state machine
- `game/src/levels.js` the four levels and their difference lists
- `game/src/scene.js` draws a level's picture, with or without its differences
- `game/src/props.js` code-drawn buildings, signs, palms, gators, cars and more
- `game/src/props_roof.js` rooftop props: water tank, dish, air-con unit, string lights, deck chair
- `game/src/paint.js` small canvas helpers shared by the prop files
- `game/src/render.js` HUD, combo flame, timer bar, markers, pulsing hint, buttons and result screens
- `game/src/audio.js` WebAudio synthesis (chime, buzz, shimmer, arpeggio)
- `game/src/shots.js` deterministic screenshot states
- `main.ts` stages `game/` and `screenshots/` and writes `dossier.json`

## License

MIT, see `LICENSE`.
