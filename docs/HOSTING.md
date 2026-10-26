# Hosting ZMONOPOLY for friends

Use **one always-on Node server with persistent storage**, in a region close to your group. The 3D city renders on each player's computer: buying a server GPU will not improve their frame rate.

My default recommendation is a small Linux VPS with **2 vCPU and 2 GB RAM**, Docker Compose and Caddy. This is a starting size for one table of at most 15 players, not a measured capacity guarantee. Hetzner, DigitalOcean and similar VPS providers are suitable; choose by region and current price. The supplied stack serves HTTPS, forwards WebSockets, restarts on failure and retains the game in a named volume.

If you prefer a managed service, Railway or Render can run the Dockerfile. Use a paid always-on service, **one instance**, and a persistent volume mounted at `/data`. Set `SAVE_DIR=/data`; let the provider set `PORT`. Confirm WebSocket support and persistent-volume availability for your chosen plan. GitHub Pages or a static-only deployment cannot run this game server. No accounts, database or Redis service are required by the game.

## VPS launch

1. Create a current Ubuntu or Debian VPS and install Docker Engine with its Compose plugin using [Docker's official instructions](https://docs.docker.com/engine/install/).
2. Point a domain's DNS A record at the server. Add an AAAA record only if IPv6 reaches this server. Allow incoming TCP 80 and 443. Keep the game service's port 3001 private; Compose only exposes it to Caddy.
3. Check out the source and start the supplied stack:

```sh
git clone https://github.com/zogzi/Monopoly.git ZMONOPOLY
cd ZMONOPOLY
cp deploy/.env.example .env
```

Edit `.env` and replace `game.example.com` with your real domain, then:

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 game caddy
```

Open your HTTPS domain. `/api/health` should report `ok: true`, `game: ZMONOPOLY` and the release version. Join, add at least three bots, ready up and start. Share the same address with friends.

Caddy obtains a real certificate only when public DNS and ports reach this server. Local configuration checks do not prove that your domain, firewall or public TLS is configured. This repository does not provision a paid server or publish a public address automatically.

## Update without losing the game

```sh
git pull --ff-only
docker compose up -d --build
```

The `game-data` volume survives container replacement. The old process disconnects clients and saves before exiting. Browsers reconnect with their existing seat tokens; a restored active match starts paused and the host clicks Resume. Avoid updates during an important decision. Never run multiple game instances against the same save directory.

## Back up and restore

Save a private copy outside the repository and keep another copy off the VPS. It contains reconnect credentials; do not post it in Discord or commit it.

```sh
umask 077
mkdir -p backups
docker compose exec -T game node -e "process.stdout.write(require('fs').readFileSync('/data/current-game.json'))" > "backups/game-$(date -u +%Y%m%d-%H%M%S).json"
```

The server replaces `current-game.json` atomically, so this reads a complete snapshot. Backups are manual until you schedule and verify them on your own host. To restore a chosen backup, stop the game first:

```sh
docker compose stop game
docker compose run --rm -T --no-deps game node -e "require('fs').writeFileSync('/data/current-game.json',require('fs').readFileSync(0),{mode:0o600})" < backups/YOUR-BACKUP.json
docker compose up -d game
```

Do not use `docker compose down -v` during a normal update: `-v` deletes the retained game and certificate volumes.

## Keep it private

The game has seat reconnection, not an invitation/password system. Anyone who can reach an open lobby can take a seat. For a friends-only public domain, put a shared password in Caddy's `basic_auth` configuration, or use a private network such as Tailscale. This does not require adding game accounts. See [Caddy reverse proxy](https://caddyserver.com/docs/quick-starts/reverse-proxy) and [basic authentication](https://caddyserver.com/docs/caddyfile/directives/basic_auth).

## Performance and troubleshooting

- Use **AUTO** graphics first. LOW reduces resolution and effects on slower computers. Leave hardware acceleration enabled. The cloud preview uses software rendering and cannot establish your PC's FPS.
- Use Capital Race or Blitz for your first session. Domination has a visible 30-round safety limit; human match duration depends on how quickly people decide.
- If the site loads but players cannot connect, check Caddy/provider WebSocket forwarding. Both the page and Socket.IO use the same host and port.
- If an active game disappears after a restart, check the `/data` volume and `SAVE_DIR` before starting a new game.
- The browser assets are precompressed and hashed assets use immutable caching. HTML revalidates so a new release can load. The production runtime is compiled JavaScript and does not need `tsx` or other development dependencies.
