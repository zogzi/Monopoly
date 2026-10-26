# EMPIRE CIRCUIT

## FINAL MASTER SPECIFICATION FOR CODEX

Build a polished browser-based 3D multiplayer economic strategy/party board game called:

# EMPIRE CIRCUIT

This game is for a private group of friends.

It is NOT intended to be a public commercial-scale multiplayer service.

The priority is:

**make the actual game incredibly fun, strategic, visually impressive, smooth, social and replayable.**

Do not waste development effort on infrastructure that is unnecessary for this use case.

---

# 1. HARD PROJECT CONSTRAINTS

These requirements are fundamental.

## Players

Support:

4–15 human players.

Typical game:

5–10 players.

Absolute maximum:

15.

---

## Game sessions

There is only:

**ONE ACTIVE GAME SESSION AT A TIME.**

There are no multiple rooms.

There are no room codes.

There is no matchmaking.

There is no public lobby browser.

Everyone opens the same website.

---

## Board

There is only:

# ONE BOARD

called:

# NOVA CITY

Do not build multiple maps.

Instead, make Nova City extremely polished, detailed and replayable.

---

## Audience

Private group of friends.

Therefore initially do NOT build:

- accounts
- email registration
- OAuth
- ranked matchmaking
- MMR
- seasons
- public moderation
- Redis
- Kubernetes
- microservices
- multiple game servers
- payment systems
- cosmetic store
- database-heavy architecture
- public server browser
- multiple rooms
- room codes

Keep infrastructure intentionally simple.

Spend the saved development effort on:

- gameplay
- 3D graphics
- animation
- sound
- interaction
- performance
- balancing
- stability

---

# 2. CORE GAME FANTASY

Players are rival tycoons competing for control of Nova City.

They:

- travel through the city
- acquire properties
- develop buildings
- control districts
- collect revenue
- negotiate trades
- participate in auctions
- borrow money
- invest strategically
- react to economic cycles
- vote on city policies
- fund infrastructure
- manipulate their position
- survive financial crises
- betray temporary allies
- build massive city empires

The game should create moments like:

“I borrowed everything I had just to beat you in that auction.”

“You gave me rent protection so I would bankrupt him first.”

“We built the metro together and then you bought every station.”

“You survived with $12.”

“I thought that trade was terrible and somehow you turned it into the winning move.”

The game should generate stories.

---

# 3. DESIGN PHILOSOPHY

The game should be:

easy to understand

but

difficult to master.

New player understands:

ROLL

MOVE

BUY

BUILD

TRADE

GET RICH

Experienced player thinks about:

- liquidity
- leverage
- district control
- movement probabilities
- auctions
- future cash obligations
- contracts
- economic cycles
- strategic routes
- player psychology
- development timing
- political influence
- opponent cash reserves

Do NOT add complexity unless it creates:

- meaningful decisions
- negotiation
- risk
- interaction
- strategy
- drama
- memorable moments

Complexity for complexity's sake should be removed.

---

# 4. GAME STRUCTURE

The game runs in rounds.

Each round contains:

## 1. Planning Phase

All players can simultaneously:

- inspect properties
- develop eligible properties
- review finances
- repay debt
- prepare trade offers
- send/counter trades
- use certain cards
- review market information

Recommended duration:

20–30 seconds.

This is extremely important for games with 10–15 players.

---

## 2. Player Turns

Players take movement turns sequentially.

A normal turn should be fast.

Typical turn:

15–30 seconds.

Turn flow:

ROLL

↓

MOVE

↓

CHOOSE ROUTE IF REQUIRED

↓

LAND

↓

RESOLVE TILE

↓

END TURN

Keep individual turns focused.

---

## 3. Round Resolution

After all active players move:

- loan interest processes
- temporary effects count down
- district demand updates
- economy potentially changes
- global events resolve
- city policies update
- public projects update
- contracts process
- next round begins

---

# 5. MOVEMENT

Default movement:

two six-sided dice.

Server determines dice result.

Clients only animate the result.

Never allow client-side dice RNG to determine gameplay.

---

# 6. BRANCHING ROUTES

Nova City is NOT a simple square loop.

It is a connected city network.

Certain locations contain junctions.

At junctions players choose their route.

Possible choices might include:

safe path

high-value district

transport route

risky financial district

event-heavy route

enemy-controlled area

This adds actual movement strategy.

---

# 7. MOMENTUM

Instead of endless extra turns from doubles:

rolling doubles grants:

MOMENTUM.

Maximum:

2.

Momentum may allow one of:

- bonus movement
- reroll one die
- gain Influence
- activate a movement ability

This avoids extremely long turns.

---

# 8. NOVA CITY

Nova City should be designed as one detailed 3D metropolitan board.

Main districts:

## Harbor Row

Waterfront.

Warehouses.

Cargo cranes.

Ships.

Ferries.

Industrial buildings.

---

## Old Town

Brick buildings.

Historic architecture.

Clock tower.

Cafés.

Parks.

Older streets.

---

## Neon Mile

Entertainment district.

Huge signs.

Theaters.

