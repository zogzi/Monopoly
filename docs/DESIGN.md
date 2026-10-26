# ZMONOPOLY v0.2.0 — why these mechanics exist

The goal is a social, readable game for one private group. More buttons are not automatically more fun. Every new system should create an understandable decision, a consequence, or a shared story.

## What changes a turn

- **Routes** let a player choose exposure to districts instead of only accepting a die result.
- **Surprise encounters** offer two visible trade-offs after a landing. Cash now, a tactical card, future building savings, protection, or travel all solve different problems. Players can skip instead of being forced into a bad deal.
- **A small hand of cards** creates timing decisions. A rent shield is more valuable before an expensive visit; an emergency grant can rescue a cash shortfall. A four-card limit prevents hoarding without thought.
- **City events and a public next-round forecast** change prices, rent, and building timing. Players can prepare; events do not randomly delete half an empire.
- **City service characters** offer predictable help at a price, once per round. Players trade liquidity for a specific advantage.
- **Illegal deals** show the actual 40% arrest chance before acceptance. The player chooses the risk. Custody is visible in the world and has three solutions: bail, Alibi, or serving time. Property income continues, so custody does not mean doing nothing for the rest of the match.
- **Long timers with early completion** support conversation. Decisions allow five minutes; cash-shortfall recovery allows ten. Planning ends early when everybody finishes. Bots still act quickly.

## Presentation supports the rules

The current player's row, overhead marker and turn text identify who acts. Find-me controls restore spatial awareness. Dice animation shows a result the server has already determined. Police escorts, district architecture, pedestrians and weather explain and animate the world; they never change rules by themselves. Storm effects and audio can be disabled.

## References actually consulted

The official boardgame.io source documentation was fetched through GitHub and read. We retain our existing Fastify/Socket.IO engine; no framework migration was needed.

- [Phases](https://github.com/boardgameio/boardgame.io/blob/main/docs/documentation/phases.md): explicitly limit which moves are valid in each phase.
- [Secret state](https://github.com/boardgameio/boardgame.io/blob/main/docs/documentation/secret-state.md): strip opponents' hidden hands before sending snapshots, rather than hiding them in the interface.
- [Randomness](https://github.com/boardgameio/boardgame.io/blob/main/docs/documentation/random.md): keep game randomness under authoritative state management.

The design rationale above is our application of common game-design principles, not a quotation from these framework docs. Direct access to external game-design articles and the MDA paper was blocked by this environment's network policy; those pages were not reviewed or claimed as research evidence.

## What still needs real players

Automated matches detect broken phases, invalid balances, card overflow and stuck bots. They cannot prove that a mechanic is fun. Human playtests should measure encounter frequency, whether illegal deals feel worth the risk, the value of shields versus coupons, game length, and how often players can build. The city events, payouts and odds are first-pass balance values, not a claim of competitive balance.

Further background references for the owner to read independently (external pages were not accessible from this environment): [MDA: A Formal Approach to Game Design and Game Research — Hunicke, LeBlanc & Zubek](https://users.cs.northwestern.edu/~hunicke/MDA.pdf) and [Ian Schreiber's Game Design Concepts course](https://gamedesignconcepts.wordpress.com/).
