import {
  useEffect,
  useCallback,
  useState,
  Component,
  Suspense,
  lazy,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
const City = lazy(() => import("./City"));
import { useGame } from "./store";
import { empire, revenue } from "../../../packages/game-core/index";
import { districts, character } from "../../../packages/shared/index";
import { money } from "./components/TurnPanel";
import Icon from "./components/Icon";
import HostControls from "./components/HostControls";
import PlayerList from "./components/PlayerList";
import GameGuide from "./components/GameGuide";
import PlayerProfile from "./components/PlayerProfile";
import Overview from "./components/Overview";
import PropertyPanel from "./components/PropertyPanel";
import SimulationControls from "./components/SimulationControls";
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
  const [inspected, setInspected] = useState<string | null>(null);
  const [help, setHelp] = useState(false),
    [mobile, setMobile] = useState(true),
    [sound, setSound] = useState(false);
  const me = s.players.find((p) => p.id === id),
    host = s.host === id;
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(t);
    }
  }, [error, setError]);
  const select = useCallback((n: number) => {
    setSelected(n);
    setTab("Property");
    setMobile(true);
  }, []);

  return (
    <main>
      <header>
        <a className="brand" href="/" aria-label="Empire Circuit home">
          <span className="brand-mark">E</span>
          <span>Empire Circuit</span>
        </a>
        <span className="connection-status">
          <i className={connected ? "online" : "offline"} />
          {connected ? "Connected" : "Reconnecting…"}
        </span>
        <button onClick={() => setHelp(true)}>How to play</button>
      </header>
      <section className="game-layout">
        <aside className={"left-panel " + (!mobile ? "mobile-hide" : "")}>
          <div className="world-title">
            <h1>Nova City</h1>
            <p>Halloween edition</p>
          </div>
          <nav aria-label="Game panels">
            {["Overview", "Portfolio", "City guide", "Activity", "Players"].map(
              (t) => (
                <button
                  key={t}
                  className={
                    (tab === t ? "active " : "") +
                    (t === "Players" ? "mobile-nav" : "")
                  }
                  onClick={() => setTab(t)}
                >
                  {
                    {
                      Overview: "Play",
                      Portfolio: "My properties",
                      "City guide": "Properties",
                      Activity: "Game log",
                      Players: "Players",
                    }[t]
                  }
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
                onPortfolio={() => setTab("Portfolio")}
              />
            )}
            {tab === "Players" && (
              <div className="mobile-talk">
                <h2>Players</h2>
                <PlayerList s={s} id={id} onSelect={setInspected} />
                <SimulationControls s={s} host={host} />
                <HostControls s={s} host={host} />
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
                <h2>My properties</h2>
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
                        <h3>No properties yet</h3>
                        <p>Buy a property when you land on it.</p>
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
                <h2>Properties</h2>
                <p>
                  Select any location here or click a building in the city to
                  inspect ownership, development, and revenue.
                </p>
                {districts.map((d, i) => (
                  <details key={d.name}>
                    <summary>
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
                          <Icon name="arrow" />
                        </button>
                      ))}
                  </details>
                ))}
              </>
            )}
            {tab === "Activity" && (
              <>
                <h2>Game log</h2>
                {s.log.length ? (
                  s.log.map((l) => (
                    <div className="activity" key={l.id}>
                      <p>{l.text}</p>
                    </div>
                  ))
                ) : (
                  <p>Your first chapter starts when you join the table.</p>
                )}
              </>
            )}
          </div>
        </aside>
        <section className="city-area" aria-label="Interactive 3D Nova City">
          <div className="city-top">
            <span className="round-pill">
              {s.phase === "LOBBY"
                ? "Waiting for players"
                : `Round ${s.round} of 12`}
            </span>
            <span className="phase-pill">
              {s.paused
                ? "Paused"
                : {
                    LOBBY: "Choose a character",
                    PLANNING: "Time to build",
                    ROLL: "Ready to roll",
                    ROUTE_CHOICE: "Choosing a route",
                    PURCHASE_DECISION: "Property for sale",
                    TURN_END: "Turn complete",
                    FINANCIAL_CRISIS: "Cash shortfall",
                    GAME_OVER: "Game over",
                  }[s.phase]}
            </span>
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
                localPlayerId={id}
                onPlayerSelect={setInspected}
              />
            </Suspense>
          </SceneBoundary>
          <div className="camera-toolbar">
            <button
              onClick={() => setReset(reset + 1)}
              title="Reset camera"
              aria-label="Reset camera"
            >
              <Icon name="reset" /> Reset view
            </button>
            <select
              aria-label="Graphics quality"
              title="Graphics quality"
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
              <Icon name={sound ? "sound" : "mute"} />
              {sound ? "Sound on" : "Sound off"}
            </button>
            <span>Drag to rotate. Scroll to zoom.</span>
          </div>
          <button
            className="mobile-toggle"
            aria-label={mobile ? "Show city" : "Show controls"}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? "City" : "Controls"}
          </button>
          <button
            className="event-ticker"
            aria-label="Open game log"
            onClick={() => {
              setTab("Activity");
              setMobile(true);
            }}
          >
            {s.log[0]?.text || "Join the game to start."}
          </button>
        </section>
        <aside className="right-panel">
          <div className="table-heading">
            <h2>Players</h2>
            <span>{s.players.length} / 15</span>
          </div>
          <PlayerList s={s} id={id} onSelect={setInspected} />
          {me && (
            <div className="your-balance">
              <small>Your cash</small>
              <strong key={me.cash} className="cash-pulse">
                {money(me.cash)}
              </strong>
              <div>
                <span>{character(me.token).name}</span>
              </div>
            </div>
          )}
          {s.phase !== "LOBBY" && <SimulationControls s={s} host={host} />}
          <HostControls s={s} host={host} />
        </aside>
      </section>
      {error && (
        <div className="toast" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <Icon name="close" />
          </button>
        </div>
      )}
      {inspected && s.players.find((p) => p.id === inspected) && (
        <PlayerProfile
          player={s.players.find((p) => p.id === inspected)!}
          s={s}
          onClose={() => setInspected(null)}
          onProperty={select}
        />
      )}
      {help && <GameGuide onClose={() => setHelp(false)} />}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
