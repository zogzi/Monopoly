# ZMONOPOLY review

The current v0.4.0 follow-up, screenshots and verification are in [City in Focus](CITY-IN-FOCUS.md). The v0.3.2 visual work is documented in [Ravenwatch after Dark](VISUALS.md). The detailed findings below describe the v0.3.1 baseline. The linked simulation report is refreshed against v0.4.0; the hosting report identifies its older tested version. Figures quoted below remain historical measurements.

## v0.3.1 baseline

This review combines rule inspection, regression tests, full bot matches, real browser interactions, a recorded preview and a production-container test. It does not establish human enjoyment or FPS on your hardware.

## Issues fixed

- **Unfunded payments:** rent and due contracts previously credited the recipient in full even if the payer was below zero. Bankruptcy could leave that recipient with spendable money that had never been funded. Payments now credit only available funds. The unpaid balance becomes a visible claim, recovery money funds it, and bankruptcy writes off the unfunded portion. Score includes each liability and receivable once. Part-paid revenue shares round cumulatively.
- **Overdue collateral:** matured bank principal no longer releases its collateral while unpaid. The property stays locked until the debt is funded or the secured claim is resolved in bankruptcy.
- **Domination pacing:** the before-cap audit averaged 131–150 rounds across group sizes, with a maximum of 350. The mode now has a visible 30-round safety limit and net-value scoring if multiple empires remain. Last-solvent wins still end a game earlier. Long thinking timers remain.
- **Bot phase safety:** an off-turn trade could lower a bot's cash during a route choice and cause it to attempt a cash card in a phase where cards are unavailable. Bot card decisions now respect the allowed phases; generated trade proposals are validated before sending.
- **Restart behavior:** the server now disconnects live sockets and stops its game timer before saving and exiting. A production container exited cleanly with a connected player, was removed, and a new container restored the same four seats and reconnect identity from its volume. The restored match was paused.
- **Rendering after suspension:** the escort now uses a monotonic clock independent of the renderer's restartable clock. Opening a full-screen overlay no longer risks a negative position along its path. Its HTML label also disappears on arrival.
- **Caching:** the static plugin's default cache header was overriding the intended custom policy. Actual HTTP checks now confirm immutable hashed assets and revalidating HTML.

## Verification

| Check                              | Result                                                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint, TypeScript, production build | Passed                                                                                                                                                            |
| Vitest                             | 61 tests passed across 7 files                                                                                                                                    |
| Browser scenarios                  | 5 passed, including a complete bot match/rematch, fullscreen dice, two-person trade/counter/loan flow, live auction, custody/bail and covered-renderer suspension |
| Seeded audit                       | 270 of 270 completed: all three modes, 4/8/15 seats, 30 seeds per combination                                                                                     |
| Audit invariants                   | Ownership, legal development, finite integer cash, funded shortfalls, hand limits, unique collateral and solvent winners                                          |
| Production image                   | Built on Node 24, development dependencies removed, runs as UID 1000                                                                                              |
| Container replacement              | Same persistent volume restored 4 seats, identity and paused match                                                                                                |
| Live-client shutdown               | Clean exit; about 148 ms in the recorded container check                                                                                                          |
| Caddy and Compose                  | Configuration validation passed; public DNS/certificate issuance is still a deployment-specific step                                                              |
| Preview                            | About 59 seconds, 1600 × 900, 24 fps, H.264 + captured AAC game audio; about 5.4 MB                                                                               |

Full outputs: [simulation results](simulation-audit.json), [before-cap comparison](simulation-audit-before-cap.json), [hosting check](hosting-audit.json). The before-cap comparison used the same seeded bot scenarios during this audit, with the payment fixes already in progress; it is not a benchmark of an untouched old release.

## Performance findings