Arena.

Nightlife.

Animated billboards.

---

## Innovation Park

Technology district.

Glass architecture.

Research facilities.

Data effects.

Drones.

Modern towers.

---

## Financial Core

Banks.

Corporate skyscrapers.

Market displays.

Luxury offices.

Dense high-rise architecture.

---

## Greenbelt

Parks.

Modern eco-development.

Solar panels.

Trees.

Water features.

---

## Skyline

Premium residential/commercial towers.

Luxury skyscrapers.

Rooftop gardens.

Helipad-style visual elements.

---

## Crown District

City Hall.

Prestige properties.

Government architecture.

Major landmarks.

---

# 9. TILE TYPES

Nova City can contain:

Properties

Transit Hubs

Utilities

Opportunity

Civic Spaces

Market Spaces

City Hall

Public Project Spaces

Tax/Fee Spaces

Audit/Detention

Junctions

Start/HQ

Special landmarks

---

# 10. PROPERTIES

Properties belong to districts.

A typical district contains approximately:

4 properties.

Property information:

name

district

owner

purchase price

base revenue

development level

estimated value

current district demand

specialization

debt

active contract effects

---

# 11. DISTRICT CONTROL

For a four-property district:

## Own 1

Normal ownership.

---

## Own 2

Portfolio Bonus.

Example:

+10% base revenue.

---

## Own 3

Controlling Interest.

Unlock:

development

district specialization

district bonuses

---

## Own 4

Full Control.

Unlock:

highest development

district landmark

strongest district bonus

---

This is preferable to requiring absolute ownership before anything becomes useful.

---

# 12. DEVELOPMENT

Every property has:

Level 0

Undeveloped.

Level 1

Local Development.

Level 2

Commercial Complex.

Level 3

Tower.

Level 4

Landmark.

Level 4 requires full district control.

---

# 13. DEVELOPMENT MUST CHANGE THE 3D CITY

Development is not represented by small house icons.

Properties physically transform.

Level 0:

small lot / simple building.

Level 1:

small commercial building.

Level 2:

medium development.

Level 3:

large tower.

Level 4:

unique landmark.

Early game:

small city.

Late game:

dense impressive skyline.

The board visually tells the story of the game.

---

# 14. ZONING CAPACITY

Instead of forcing equal development across a district:

district control grants development capacity.

Example:

Controlling Interest:

6 capacity.

Full Control:

12 capacity.

Player chooses where to invest.

This creates different strategies.

---

# 15. DISTRICT SPECIALIZATION

When gaining Controlling Interest, choose a specialization.

Possible categories:

Residential

Commercial

Entertainment

Technology

Industrial

Luxury

Different districts have relevant choices.

Example:

Residential:

stable revenue.

Commercial:

higher revenue but more economically sensitive.

Entertainment:

benefits from multiple visitors.

Technology:

expensive but powerful late game.

Industrial:

cheap development and utility synergy.

---

# 16. REVENUE

Property revenue should be understandable.

Example formula concept:

Base Revenue

×

Development

×

District Demand

×

Economic Modifier

×

Special Bonuses

Never hide calculations.

When player pays:

REVENUE DUE

$426

Base: $240

Tower: ×1.60

District demand: ×1.08

Economy: ×1.03

TOTAL:

$426

Players should always understand why money moved.

---

# 17. DYNAMIC DISTRICT DEMAND

Each district has a Demand Index.

Approximate range:

0.80–1.30.

Demand changes through:

economic cycles

events

public projects

policies

district activity

Demand affects:

revenue

asset value

investment attractiveness

---

# 18. ECONOMIC CYCLE

Nova City has a global economy.

States:

Boom

Expansion

Stable

Slowdown

Recession

Recovery

Effects include:

property revenue

development costs

bank interest

asset valuations

investment risk

Economic transitions should be probabilistic but sensible.

Example:

Boom is more likely eventually to move toward Stable/Slowdown than repeatedly remain Boom forever.

---

# 19. ECONOMIC FORECAST

Players should see approximate future probabilities.

Example:

CURRENT:

Expansion

NEXT ROUND FORECAST

Boom 25%

Expansion 35%

Stable 30%

Slowdown 10%

This makes economic decisions strategic rather than random.

---

# 20. GLOBAL EVENTS

Events modify Nova City.

Examples:

Technology Hiring Surge

Tourism Festival

Energy Crisis

Transit Strike

Construction Boom

Banking Panic

Waterfront Redevelopment

Consumer Spending Surge

Housing Slump

Events should influence decisions.

They should NOT randomly destroy someone's empire.

Good randomness:

changes the environment.

Bad randomness:

randomly removes half a player's assets.

---

# 21. OPPORTUNITY CARDS

Players may collect cards.

Maximum hand:

4.

Examples:

Contractor Discount

Express Transit

Rent Shield

Tax Credit

Market Rumor

Executive Travel

Economic Forecast

Temporary Protection

Cards should create tactical choices.

---

# 22. INFLUENCE

Secondary resource:

INFLUENCE.

Maximum:

5.

Earn through:

laps

