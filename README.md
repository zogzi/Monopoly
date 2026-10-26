# ZMONOPOLY v0.2.0 — Storm over Nova City

A desktop browser game for one private group: 4–15 total seats, including optional bots. One city, one authoritative server, no accounts, rooms, database, matchmaking or text chat. Use Discord to talk.

![Nova City](docs/after-dark.png)

## Launch

Requires Node.js 22.12+; tested with Node 24.19.

```sh
npm ci
npm run build
npm start
```

Open `http://localhost:3001`. Friends on the same network open `http://YOUR-COMPUTER-LAN-IP:3001`; allow the port through the host firewall. For friends elsewhere, host this single server behind HTTPS at a shared address. This repository does not deploy a public website automatically.

In the Codex cloud checkout:

```sh
cd /workspace/Monopoly-
npm ci --cache /workspace/.npm-cache
npm run build
npm start
```

The checkout path intentionally remains unchanged. `PORT` overrides 3001; `SAVE_DIR` overrides the default private `save/` directory. Development mode is `npm run dev`: Vite on 5173 proxies to the same single game server on 3001. Do not run two servers against one save directory.

## Start a game

1. Enter a name and choose one of ten original people. Sound starts after joining if “Sound on when I join” is checked; it never autoplays on opening the page.
2. Invite friends or click **Add a bot** at least three times to practice alone. All humans click **I’m ready**; bots are ready automatically. The host clicks **Start game**.
3. For a complete hands-off simulation, enable **Play my turns automatically** and choose **Fast** bot speed. Other human seats are never automated. Fast simulations skip repeated full-screen dice animations; manual rolls still show them.

## What happens during play

- **Planning:** up to five minutes to build, use cards and visit service characters. Click **Finish planning** when done. Turns start immediately when all active players finish; use **Back to planning** to change your mind while others are still planning. The host can also start the turns early.
- **Movement:** two server-generated dice, shown in a large, skippable 3D animation. At junctions, choose the outer road or a shortcut. Each normal decision allows five minutes; completing it advances immediately.
- **Properties:** buy unowned lots or pay rent to rivals. Own 2 of a district's 4 properties for +10% rent. Own 3 to build with 6 total development levels; own all 4 for 12 levels and landmarks. Models physically change as levels rise.
- **Surprises:** each movement turn ends with one of 14 two-option encounters. Choose cash now, cards, future savings, protection, travel or an explicitly risky deal. You can skip instead. Resolving the choice ends the turn immediately.
- **Cards:** start with one card; hold at most four. Rent Shield blocks a payment, Contractor Favor saves building costs, Express Pass adds movement, Emergency Grant gives cash, Market Coupon saves on a purchase, and Alibi releases a detained player. Use or discard cards during planning or your own turn. Opponents receive hidden card backs, not the card types.
- **City events:** six rotating conditions change rent, building costs, property prices or HQ income. The current effect and next-round forecast are visible. Discounts and bonuses are applied by the server, with rent calculations available in the property panel.
- **City characters:** click the Card broker, Contractor or Courier during planning. Buy a chosen tactical card, prepay building credit, or buy extra movement. Every service costs cash and each player may use one service per round.
- **Custody:** illegal deals disclose a 40% arrest chance before acceptance. If caught, a police-car animation escorts the character to the outer-city holding station. Pay $200 bail, play Alibi, or serve two movement turns. Properties keep collecting rent. Find me locates your character even in custody.
- **Cash shortfall:** ten minutes to play cash cards or sell development at half its base cost. If you cannot cover the balance, bankruptcy returns your assets to the city.
- **Winning:** after 12 rounds, highest cash + property values + building values wins. Last solvent player also wins. Ties follow the shuffled turn order. **Play again** retains connected seats and bots.

## The city and sound

Eight districts use custom procedural architecture: dock warehouses and gantries, brick gabled townhouses, neon theaters and an arena, glass laboratory campuses, Art Deco financial towers, eco terraces, luxury balconies and pools, and columned civic buildings. Special stations and utilities have their own forms. Ownership remains an accent rather than recoloring entire buildings.