- JS/CSS text assets total about **1.35 MB raw / 350 KB Brotli**, a 74% transfer reduction. The measured entry JavaScript response was 396,998 bytes raw / 112,018 bytes transferred. Fonts are additional self-hosted assets. These are byte counts, not a measured mobile/network loading-time guarantee.
- The browser regression observed **62 draw calls with four players and 97 with fifteen** in its sampled views. Lightning, camera position, development and temporary feedback change these figures. Geometry remains instanced and unchanged snapshots reuse objects.
- The city renderer stops under full-screen dice/dialogs and when its tab is hidden. A browser check observed no renderer-frame progress under the help dialog and confirmed progress resumed after closing it.
- Traffic and pedestrian colors now upload once on creation rather than every frame. Their movement still updates instance transforms. AUTO adjusts resolution; LOW reduces resolution and effects; HIGH adds cached shadows.
- The server runs compiled JavaScript. The production container starts without a TypeScript loader or development packages. A larger hosting machine will not make a player's browser GPU render the city faster.

This is materially improved, not a claim of maximum possible optimization. A remaining large renderer chunk is expected for the current 3D stack. Further work should follow profiling on actual target PCs; draw-call counts or cloud software rendering do not establish hardware FPS. The checked container image is roughly 422 MB uncompressed, including browser build dependencies retained as production libraries; that disk size is not its RAM use. A separate server-only package could reduce it further.

## Is the game interesting?

The rules provide several real decisions: routing around rent, assembling districts, timing cards, bidding against rivals, negotiating properties, exchanging contractual risk, borrowing against collateral and choosing whether an illegal deal is worth custody. Those are stronger foundations than repeated dice-and-buy turns. The real question is whether your friends feel engaged while waiting and whether the choices remain varied through the final rounds.

The conservative bots reveal areas to improve:

| Capital Race seats | Average development actions | Average completed trades | Average bank loans |
| ------------------ | --------------------------: | -----------------------: | -----------------: |
| 4                  |                        9.40 |                     1.63 |                  0 |
| 8                  |                       16.83 |                     3.57 |                  0 |
| 15                 |                       21.33 |                     4.87 |                  0 |

These are per-match counts from the 30-seed groups, not per-player figures or predictions of human behavior. The bots borrow mainly in emergencies and do not independently invent advanced contract proposals, so a simulation undersamples those systems. With fifteen seats, development and negotiation per person can be thin even though the engine completes correctly.

My next priorities, in order:

1. **A 4–8-human playtest of Capital Race or Blitz.** Measure turn length, time spent waiting, how often people finish planning early, and which surprises feel repetitive. Use Blitz for a larger group's first session. Keep the generous maximum timers.
2. **Better negotiation and bot strategy.** Add helpful district-completion trade suggestions, more varied fair counteroffers, investment borrowing when its costs make sense, and a few clear contract proposals. Improve use of the existing systems before adding more currencies or menus.
3. **More encounter variety and fewer immediate repeats.** A private shuffled encounter deck and more choices tied to district ownership could make late turns feel less interchangeable. Any deck order must remain server-private.
4. **Balance loan and building incentives from observations.** Current bot matches almost never need bank loans in fixed-round modes. Test whether humans actually want them and whether their interest/benefit is understandable before changing rates or payouts.
5. **Profile real PCs.** Compare AUTO/LOW/HIGH at the intended screen size, including a developed fifteen-seat city. Only then decide whether batching all avatars together, further renderer splitting or simpler materials would improve the experience most.

Avoid adding unrelated systems just to increase feature count. For this private group, readable choices, visible consequences and short waits matter more than additional menus.

## Hosting recommendation

Use one persistent Node service. For control and predictable behavior, start with a 2-vCPU/2-GB Linux VPS near your group, the supplied Docker Compose stack and Caddy HTTPS/WebSocket proxy. For less server administration, use one always-on Railway/Render Docker service with a persistent `/data` volume. Do not use static hosting or multiple unsynchronized instances. [Exact setup, update and backup steps](HOSTING.md).