civic actions

objectives

projects

selected abilities

Spend on:

city voting

certain executive abilities

limited rerolls

market information

Influence should NOT replace money.

Cash remains primary.

---

# 23. CITY HALL

Occasionally players vote on city policies.

Examples:

Development Grant

Transit Expansion

Luxury Tax

Credit Stimulus

Small Business Relief

Anti-Speculation Rules

Tourism Campaign

Rent Controls

Influence increases voting strength.

Policies affect the overall economy instead of simply attacking one specific player.

---

# 24. PUBLIC PROJECTS

Players may collectively fund major infrastructure.

Examples:

Metro Expansion

New Bridge

Stadium

Waterfront Park

Power Grid Upgrade

If successful:

the 3D city physically changes.

Example:

Metro Expansion creates visible railway/metro infrastructure.

Contributors receive:

Influence

small bonuses

revenue share

or strategic benefits.

Temporary cooperation between enemies should be possible.

---

# 25. TRANSIT HUBS

Transit ownership should affect movement.

1 hub:

normal revenue.

2 hubs:

travel between owned hubs for a fee.

3 hubs:

improved transit bonuses.

4+:

network bonus.

Transit gives strategic mobility.

---

# 26. UTILITIES

Utilities:

Energy

Water

Data

Waste

Their value can scale with city development.

Example:

more developed buildings = more electricity demand.

Utilities become more valuable as Nova City grows.

---

# 27. BANK LOANS

Allow borrowing.

Loan properties:

principal

interest rate

duration

collateral

maturity

Players may use properties as collateral.

This creates leverage strategy.

---

# 28. CREDIT RATING

Simple ratings:

AAA

AA

A

BBB

BB

B

Rating influenced by:

debt

liquidity

repayment history

net worth

Higher rating:

lower borrowing cost.

Keep the system understandable.

---

# 29. REFINANCING

Players can borrow against property equity.

Example:

Property estimated value:

$900

Existing debt:

$350

Maximum loan-to-value:

65%

Available additional borrowing calculated accordingly.

Do not overcomplicate financial mathematics.

---

# 30. PLAYER LOANS

Players can lend money to each other.

Example:

Alex lends Ben:

$400.

Ben repays:

$500 after 3 rounds.

Optional collateral:

property.

Server automatically enforces repayment.

---

# 31. TRADING

Trading is a central game mechanic.

Players can exchange:

cash

properties

future payments

revenue share

rent immunity

private loans

purchase options

---

# 32. TRADE INTERFACE

Two sides:

YOU GIVE

THEY GIVE

Add:

Cash

Property

Future Payment

Revenue Share

Rent Immunity

Loan

Purchase Option

Buttons:

SEND

COUNTER

ACCEPT

DECLINE

CANCEL

---

# 33. ADVANCED CONTRACTS

Support predefined contract clauses.

No arbitrary scripting.

Examples:

## Revenue Share

20% of property's revenue for 3 rounds.

## Rent Immunity

No rent in one district for next 2 landings.

## Future Payment

$300 now.

$200 after Round 8.

## Purchase Option

Right to buy a property for an agreed amount before expiration.

## Private Loan

Automatic repayment.

All contracts must be server-enforced.

---

# 34. MULTI-PARTY DEALS

Optional later advanced feature:

3-way trades.

Example:

Alex gives property to Ben.

Ben gives cash to Chris.

Chris gives property to Alex.

All parties must accept.

Any modification resets acceptance.

---

# 35. AUCTIONS

Declined unowned properties may enter auction.

Primary mode:

rapid open auction.

Countdown:

approximately 10 seconds.

New bid adds a small amount of time.

Players see:

property

current bid

available cash

estimated value

district context

---

# 36. SEALED AUCTIONS

Optional game rule later:

everyone submits one hidden bid.

Highest wins.

---

# 37. MARKET VALUE

Assets display estimated range.

Example:

ESTIMATED VALUE

$620–$760

Do NOT show an exact mathematically “correct” trade value.

Negotiation should remain important.

---

# 38. EXECUTIVES

Optional strategic character system.

Before game:

each player chooses one from a randomized small selection.

Each executive has:

1 passive

1 once-per-game ability.

Examples:

Developer

Financier

Negotiator

Auctioneer

Transit Baron

Builder

Analyst

Civic Leader

Restructurer

Abilities should be useful but not dominate gameplay.

---

# 39. SECRET OBJECTIVES

Optional.

Examples:

Own 3 Transit Hubs.

Trade with 4 players.

Control 3 districts.

Win 3 auctions.

Develop 6 levels.

Collect revenue from 5 opponents.

Objectives award:

Prestige

Influence

small financial bonus.

---

# 40. PRESTIGE

Prestige primarily matters in scoring-based game modes.

Earn through:

landmarks

objectives

public projects

district control

major achievements

---

# 41. FINANCIAL CRISIS

If player cannot pay:

DO NOT immediately eliminate them.

Enter:

FINANCIAL CRISIS.

Allow:

sell development

refinance

accept trades

emergency-auction properties

repay debts

declare bankruptcy

