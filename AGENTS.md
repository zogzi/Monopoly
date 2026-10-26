# ZMONOPOLY

The full product brief is in SPECIFICATION.md. Section 130 limits the initial delivery to Milestone 1. Later user requests authorize bots, ten original human characters, removal of chat, and a Halloween visual overhaul. v0.2.0 is desktop-only and removes the commercial header. It adds custom district architecture, storm effects, city NPCs, fullscreen dice, private tactical cards, surprise choices, city events and custody with police escorts. Use five-minute normal/planning timers, ten-minute crisis recovery and early planning completion. Keep text readable. The user then authorized the remaining gameplay systems: trading/counteroffers, auctions, bank loans/refinancing and preset contracts. v0.3.0 adds those, three modes, net scoring and animation feedback. Keep unrequested influence/policy/executive systems separate. Preserve long timers even in Blitz. v0.3.1 adds funded-payment claims, a 30-round Domination cap, production build/server.mjs, precompressed browser assets and Docker/Caddy hosting. Never credit unfunded claims as spendable cash or double-count shortfalls in scoring. Browser preview fixtures must use isolated saves.

- Work in this existing checkout; cloud tasks are already isolated. Do not create a worktree unless asked.
- Node 22.12+; npm lockfile is authoritative. In this cloud machine use `npm ci --cache /workspace/.npm-cache`.
- `npm run dev`: Vite + one Fastify/Socket.IO server. `npm run build && npm start`: one production process serving both assets and sockets on port 3001.
- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` for code changes. For UI changes run `npm run test:browser` and inspect screenshots in ignored artifacts/. Browser tests use system Chromium (CHROMIUM_PATH override).
- Gameplay belongs in packages/game-core, never in presentation components. Every command must be validated, server-authoritative and transactional, including RNG.
- Keep all authentication tokens and RNG state out of public socket snapshots. Never commit save/.
- Preserve the one-session, one-board, maximum-15-player design. No accounts, room codes, matchmaking, Redis, or database services.

- Display the release version from package.json, include it in health responses, and bump it with a matching Git tag for future releases. Do not confuse game-state command versions with release versions.
