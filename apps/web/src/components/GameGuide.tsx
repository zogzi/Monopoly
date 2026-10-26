export default function GameGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={() => onClose()}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="How to play"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close" autoFocus onClick={() => onClose()}>
          ✕
        </button>
        <span className="eyebrow">WELCOME TO EMPIRE CIRCUIT</span>
        <h2>Your city. Your strategy.</h2>
        <p>
          Invite friends to this same website, or add bots from the lobby.
          Choose a token, join, and mark ready. The first player hosts. Capital
          Race lasts 12 rounds.
        </p>
        <p>
          To simulate solo: add at least 3 bots, enable Autoplay my seat, choose
          Fast pace, mark ready and start. Pause at any time or disable autoplay
          to take over. Bots follow the same rules as human players. Voice chat
          stays in Discord.
        </p>
        <div className="guide-grid">
          <div>
            <b>01 / PLAN</b>
            <p>
              25 seconds together to build. Own 3 of 4 district properties to
              develop; all 4 for landmarks. Zoning capacity is 6 or 12 total
              levels.
            </p>
          </div>
          <div>
            <b>02 / MOVE</b>
            <p>
              Roll two server-controlled dice. At intersections choose the
              district road or an inner-city shortcut. Timers keep things
              moving.
            </p>
          </div>
          <div>
            <b>03 / ACQUIRE</b>
            <p>
              Buy a vacant property, or pass. Pay revenue when visiting rivals.
              Two properties in a district earn a 10% bonus. Passing HQ earns
              $200.
            </p>
          </div>
          <div>
            <b>04 / WIN</b>
            <p>
              After round 12, cash + property purchase values + development
              investment determines your empire value. Last solvent player also
              wins.
            </p>
          </div>
        </div>
        <p>
          Development adds 60% base revenue per level. If cash goes negative,
          you have 45 seconds to sell development at half cost before
          bankruptcy. Bankrupt assets return to the city.
        </p>
        <p>
          Refresh safely: this browser remembers your seat. The server saves
          after each action. After a server restart, reconnect and have the host
          resume the paused game.
        </p>
        <p>
          This is Milestone 1. Auctions, trading, loans, advanced economy and
          premium assets belong to later milestones.
        </p>
        <button className="primary" onClick={() => onClose()}>
          Let’s build an empire ↗
        </button>
      </section>
    </div>
  );
}