Give a short but reasonable decision window.

---

# 42. EMERGENCY SALE

Distressed player can auction assets.

Proceeds help satisfy obligations.

This creates dramatic recovery moments.

---

# 43. BANKRUPTCY

Default resolution:

secured collateral resolves first.

remaining assets auction.

creditors receive proceeds.

remaining unpaid debt written off.

player eliminated.

Avoid automatically giving one creditor a giant empire.

---

# 44. OPTIONAL RESTRUCTURING

Party mode option:

one early-game rescue.

If player bankrupts too early:

assets liquidated

debt cleared

player receives modest restart capital

one-time only

Disable in serious competitive mode.

---

# 45. GAME MODES

Do not create dozens.

Implement three strong modes first.

## CAPITAL RACE

Recommended default.

Fixed round count.

Example:

12 rounds.

Winner determined by:

Empire Value

plus Prestige.

Best for larger groups because game length is predictable.

---

## DOMINATION

Last solvent player wins.

Best for:

4–7 players.

---

## BLITZ

Fast mode.

Approximately:

30–45 minutes.

More starting cash.

Faster development.

Shorter timer.

Around:

8 rounds.

---

# 46. EMPIRE VALUE

Calculate transparently.

Cash

+

estimated property value

+

development value

+

investments

−

debt

+

Prestige adjustments where applicable

Winner calculations must not be secret.

---

# 47. LARGE PLAYER DESIGN

The game must remain enjoyable with:

10–15 players.

This is more important than backend scalability.

Solutions:

simultaneous Planning Phase

short turns

off-turn trading

off-turn inspection

off-turn chat

off-turn finance review

short animations

visible upcoming turn order

fast auctions

---

# 48. CURRENT / NEXT TURN

Always show:

CURRENT:

Alex

NEXT:

Ben

Mark

Eva

John

This lets players prepare.

---

# 49. 15-PLAYER HUD

Do NOT display fifteen huge player panels.

Use compact player strip.

Each player shows:

token icon

name

cash

connection status

current turn indicator

Click:

expand portfolio.

---

# 50. TOKEN OVERLAP

Several players may occupy same tile.

Automatically arrange tokens.

1:

center.

2:

side-by-side.

3:

triangle.

4:

square.

5+:

circular formation.

Smoothly animate formation changes.

---

# 51. CHAT

Simple global chat.

No complex moderation system required for private friends.

Allow:

messages

emoji

trade links

system events

---

# 52. REACTIONS

Quick reactions:

😂

💀

🤝

🔥

👀

📈

📉

💰

🤡

Reaction briefly appears over token.

Add cooldown.

---

# 53. VISUAL DIRECTION

Empire Circuit must feel like:

**a premium 3D video game that happens to run inside a browser.**

NOT:

a webpage with a basic board.

Visual style:

stylized

colorful

premium miniature city

high readability

clean architecture

animated world

strong district identity

Avoid photorealism.

Stylization gives:

better performance

better readability

more personality

lower asset requirements

---

# 54. THE BOARD IS THE CITY

Do not render a traditional square board with buildings next to it.

Nova City itself is the board.

Roads are movement paths.

Properties are city lots.

Junctions are intersections.

Transit is actual infrastructure.

Players travel through streets.

---

# 55. 3D CAMERA

Use perspective camera.

Default angle:

roughly 35–50° downward.

Player may:

rotate

zoom

slightly pan

select property

follow token

reset camera

Camera movement should feel polished.

---

# 56. CINEMATIC CAMERA

Automatically frame important moments.

Dice:

focus current player.

Movement:

follow token.

Landing:

frame destination.

Building:

focus property.

Auction:

focus contested asset.

Landmark:

short orbit.

Bankruptcy:

brief wider framing.

All cinematics must be:

short

interruptible

skippable where appropriate.

---

# 57. PLAYER CAMERA CONTROL ALWAYS WINS

If user manually moves camera:

cancel automatic cinematic.

Never fight camera input.

---

# 58. 3D TOKENS

Use original stylized tokens.

Examples:

sports car

rocket

robot

cat statue

spaceship

mini train

dragon

hover vehicle

Tokens have:

idle animation

movement

landing reaction

celebration

bankruptcy/departure

---

# 59. TOKEN MOVEMENT

Use spline-based path movement.

Token physically travels through roads.

At junction:

stop.

highlight routes.

player chooses.

continue movement.

Do not teleport tokens.

---

# 60. 3D DICE

Render actual 3D dice.

Animation:

lift

spin

bounce

settle

Result must match server-authoritative dice result.

Physics animation NEVER determines game result.

---

# 61. CITY LIFE

Nova City should feel alive.

Ambient elements:

cars

buses

trains

boats

drones

pedestrians represented efficiently

trees

fountains

billboards

street lighting

water

These are decorative unless explicitly tied to gameplay.

---

# 62. TRAFFIC OPTIMIZATION

Do not simulate traffic AI.

Use:

predefined spline routes

instanced vehicle meshes

low-frequency updates for distant vehicles.

---

# 63. TIME OF DAY

