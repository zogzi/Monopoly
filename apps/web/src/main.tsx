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
const RollPresentation = lazy(() => import("./components/RollPresentation"));
const City = lazy(() => import("./City"));
import { GAME_NAME, GAME_VERSION } from "../../../packages/shared/version";
import { type ServiceId } from "../../../packages/shared/content";
import CityService from "./components/CityService";
import Tactics from "./components/Tactics";
import Market from "./components/Market";
import MarketFeedback from "./components/MarketFeedback";
import TurnStatus from "./components/TurnStatus";
import ArrestNotice from "./components/ArrestNotice";
import CityMap from "./components/CityMap";
import type { FocusRequest } from "./city/navigation";
import { modes } from "../../../packages/shared/economy";
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
import "./navigation.css";
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
document.title = `${GAME_NAME} v${GAME_VERSION}`;
const searchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
function App() {
  const { state: s, id, connected, error, setError } = useGame();
  const [tab, setTab] = useState("Overview"),
    [selected, setSelected] = useState<number | null>(null),
    [quality, setQuality] = useState("AUTO"),
    [reset, setReset] = useState(0);
  const [service, setService] = useState<ServiceId | null>(null);
  const [market, setMarket] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const [highlightMine, setHighlightMine] = useState(true),
    [citySearch, setCitySearch] = useState("");
  const [inspected, setInspected] = useState<string | null>(null);
  const [help, setHelp] = useState(false),
    [sound, setSound] = useState(false),
    [storm, setStorm] = useState(true);
  const me = s.players.find((p) => p.id === id),
    host = s.host === id;
  useEffect(() => {
    const update = (e: Event) => setSound((e as CustomEvent<boolean>).detail);
    window.addEventListener("zmonopoly-sound", update);
    return () => window.removeEventListener("zmonopoly-sound", update);
  }, []);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(t);
    }
  }, [error, setError]);
  const select = useCallback((n: number) => {
    setSelected(n);
    setTab("Property");
    setFocus({ tile: n, request: Date.now(), property: true });
  }, []);
  const openPlay = useCallback(() => {
    setTab("Overview");
    setMarket(false);
    setHelp(false);
    setService(null);
    setInspected(null);
  }, []);
  const showPrison = useCallback(() => {
    openPlay();
    setFocus({ tile: 0, request: Date.now(), location: "prison" });
  }, [openPlay]);

  const query = searchText(citySearch),
    matchingPlaces = s.board.filter((t) =>
      searchText(
        `${t.name} ${districts[t.district].name} ${s.players.find((p) => p.id === t.owner)?.name ?? ""}`,
      ).includes(query),
    ),
    matchingPrison =
      !!query && "ravenwatch prison jail custody".includes(query);
  return (
    <main>
      <section className="game-layout">
        <aside className="left-panel">
          {me && !connected && (
            <div className="connection-warning" role="alert">
              Connection lost. Reconnecting…
            </div>
          )}
          <TurnStatus s={s} me={me} onPlay={openPlay} onPrison={showPrison} />
          <nav aria-label="Game panels">
            {["Overview", "Portfolio", "City guide", "Activity"].map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
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
            ))}
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
                      Cash + properties + development + receivables − debt. Earn
                      a 10% revenue bonus with two properties in a district.
                    </p>
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={highlightMine}
                        onChange={(e) => setHighlightMine(e.target.checked)}
                      />
                      Highlight my properties on the map
                    </label>
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
                <CityMap
                  s={s}
                  id={id}
                  onSelect={select}
                  onPrison={showPrison}
                />
                <label>
                  Find a place
                  <input
                    aria-label="Find a place"
                    value={citySearch}
                    placeholder="Name, district or owner"
                    onChange={(e) => setCitySearch(e.target.value)}
                  />
                </label>
                {citySearch.trim() ? (
                  <div className="place-results">
                    {matchingPlaces.map((t) => (
                      <button
                        key={t.id}
                        className="asset"
                        onClick={() => select(t.id)}
                      >
                        <span>
                          {t.name}
                          <small>
                            {districts[t.district].name}
                            {id && t.owner === id ? " · Yours" : ""}
                          </small>
                        </span>
                      </button>
                    ))}
                    {matchingPlaces.length === 0 && !matchingPrison && (
                      <p>No matching places.</p>
                    )}
                    {matchingPrison && (
                      <button className="asset" onClick={showPrison}>
                        Ravenwatch Prison
                      </button>
                    )}
                  </div>
                ) : (
                  districts.map((d, i) => (
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
                                {s.players.find((p) => p.id === t.owner)
                                  ?.name || "City-owned"}{" "}
                                · {t.type}
                              </small>
                            </span>
                            <Icon name="arrow" />
                          </button>
                        ))}
                    </details>
                  ))
                )}
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
          <div className="sidebar-tools">
            <button onClick={() => setHelp(true)}>How to play</button>
            <span className="game-version" aria-label="Game version">
              v{GAME_VERSION}
            </span>
          </div>
        </aside>
        <section className="city-area" aria-label="Interactive 3D Nova City">
          <div className="city-top">
            <span className="round-pill">
              {s.phase === "LOBBY"
                ? "Waiting for players"
                : `Round ${s.round}${modes[s.mode].rounds ? ` of ${modes[s.mode].rounds}` : " · Domination"}`}
            </span>
            <span className="phase-pill">
              {s.paused
                ? "Paused"
                : (!["LOBBY", "PLANNING", "GAME_OVER", "AUCTION"].includes(
                    s.phase,
                  )
                    ? `${s.players[s.current]?.id === id ? "Your turn" : s.players[s.current]?.name + "’s turn"} · `
                    : "") +
                  {
                    LOBBY: "Choose a character",
                    PLANNING: "Time to build",
                    ROLL: "Ready to roll",
                    ROUTE_CHOICE: "Choosing a route",
                    PURCHASE_DECISION: "Property for sale",
                    TURN_END: "Turn complete",
                    ENCOUNTER: "Choose a surprise",
                    DETENTION: "In custody",
                    FINANCIAL_CRISIS: "Cash shortfall",
                    AUCTION: "Live auction · everyone can bid",
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
                suspended={
                  rolling || market || help || !!service || !!inspected
                }
                state={s}
                selected={selected}
                onSelect={select}
                quality={quality}
                reset={reset}
                localPlayerId={id}
                onPlayerSelect={setInspected}
                storm={storm}
                focus={focus}
                onServiceSelect={setService}
                highlightMine={highlightMine}
              />
            </Suspense>
          </SceneBoundary>
          <div className="camera-toolbar">
            {me && (
              <button
                onClick={() =>
                  setFocus({
                    tile: me.position,
                    request: Date.now(),
                    playerId: me.id,
                  })
                }
              >
                Find me
              </button>
            )}
            {me && (
              <button
                disabled={!s.board.some((t) => t.owner === id)}
                onClick={() => {
                  setHighlightMine(true);
                  setTab("Portfolio");
                  setFocus(null);
                  setReset((v) => v + 1);
                }}
              >
                Find my properties
              </button>
            )}
            {!["LOBBY", "PLANNING", "GAME_OVER", "AUCTION"].includes(
              s.phase,
            ) && (
              <button
                onClick={() =>
                  setFocus({
                    tile: s.players[s.current].position,
                    request: Date.now(),
                    playerId: s.players[s.current].id,
                  })
                }
              >
                Find current player
              </button>
            )}
            {s.auction && (
              <button
                onClick={() =>
                  setFocus({ tile: s.auction!.tile, request: Date.now() })
                }
              >
                Find auction
              </button>
            )}
            <button
              onClick={() => {
                setFocus(null);
                setReset(reset + 1);
              }}
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
                  new CustomEvent("zmonopoly-sound", { detail: !sound }),
                );
              }}
            >
              <Icon name={sound ? "sound" : "mute"} />
              {sound ? "Sound on" : "Sound off"}
            </button>
            <button
              className="weather-toggle"
              aria-pressed={storm}
              onClick={() => setStorm(!storm)}
            >
              {storm ? "Storm on" : "Storm off"}
            </button>
          </div>
          {s.lastRoll && (
            <div className="last-roll-summary" aria-live="polite">
              Last roll:{" "}
              <b>
                {s.players.find((p) => p.id === s.lastRoll!.playerId)?.name}
              </b>{" "}
              · {s.lastRoll.dice.join(" + ")}
            </div>
          )}
          <button
            className="event-ticker"
            aria-label="Open game log"
            onClick={() => {
              setTab("Activity");
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
          <HostControls s={s} host={host} />
          {me && !["LOBBY", "GAME_OVER"].includes(s.phase) && (
            <button className="market-open" onClick={() => setMarket(true)}>
              Trade & bank
              {s.offers.some((o) => o.to === id)
                ? ` · ${s.offers.filter((o) => o.to === id).length} incoming`
                : ""}
            </button>
          )}
          <Tactics s={s} me={me} />
          {s.phase !== "LOBBY" && <SimulationControls s={s} host={host} />}
        </aside>
      </section>
      <Suspense fallback={null}>
        <RollPresentation s={s} id={id} onActiveChange={setRolling} />
      </Suspense>
      <MarketFeedback s={s} id={id} />
      {market && me && (
        <Market s={s} me={me} onClose={() => setMarket(false)} />
      )}
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
      {service && (
        <CityService
          service={service}
          s={s}
          me={me}
          onClose={() => setService(null)}
        />
      )}
      {help && <GameGuide onClose={() => setHelp(false)} />}
      <ArrestNotice s={s} id={id} onPrison={showPrison} />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
