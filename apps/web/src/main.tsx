import {
  useEffect,
  useState,
  Component,
  Suspense,
  lazy,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
const City = lazy(() => import("./City"));
import { command, useGame } from "./store";
import { empire, revenue } from "../../../packages/game-core/index";
import { districts } from "../../../packages/shared/index";
import { money } from "./components/TurnPanel";
import GameGuide from "./components/GameGuide";
import Overview, { tokenIcons } from "./components/Overview";
import PropertyPanel from "./components/PropertyPanel";
import TableTalk from "./components/TableTalk";
import "./style.css";
import "./audio";
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="no-webgl">
        <h2>Nova City needs WebGL</h2>
        <p>
          Enable hardware acceleration to explore the 3D city. Game controls
          remain available.
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const { state: s, id, connected, error, setError } = useGame();
  const [tab, setTab] = useState("Overview"),
    [selected, setSelected] = useState<number | null>(null),
    [quality, setQuality] = useState("AUTO"),
    [reset, setReset] = useState(0);
  const [now, setNow] = useState(Date.now()),
    [help, setHelp] = useState(false),
    [mobile, setMobile] = useState(true),
    [sound, setSound] = useState(false);
  const me = s.players.find((p) => p.id === id),
    current = s.players[s.current],
    host = s.host === id;
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(t);
    }
  }, [error, setError]);
  const remaining = Math.max(0, Math.ceil((s.deadline - now) / 1000));
  const select = (n: number) => {
    setSelected(n);
    setTab("Property");
    setMobile(true);
  };

  return (
    <main>
      <header>
        <a className="brand" href="/" aria-label="Empire Circuit home">
          <span className="brand-mark">
            E<span>╱</span>
          </span>
          <div>
            EMPIRE <b>CIRCUIT</b>
            <small>THE CITY IS YOURS TO TAKE</small>
          </div>
        </a>
        <div className="session">
          <i className={connected ? "online" : "offline"} />
          {connected ? "PRIVATE TABLE" : "RECONNECTING"}
          <span> / </span>NOVA CITY
        </div>
        <div className="header-actions">
          <button onClick={() => setHelp(!help)}>
            How to play <span>↗</span>
          </button>
          <span className="avatar" style={{ color: me?.color }}>
            {me?.name.slice(0, 1).toUpperCase() || "◇"}
          </span>
        </div>
      </header>
      <section className="game-layout">
        <aside className={"left-panel " + (!mobile ? "mobile-hide" : "")}>
          <div className="world-title">
            <span className="eyebrow">ONE CITY. ENDLESS POSSIBILITIES.</span>
            <h1>
              Nova City<span>↗</span>
            </h1>
            <div className="world-meta">
              <span>EST. 2026</span>
              <span>8 DISTRICTS · 44 LOCATIONS</span>
            </div>
          </div>
          <nav aria-label="Game panels">
            {["Overview", "Portfolio", "City guide", "Activity", "Talk"].map(
              (t) => (
                <button
                  key={t}
                  className={
                    (tab === t ? "active " : "") +
                    (t === "Talk" ? "mobile-nav" : "")
                  }
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ),
            )}
          </nav>
          <div className="panel-scroll">
            {tab === "Overview" && (
              <Overview
                s={s}
                me={me}
                connected={connected}
                remaining={remaining}
                onPortfolio={() => setTab("Portfolio")}
              />
            )}
            {tab === "Talk" && (
              <div className="mobile-talk">
                <h2>The table.</h2>
                {s.players.map((p) => (
                  <div className="stat" key={p.id}>
                    <span>
                      {p.name}
                      {p.id === s.players[s.current]?.id ? " · current" : ""}
                    </span>
                    <b>
                      {money(p.cash)} {p.connected ? "●" : "○"}
                    </b>
                  </div>
                ))}
                <TableTalk s={s} joined={!!me} />
              </div>
            )}
            {tab === "Property" && selected !== null && (
              <PropertyPanel
                s={s}
                tile={s.board[selected]}
                id={id}
                onBack={() => setTab("Overview")}
              />
            )}
            {tab === "Portfolio" && (
              <>
                <span className="eyebrow">YOUR CORNER OF THE CITY</span>
                <h2>Built to grow.</h2>
                {me ? (
                  <>
                    <div className="metric">
                      {money(empire(s, me))}
                      <small> empire value</small>
                    </div>
                    <p>
                      Cash + property prices + development investment. Earn a
                      10% revenue bonus with two properties in a district.
                    </p>
                    {s.board
                      .filter((t) => t.owner === id)
                      .map((t) => (
                        <button
                          className="asset"
                          key={t.id}
                          onClick={() => select(t.id)}
                        >
                          <i
                            style={{ background: districts[t.district].color }}
                          />
                          <span>
                            {t.name}
                            <small>
                              {districts[t.district].name} · Level {t.level}
                            </small>
                          </span>
                          <b>
                            {money(revenue(s, t))}
                            <small>revenue</small>
                          </b>
                        </button>
                      ))}
                    {!s.board.some((t) => t.owner === id) && (
                      <div className="empty">
                        ◇<h3>Your first acquisition awaits.</h3>
                        <p>
                          Land on an available property to begin your portfolio.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p>Join the table to build your portfolio.</p>
                )}
              </>
            )}
            {tab === "City guide" && (
              <>
                <span className="eyebrow">GET TO KNOW THE NEIGHBORHOOD</span>
                <h2>
                  Eight districts.
                  <br />
                  One great city.
                </h2>
                <p>
                  Select any location here or click a building in the city to
                  inspect ownership, development, and revenue.
                </p>
                {districts.map((d, i) => (
                  <details key={d.name}>
                    <summary style={{ color: d.color }}>
                      {d.name}
                      <span>4 properties</span>
                    </summary>
                    {s.board
                      .filter((t) => t.district === i)
                      .map((t) => (
                        <button
                          className="asset"
                          onClick={() => select(t.id)}
                          key={t.id}
                        >
                          <span>
                            {t.name}
                            <small>
                              {s.players.find((p) => p.id === t.owner)?.name ||
                                "City-owned"}{" "}
                              · {t.type}
                            </small>
                          </span>
                          <b>↗</b>
                        </button>
                      ))}
                  </details>
                ))}
              </>
            )}
            {tab === "Activity" && (
              <>
                <span className="eyebrow">THE STORY SO FAR</span>
                <h2>City wire.</h2>
                {s.log.length ? (
                  s.log.map((l) => (
                    <div className="activity" key={l.id}>
                      <small>EVENT {l.id.toString().padStart(3, "0")}</small>
                      <p>{l.text}</p>
                    </div>
                  ))
                ) : (
                  <p>Your first chapter starts when you join the table.</p>
                )}
              </>
            )}
          </div>
          <div className="panel-bottom">
            <span>◇</span> Fortune favors the strategic.
            <button onClick={() => setHelp(true)} aria-label="Open rules">
              ?
            </button>
          </div>
        </aside>
        <section className="city-area" aria-label="Interactive 3D Nova City">
          <div className="city-top">
            <div className="round-pill">
              <span className="live-dot" />{" "}
              {s.phase === "LOBBY"
                ? "PRE-GAME"
                : `ROUND ${s.round.toString().padStart(2, "0")}`}
              <span>/ 12</span>
            </div>
            <div className="economy-pill">
              <span>◈</span>
              <div>
                <small>CAPITAL RACE</small>
                <b>
                  {s.phase === "LOBBY"
                    ? "The city awaits"
                    : s.phase.replaceAll("_", " ")}
                </b>
              </div>
            </div>
          </div>
          <SceneBoundary>
            <Suspense
              fallback={
                <div className="no-webgl">
                  <h2>Building Nova City…</h2>
                </div>
              }
            >
              <City
                state={s}
                selected={selected}
                onSelect={select}
                quality={quality}
                reset={reset}
              />
            </Suspense>
          </SceneBoundary>
          <div className="city-caption">
            <span>NOVA CITY</span>
            <small>EVERY EMPIRE STARTS WITH A MOVE.</small>
          </div>
          <div className="camera-toolbar">
            <button
              onClick={() => setReset(reset + 1)}
              title="Reset camera"
              aria-label="Reset camera"
            >
              ⌖
            </button>
            <select
              aria-label="Graphics quality"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              {["AUTO", "LOW", "MEDIUM", "HIGH"].map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
            <button
              aria-label={sound ? "Mute sound" : "Enable sound"}
              aria-pressed={sound}
              onClick={() => {
                setSound(!sound);
                window.dispatchEvent(
                  new CustomEvent("empire-sound", { detail: !sound }),
                );
              }}
            >
              {sound ? "♪" : "♩"}
            </button>
            <span>DRAG TO ORBIT · SCROLL TO ZOOM</span>
          </div>
          <button className="mobile-toggle" onClick={() => setMobile(!mobile)}>
            {mobile ? "Explore city ↗" : "Open controls ☰"}
          </button>
          <div className="event-ticker">
            <span>◉ CITY WIRE</span>
            <p>
              {s.log[0]?.text ||
                "Welcome to Nova City. The next great empire could be yours."}
            </p>
            <small>LIVE</small>
          </div>
        </section>
        <aside className="right-panel">
          <div className="table-heading">
            <span>THE TABLE</span>
            <small>{s.players.length.toString().padStart(2, "0")} / 15</small>
          </div>
          <div className="players">
            {s.players.map((p) => (
              <button
                key={p.id}
                className={
                  "player " +
                  (p.id === current?.id && s.phase !== "LOBBY" ? "current" : "")
                }
                onClick={() => {
                  select(
                    s.board.find((t) => t.owner === p.id)?.id ?? p.position,
                  );
                }}
              >
                <span className="player-token" style={{ color: p.color }}>
                  {tokenIcons[p.token]}
                </span>
                <div>
                  <b>
                    {p.name}
                    {p.id === id ? " (you)" : ""}
                  </b>
                  <small>
                    {p.eliminated
                      ? "BANKRUPT"
                      : s.phase === "LOBBY"
                        ? p.ready
                          ? "READY"
                          : "GETTING SETTLED"
                        : money(p.cash)}
                  </small>
                </div>
                <i className={p.connected ? "online" : "offline"} />
              </button>
            ))}
            {s.players.length === 0 && (
              <div className="empty-seat">
                <span>◇</span>
                <p>
                  The table is open.
                  <br />
                  Be the first to arrive.
                </p>
              </div>
            )}
          </div>
          {me && (
            <div className="your-balance">
              <small>YOUR AVAILABLE CAPITAL</small>
              <strong key={me.cash} className="cash-pulse">
                {money(me.cash)}
              </strong>
              <div>
                <span>
                  {tokenIcons[me.token]} {me.token}
                </span>
                <span>◆ {me.momentum}/2 momentum</span>
              </div>
            </div>
          )}
          <TableTalk s={s} joined={!!me} />
          {host && s.phase !== "LOBBY" && (
            <div className="host-controls">
              <button onClick={() => command(s.paused ? "RESUME" : "PAUSE")}>
                {s.paused ? "Resume" : "Pause"}
              </button>
              <button onClick={() => command("SKIP")}>Skip turn</button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Return everyone to the lobby and discard this match?",
                    )
                  )
                    command("RESTART");
                }}
              >
                Reset
              </button>
            </div>
          )}
        </aside>
      </section>
      <footer>
        <span>
          <i className={connected ? "online" : "offline"} />
          {connected ? "CONNECTED TO NOVA CITY" : "CONNECTION LOST · RETRYING"}
        </span>
        <span>
          EMPIRE CIRCUIT <b> / </b> MILESTONE 01
        </span>
        <button onClick={() => setHelp(true)}>Rules & game guide ↗</button>
      </footer>
      {error && (
        <div className="toast" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {help && <GameGuide onClose={() => setHelp(false)} />}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