Allow dynamic progression.

Example:

early rounds:

afternoon.

mid game:

sunset.

late game:

night.

Night should look visually impressive.

Use:

emissive windows

street lights

signs

vehicle lights

Avoid hundreds of real dynamic lights.

---

# 64. WEATHER

Possible visual conditions:

clear

rain

fog

snow

storm clouds

wind

Weather may be tied to global events.

Keep weather primarily visual.

---

# 65. ECONOMY CHANGES THE CITY

Economic states should affect atmosphere.

Boom:

more traffic

more bright windows

construction activity

active signs

Expansion:

healthy city.

Stable:

normal.

Slowdown:

less traffic.

Recession:

reduced activity

cooler mood

some signs dim

rain possible.

Recovery:

gradual return of activity.

Do not make recession ugly.

---

# 66. EVENT VISUALIZATION

Major events should affect districts visibly.

Technology boom:

Innovation Park becomes more active.

Transit Strike:

trains stop.

Tourism Festival:

Neon Mile becomes busier.

Energy Crisis:

some decorative lighting dims.

Players should often understand an event visually before reading details.

---

# 67. PROPERTY OWNERSHIP VISUALS

Do NOT recolor whole buildings.

Use:

roof trim

property border

banners

holograms

small flags

window accents

player symbol

This keeps architecture attractive.

---

# 68. PROPERTY SELECTION

Hover/tap:

property highlights.

Nearby clutter slightly reduces emphasis.

Show compact information:

NEON PLAZA

Alex

Lv.3 Tower

Revenue:

$420

Click opens full HTML UI panel.

---

# 69. DISTRICT VIEW

When selecting a district:

highlight its properties.

Reduce emphasis elsewhere.

Possible overlays:

Ownership

Development

Demand

Do not permanently cover the city in overlays.

---

# 70. CONSTRUCTION ANIMATION

When building:

blueprint outline

foundation glow

building rises

windows activate

small particles

sound

Duration approximately:

500–900 ms.

---

# 71. LANDMARKS

Every district should eventually have unique Level 4 landmark possibilities.

Examples:

Quantum Tower

Ocean Exchange

Neon Crown Arena

Apex Bank Spire

Vertical Garden Arcology

Landmarks become visual focal points.

---

# 72. AUCTION PRESENTATION

Camera frames property.

Property receives spotlight/highlight.

Bid panel appears.

Bid changes pulse.

Final countdown:

3

2

1

Winner gets ownership effect.

Keep total sequence fast.

---

# 73. MONEY EFFECTS

Do not animate hundreds of coins.

Use:

floating values

HUD pulses

small particle travel

Example:

Alex

-$420

Ben

+$420

Very large transaction:

stronger presentation.

---

# 74. BIG MOMENT SYSTEM

Categorize events:

MINOR

MEDIUM

MAJOR

LEGENDARY

Effect intensity scales accordingly.

Example:

$40 rent:

minor.

$900 rent:

major.

landmark:

major.

winning:

legendary.

This prevents constant visual overload.

---

# 75. PUBLIC PROJECT VISUALS

Projects physically modify Nova City.

New metro:

rail appears.

Bridge:

bridge appears.

Park:

green space appears.

Stadium:

structure develops.

The board becomes the visual history of the game.

---

# 76. 2D UI + 3D WORLD

CRITICAL:

Do not make everything 3D.

Use normal React/HTML UI for:

trading

finance

chat

player information

contracts

settings

cards

auctions

tooltips

game menus

Use 3D for:

city

properties

buildings

tokens

dice

roads

weather

environment

effects

This hybrid approach is mandatory.

---

# 77. FRONTEND STACK

Use:

React

TypeScript

Vite

Zustand

Socket.IO client

Zod

Three.js

React Three Fiber

Use lightweight supporting Three.js utilities where useful.

---

# 78. BACKEND STACK

Use:

Node.js

TypeScript

Fastify

Socket.IO

Zod

There is one authoritative game session.

---

# 79. PROJECT STRUCTURE

Keep project small.

Example:

empire-circuit/

apps/

    web/

    server/

packages/

    game-core/

    shared/

    assets/

Do not create unnecessary packages.

---

# 80. GAME CORE

All rules live inside:

packages/game-core

Possible modules:

movement.ts

properties.ts

districts.ts

development.ts

economy.ts

trading.ts

contracts.ts

auctions.ts

loans.ts

events.ts

bankruptcy.ts

victory.ts

Do not import React or Three.js here.

---

# 81. GAME CORE FUNCTIONS

Examples:

calculateRevenue()

calculateEmpireValue()

calculateCreditRating()

calculateLoanCapacity()

calculateEstimatedValue()

canDevelop()

resolveLanding()

validateTrade()

executeTrade()

resolveAuction()

resolveBankruptcy()

advanceEconomy()

resolveRound()

---

# 82. ONE AUTHORITATIVE GAME STATE

Server owns:

GameState.

Clients never directly decide:

cash

ownership

dice

movement result

rent

loan validity

trade execution

auction winner

development validity

victory.

---

# 83. SERVER ACTION MODEL

