# Empire Circuit — Milestone 1

A private, single-session, 4–15-player browser board game. React/TypeScript + Three.js render Nova City; one Fastify/Socket.IO server owns all game rules, RNG, seats and persistence. No accounts, room codes, database, or external services.

## Run

Node.js 22.12+ (tested with 24.19), npm 11.

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

Vite serves the client on port 5173 and proxies sockets to the server on 3001. Friends must access the **same** running website. Do not run a separate server per player.

For a single-process build:

```sh
npm run build
npm start
```

The server serves `dist/` and Socket.IO on port 3001. `PORT` overrides the listening port; `SAVE_DIR` overrides the snapshot directory (default `save/`). Bind a reverse proxy with HTTPS to this port when hosting for friends. Localhost URLs are for local development; this repository does not publish a hosted website.

## Playable loop

1. Enter a display name, choose a rocket, robot, cat, or car, and join.
2. Four to fifteen connected players mark ready. The host starts Capital Race.
3. A seeded shuffle establishes turn order. Each round starts with 25 seconds of simultaneous planning/development.
4. Roll two server-generated dice, choose roads at junctions, acquire properties and pay opponents revenue. Passing HQ awards $200. Turns and route decisions have automatic timeouts.
5. Own 2 district properties for +10% revenue. Own 3 to unlock development and 6 total zoning levels; all 4 unlock landmarks and 12 total levels. Developments physically grow on the board.
6. A negative cash balance opens a 45-second crisis window. Sell development at half cost, or declare bankruptcy. Bankruptcy releases properties to the city; more advanced creditor auctions belong to later milestones.
7. After 12 rounds, highest cash + property purchase values + development investment wins. Ties follow the established turn order. The last solvent player wins immediately. Host rematch retains seats and resets the board.

Momentum is recorded (maximum 2) when rolling doubles; spending abilities belong to a later milestone. Opportunity/civic spaces currently award fixed, visible grants.

## Reconnect and persistence

The browser retains a cryptographically random reconnect token in localStorage. Seat identity is independent of socket IDs. Multiple tabs using the same token share one seat; separate browser profiles represent separate players. The server never broadcasts reconnect tokens or RNG state.

The server serializes snapshots atomically to `save/current-game.json` after state changes and on graceful shutdown. This file contains authentication tokens: keep it private, never commit it. On restart, an active match restores paused. The first returning player takes host control if the previous host is offline, then presses Resume. Reset returns to the lobby. To discard an abandoned session completely, stop the server and remove its snapshot directory.

Saving is local to one server filesystem. Abrupt machine or disk failure can lose the most recent queued write. There is no multi-server or cloud backup guarantee.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

Vitest covers transactional rules, deterministic rolls, routes, purchases, revenue, district development, financial crises, rematches, and complete 4/10/15-player matches. A real Socket.IO integration test connects 15 clients, rejects a 16th, checks authorization, reconnects a seat, restarts the server and verifies restoration. Playwright checks the rendered client, token selection, readiness, chat, refresh recovery, property inspection and mobile layout with Chromium. Configure `CHROMIUM_PATH` if Chromium is not installed at `/usr/bin/chromium`.

## Code layout

- `packages/shared`: serializable types, Nova City graph, Zod command schema.
- `packages/game-core`: transactional phase machine and pure property calculations. No React, Three.js, network or filesystem dependencies.
- `apps/server`: socket transport, seat authentication, timers, atomic JSON snapshots and HTTP serving.
- `apps/web`: HTML HUD, Zustand socket store, procedural 3D city, local animations and opt-in synthesized sound.
- `SPECIFICATION.md`: full supplied product specification.

## Scope and remaining work

This delivery targets **Milestone 1 only**, as required by section 130 of the full specification. The city uses procedural placeholder models and basic street interpolation. Dice settle with the server result, ownership uses accents plus readable owner names, and tokens have distinct silhouettes. Camera supports orbit, zoom, pan and reset; automatic cinematics and spline smoothing remain future polish.

Auctions, trading/contracts, loans, economic cycles, dynamic demand, executives/objectives, policy voting/projects, premium GLB assets, weather/night lighting, advanced audio, wealth graphs and other modes are intentionally deferred to milestones 2–7. No FPS claims are made: browser validation in this environment uses software WebGL, not representative gaming hardware. Mobile controls and canvas are responsive; the desktop social rail becomes a Talk tab on smaller screens.