Storm clouds drift above the central castle, with rain, occasional branching lightning and one brief local light. A ferry, detailed cars, sidewalk pedestrians, bats, autumn trees, pumpkins and a carnival wheel animate the city. **Storm off**, lower graphics quality and Reduced Motion reduce effects. Weather, pedestrians and vehicles never determine gameplay outcomes.

The sound engine uses original synthesized dice rattles, turn chimes, purchase chords, construction sounds, money cues, a victory phrase, quiet wind and thunder. No sound files or remote fonts need downloading during play. **Sound off** mutes the engine.

The current player is marked in the player list, overhead and in the turn panel. **Find me**, **Find current player** and **Reset view** help with navigation. Drag to orbit and scroll to zoom. Phone-specific layouts and controls have been removed; the layout targets desktop windows at least 1200px wide. There is no commercial page header. The sidebar always shows the real package version.

## Reconnect and save

A cryptographic reconnect token in browser localStorage identifies a seat independently of socket IDs. Separate browser profiles represent separate people; multiple tabs with one token share one seat.

The server saves the real state, RNG seed and seat tokens atomically to `save/current-game.json` after changes and on graceful shutdown. Keep this file private and out of Git. After restarting, an active game restores paused. Reconnect and have the host resume. If host control transfers to another human, autoplay turns off. Older saved states gain default card, event, timing and custody fields on load.

Snapshots queued immediately before a hard machine/disk failure may be lost. This is single-machine persistence, not a cloud backup service. To discard an abandoned session, stop the server before removing its save directory.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

Vitest checks transactional rules, routes, timers, early planning completion, private hands, card effects, encounters, services, event prices, custody, migration and victory. One hundred seeded bot matches exercise full games. Real Socket.IO integration connects 15 clients, rejects a 16th and verifies reconnect/restart behavior. Browser tests play through results/rematch, inspect the scene, verify large dice and test a seeded police-escort/bail flow. Chromium defaults to `/usr/bin/chromium`; override with `CHROMIUM_PATH`.

Repeated architecture, pedestrians, cars and props are instanced. Unchanged snapshot data and visual geometry are reused. AUTO adjusts rendering resolution gradually; HIGH uses a cached directional shadow map. The previous release's draw-call figures are not a claim about this expanded scene. Current regression tests measure the new scene; no hardware FPS guarantee or human balance claim is made.

## Version and source

`package.json` is the source of the displayed version and `/api/health` version. Release tags identify exact builds; this release is `v0.2.0`. Future game releases should increment the package version and receive a matching Git tag.

The intended game/repository name is **ZMONOPOLY**. The source is currently hosted at [zogzi/Monopoly](https://github.com/zogzi/Monopoly). The environment's GitHub administration API is blocked (CONNECT 403), so the repository itself has not been renamed. The owner can use [Repository Settings](https://github.com/zogzi/Monopoly/settings) → General → Repository name → `ZMONOPOLY`; GitHub redirects the previous Git URL after renaming.

## Code and design notes

- `packages/shared`: types, authored cards/encounters/events, release version and timing constants.
- `packages/game-core`: authoritative transactional rules, pure financial calculations, private snapshots and bot decisions.
- `apps/server`: Fastify/Socket.IO, authentication, pacing, persistence and static serving.
- `apps/web`: readable HTML controls, procedural 3D architecture, atmospheric effects and local presentation.
- [Design rationale and reviewed references](docs/DESIGN.md).
- `SPECIFICATION.md`: the original full product brief; later user requests authorize this release's additional mechanics and desktop focus.

Advanced trading/contracts, auctions, bank loans, other scoring modes and premium artist-made GLB assets remain future work. The current visuals are custom procedural models. Bot simulations prove execution and invariants, not that the balance is final; human playtesting is still essential.