Client says:

“I want to build Neon Plaza.”

Server checks:

ownership

phase

district control

cash

development capacity

blocking events

If valid:

update state.

broadcast event.

Client animates result.

---

# 84. SERVER DOES NOT RUN AT 60 FPS

Gameplay is event-driven.

Example:

ROLL request.

Server resolves roll.

Broadcast.

Clients animate.

No high-frequency authoritative game simulation is necessary.

---

# 85. 3D RENDERING IS CLIENT-SIDE

Server sends:

Alex moved:

tile 12 → tile 19.

Each browser animates locally.

The server never streams graphics.

15 players is trivial from server-performance perspective.

---

# 86. RANDOMNESS

All gameplay RNG:

server-side.

Use seeded deterministic RNG.

Includes:

dice

event order

cards

economic transitions

executive draft

objectives

Never expose future random state.

---

# 87. GAME STATE

Conceptual structure:

GameState

version

seed

status

round

phase

currentPlayerId

turnOrder

players

board

properties

districts

economy

events

contracts

loans

auction

policies

projects

settings

---

# 88. PLAYER STATE

PlayerState

id

name

token

color

symbol

connected

ready

eliminated

cash

influence

prestige

position

creditRating

debt

properties

cards

executive

objective

momentum

---

# 89. PHASE MACHINE

Use explicit phases.

Example:

LOBBY

PLANNING

TURN_START

ROLL

MOVEMENT

ROUTE_CHOICE

LANDING

PURCHASE_DECISION

AUCTION

FINANCIAL_CRISIS

TURN_END

ROUND_END

GAME_OVER

Do NOT represent state using dozens of unrelated booleans.

---

# 90. SOCKET COMMANDS

Client → server examples:

JOIN_GAME

READY

START_GAME

ROLL

CHOOSE_ROUTE

BUY_PROPERTY

DECLINE_PROPERTY

DEVELOP

SELL_DEVELOPMENT

CREATE_TRADE

COUNTER_TRADE

ACCEPT_TRADE

DECLINE_TRADE

AUCTION_BID

LOAN_REQUEST

LOAN_REPAY

USE_CARD

VOTE_POLICY

PROJECT_CONTRIBUTE

SEND_CHAT

SEND_REACTION

END_TURN

---

# 91. SERVER EVENTS

Server → client examples:

GAME_SNAPSHOT

GAME_EVENT

PLAYER_JOINED

TURN_STARTED

DICE_RESULT

TOKEN_MOVED

PROPERTY_PURCHASED

REVENUE_PAID

PROPERTY_DEVELOPED

AUCTION_UPDATED

TRADE_UPDATED

LOAN_UPDATED

ECONOMY_CHANGED

EVENT_TRIGGERED

PLAYER_CRISIS

PLAYER_BANKRUPT

GAME_OVER

---

# 92. PRIVATE INFORMATION

Secret information stays server-side.

Example:

secret objective.

Only send objective to its owner.

Do NOT send secrets to everyone and hide them using CSS.

---

# 93. RECONNECT

Browser stores:

playerId

reconnectToken

If refreshed:

client sends token.

Server restores seat.

Server sends current GameState.

Client rebuilds Nova City immediately.

Do not rely on socket IDs.

---

# 94. SIMPLE PERSISTENCE

No database initially.

Save:

current game snapshot

to JSON.

Example:

save/current-game.json

Save:

after turns

major trades

auctions

bankruptcies

round transitions.

On server restart:

offer:

RESUME GAME

START FRESH

---

# 95. HOST

First connected player may become host.

Host controls:

game settings

start

pause

resume

save

restart

skip broken/stuck turn

remove disconnected player

No complicated permission system.

---

# 96. REMATCH

After match:

REMATCH

Resets game state.

Keeps connected players.

Returns everyone to lobby.

---

# 97. PERFORMANCE TARGET

Target:

Gaming desktop:

60–120 FPS.

Normal laptop:

stable ~60 FPS.

Weak laptop:

30–60 FPS.

Modern phone/tablet:

30+ FPS.

Gameplay correctness always matters more than maximum graphics.

---

# 98. GRAPHICS QUALITY

Settings:

AUTO

LOW

MEDIUM

HIGH

ULTRA

AUTO recommended.

---

# 99. LOW QUALITY

Reduce:

shadows

particles

reflections

traffic

weather density

post-processing

render resolution.

Never remove important gameplay information.

---

# 100. HIGH QUALITY

Enable:

better shadows

more traffic

better environment

better water

more particles

higher render scale

better post-processing.

---

# 101. DYNAMIC RESOLUTION

Automatically adjust render pixel ratio.

Example safe range:

0.7–1.5.

Do not render at native devicePixelRatio 3+ by default.

Adapt slowly.

Avoid oscillating resolution.

---

# 102. INSTANCING

Use instanced meshes for repeated objects.

Examples:

trees

cars

street lamps

benches

small props

Do NOT create hundreds of unique draw calls unnecessarily.

---

# 103. MATERIALS

Reuse materials.

Use:

shared materials

