# Empire Circuit

The full product brief is in SPECIFICATION.md. Section 130 limits the initial delivery to Milestone 1. Keep subsequent milestones separate unless the user requests them.

- Work in this existing checkout; cloud tasks are already isolated. Do not create a worktree unless asked.
- Node 22.12+; npm lockfile is authoritative. In this cloud machine use `npm ci --cache /workspace/.npm-cache`.
- `npm run dev`: Vite + one Fastify/Socket.IO server. `npm run build && npm start`: one production process serving both assets and sockets on port 3001.
- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` for code changes. For UI changes run `npm run test:browser` and inspect screenshots in ignored artifacts/. Browser tests use system Chromium (CHROMIUM_PATH override).
- Gameplay belongs in packages/game-core, never in presentation components. Every command must be validated, server-authoritative and transactional, including RNG.
- Keep all authentication tokens and RNG state out of public socket snapshots. Never commit save/.
- Preserve the one-session, one-board, maximum-15-player design. No accounts, room codes, matchmaking, Redis, or database services.