texture atlases

owner accent parameters

Avoid unique materials for every object.

---

# 104. MODELS

Primary format:

GLB/glTF.

Use:

low-to-medium polygon stylized assets.

Silhouette and art direction matter more than raw polygon count.

---

# 105. MODEL COMPRESSION

Use where beneficial:

Meshopt

Draco

KTX2/Basis compressed textures.

---

# 106. TEXTURES

Reasonable sizes.

Most assets:

512–1024.

Important landmarks:

up to 2K.

Do not use 4K textures everywhere.

---

# 107. LOD

Use Level of Detail where useful.

Far buildings:

simpler geometry.

Near selected property:

better geometry.

Avoid obvious popping.

---

# 108. LIGHTING

Use efficient lighting.

Recommended:

environment lighting

one main directional light

emissive materials

selective local effects.

Avoid hundreds of dynamic lights.

---

# 109. WINDOWS

Night windows should use emissive textures/materials.

Do NOT create a light source for every window.

---

# 110. SHADOWS

Only important objects cast expensive shadows.

Buildings

tokens

landmarks.

Small decoration may use:

no shadows

or cheap approximations.

---

# 111. POST-PROCESSING

Use sparingly:

ambient occlusion

subtle bloom

color grading

limited depth-of-field during cinematics.

Readability always wins.

---

# 112. ASSET LOADING

Do NOT load everything immediately.

Load sequence:

app

↓

lobby

↓

Nova City core assets

↓

match

↓

optional decorative assets

Show real loading progress.

---

# 113. FALLBACKS

If a decorative asset fails:

show simple fallback.

A missing billboard should never break gameplay.

---

# 114. PARTICLE POOLING

Reuse:

particle effects

floating numbers

reaction bubbles

temporary highlights.

Avoid repeatedly allocating/destroying large effects.

---

# 115. MEMORY MANAGEMENT

Dispose unused:

geometry

textures

materials

render targets.

Repeated:

match → rematch → match

must not continuously increase GPU memory.

---

# 116. RENDER LOOP

Do NOT put entire React state inside frame-by-frame logic.

Per-frame code should primarily handle:

interpolation

camera

animations

visual effects.

React state updates only on meaningful game changes.

---

# 117. PRESENTATION LAYER

Architecture:

AUTHORITATIVE GAME STATE

↓

PRESENTATION SELECTORS

↓

VISUAL STATE

↓

3D RENDERER

Example:

Game:

developmentLevel = 3.

Renderer:

chooses appropriate district Tower model.

Gameplay never depends on model.

---

# 118. ANIMATION EVENT QUEUE

Server sends event:

PROPERTY_DEVELOPED.

Client presentation layer:

focus camera

play construction

swap model

play particles

play audio

update UI.

If reduced motion enabled:

immediately show final state.

---

# 119. AUDIO

Include:

dice

movement

purchase

money

construction

auction

policy vote

event

bankruptcy

victory

ambient city

traffic

water

train.

Settings:

Master

Music

Effects

Environment

Do not autoplay loud sound before user interaction.

---

# 120. ACCESSIBILITY

Support:

Reduced Motion

High Contrast

Colorblind-friendly ownership

Symbols alongside player colors

Keyboard accessible menus

Readable typography

Scalable interface

Ownership should never depend only on color.

---

# 121. POST-GAME

Show:

winner

ranking

final Empire Value

wealth graph

largest payment

largest rent

most trades

biggest auction

most debt

most properties

most development

most Influence

biggest comeback

funny awards.

Examples:

DEBT ENJOYER

DEAL ADDICT

TRANSIT GOBLIN

CASH HOARDER

LANDLORD FROM HELL

AUCTION MENACE

These make friend games memorable.

---

# 122. TESTING

Use Vitest for game rules.

Test:

ownership

purchases

revenue

development

district control

trading

contract execution

auctions

loans

interest

refinancing

bankruptcy

economic effects

round transitions

victory.

---

# 123. IMPORTANT ATOMICITY RULE

Financial/game actions must either:

fully succeed

or

change nothing.

Example:

trade execution.

Never transfer one property and then fail halfway through.

---

# 124. STATE VERSIONING

Game state has:

version.

Commands can include expected version where necessary.

This prevents:

double purchases

duplicate trades

auction race issues

stale actions.

---

# 125. SIMULATION TESTING

Eventually create simple headless bot simulation.

Run hundreds/thousands of games.

Measure:

game duration

first-player advantage

bankruptcy timing

district strength

executive strength

economy stability

average wealth

win distribution.

This is for balancing, not player-facing AI initially.

---

# 126. DEVELOPMENT DEBUG PANEL

Development only.

Allow:

Force Dice

Add Cash

Remove Cash

Teleport

Give Property

Develop Property

Set Economy

Trigger Event

Advance Turn

Create Debt

Force Bankruptcy

Build Landmark

Extremely useful for testing.

Never expose in normal production interface.

---

# 127. CODE QUALITY

Use:

strict TypeScript.

Avoid:

any.

Validate:

socket payloads with Zod.

Keep functions small.

Do not create giant React components.

Do not create one enormous game engine file.

Keep business rules independent of UI.

Run:

lint

typecheck

tests

build

regularly.

---

# 128. DO NOT OVERENGINEER

Never add architecture because it might theoretically be required for millions of users.

Expected scale:

15 friends.

One game.

One server.

One board.

Optimize for this reality.

---

# 129. IMPLEMENTATION ORDER

CRITICAL:

Do NOT attempt the entire specification in one giant implementation.

Build it in working milestones.

Each milestone must remain playable.

---

# MILESTONE 1

## Core playable game

Implement:

single server

join with display name

simple lobby

ready status

host start

Nova City placeholder 3D board

4–15 players

turn order

server-authoritative dice

3D dice

token movement

route junctions

properties

buying

ownership

basic revenue

district control

basic development

bankruptcy

Capital Race victory

basic HUD

chat

reactions

reconnect

JSON save

rematch.

Visual assets can initially use procedural/basic geometry.

But the final 3D architecture must already exist.

---

# MILESTONE 2

## Polished social gameplay

Implement:

auctions

full trade interface

counteroffers

multiple property trading

fast turn UX

player inspection

better animations

better camera

better money feedback

post-game stats.

---

# MILESTONE 3

## Advanced economy

Implement:

dynamic district demand

economic cycle

market news

bank loans

credit rating

refinancing

estimated market value.

---

# MILESTONE 4

## Advanced social strategy

Implement:

Influence

City Hall

policies

public projects

executives

secret objectives

Prestige.

---

# MILESTONE 5

## Contracts

Implement:

future payments

rent immunity

revenue sharing

private loans

purchase options

optional multi-party trading.

---

# MILESTONE 6

## Premium Nova City visuals

Replace placeholder geometry with polished stylized assets.

Add:

water

traffic

trains

boats

district architecture

landmarks

animated signs

dynamic time-of-day

economic atmosphere

weather

public project construction

advanced particles

sound design

quality scaling.

---

# MILESTONE 7

## Balance and polish

Add:

Blitz

Domination

optional restructuring

better economy balancing

simulation testing

performance tuning

better mobile support

final accessibility polish.

---

# 130. FIRST CODEX TASK

When beginning this project, DO NOT implement all milestones.

Start with:

# MILESTONE 1 ONLY.

First:

create architecture.

Then:

make one full playable loop.

Required end-to-end flow:

Player opens website.

↓

enters name.

↓

selects token.

↓

joins lobby.

↓

other friends join.

↓

players ready.

↓

host starts.

↓

Nova City loads.

↓

turn order selected.

↓

player rolls 3D dice.

↓

server determines result.

↓

token animates through city.

↓

player chooses route if junction occurs.

↓

player lands on property.

↓

player buys property.

↓

everyone sees ownership update.

↓

another player eventually lands there.

↓

server calculates payment.

↓

cash transfers.

↓

player gains district control.

↓

player develops property.

↓

3D building transforms.

↓

someone refreshes browser.

↓

they reconnect automatically.

↓

game continues.

↓

Capital Race reaches final round.

↓

winner determined.

↓

post-game results appear.

↓

players press REMATCH.

↓

same connected friends return to lobby.

This entire loop must work reliably before advanced systems are added.

---

# 131. VISUAL QUALITY BAR

Even Milestone 1 should NOT feel like a spreadsheet.

It should already have:

3D board

3D dice

animated tokens

smooth camera

property highlights

buildings

ownership accents

good typography

responsive UI

basic sound

money animation

smooth transitions.

---

# 132. FINAL EXPERIENCE TARGET

Opening Empire Circuit should feel like launching an actual game.

You enter your name.

Choose a ridiculous token.

Your friends appear.

The match begins.

The camera sweeps over Nova City.

Dice bounce onto the board.

Cars move through the streets.

Your token races through downtown.

You buy a waterfront property.

A building physically appears.

Your friend lands there.

Money flies into your balance.

Someone starts an auction.

Everybody begins screaming over Discord.

The economy crashes.

Rain starts over Nova City.

Someone refinances half their empire.

Three players temporarily cooperate to build the metro.

One player betrays another through a trade.

Skyscrapers appear.

Districts change ownership.

Night falls.

Neon Mile lights up.

Someone survives bankruptcy with almost no cash.

A massive final auction changes the game.

By the final round, Nova City looks completely different from how it looked at the beginning.

The winner is revealed.

Then everybody immediately wants:

REMATCH.

That is the target.

---

# 133. FINAL DEVELOPMENT PRINCIPLE

When choosing between:

more infrastructure

or

more game quality,

choose game quality.

When choosing between:

more mechanics

or

making existing mechanics feel incredible,

choose polish first.

When choosing between:

photorealism

or

beautiful performance-friendly stylization,

choose stylization.

When choosing between:

server complexity

or

simple deterministic rules,

choose simplicity.

The project should be:

**an extremely polished private 3D economic strategy party game for up to 15 friends, running entirely in the browser, centered around one evolving living city.**

Build that.

Do not build unnecessary things around it.
