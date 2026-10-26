import Modal from "./Modal";
export default function GameGuide({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" onClose={onClose}>
      <ol>
        <li>
          <b>Join.</b> Choose a character. Add bots or invite friends. You need
          at least 4 players in total.
        </li>
        <li>
          <b>Get ready.</b> Everyone clicks “I’m ready”. The host starts the
          game.
        </li>
        <li>
          <b>Take turns.</b> Roll the dice. Choose a route at a junction. Buy
          properties, or pay rent when you land on someone else’s property.
        </li>
        <li>
          <b>Build.</b> At the start of each round, everyone has up to five
          minutes to develop their properties. Own 3 properties in a district to
          build; all 4 to build landmarks.
        </li>
        <li>
          <b>Win.</b> After 12 rounds, the player with the most cash and
          property value wins. The last player still in business also wins.
        </li>
      </ol>
      <details>
        <summary>Surprises, cards and city events</summary>
        <p>
          Each movement turn ends with a surprise offer. Choose one of two
          deals, or skip. Your hand holds up to four cards; use or discard them
          during planning or your turn. Current city events change rent and
          prices, and the next round's event is visible in advance.
        </p>
      </details>
      <details>
        <summary>City service characters</summary>
        <p>
          Click the Card broker, Contractor or Courier in the city during
          planning. Each service costs money. You can use one service per round.
        </p>
      </details>
      <details>
        <summary>Illegal deals and custody</summary>
        <p>
          Illegal surprise offers show their 40% arrest chance before you
          choose. If caught, police escort you to the outer-city holding
          station. Pay $200 bail, play an Alibi card, or serve two turns. Your
          properties still collect rent.
        </p>
      </details>
      <details>
        <summary>Practice on your own</summary>
        <p>
          Add 3 bots. Turn on “Play my turns automatically” to watch a complete
          game, or leave it off to play yourself. Choose Fast bot speed to move
          through the match quickly.
        </p>
      </details>
      <details>
        <summary>Building and rent</summary>
        <p>
          Own 2 properties in a district for 10% more rent. A district allows 6
          total building levels with 3 properties, or 12 levels with all 4. Each
          level increases base rent by 60%. Passing the starting location earns
          $200.
        </p>
      </details>
      <details>
        <summary>If you run out of cash</summary>
        <p>
          You have ten minutes to sell building levels at half their original
          cost. If you cannot cover the shortfall, you go bankrupt and your
          properties return to the city.
        </p>
      </details>
      <details>
        <summary>Returning to a game</summary>
        <p>
          This browser remembers your seat. Refreshing reconnects you
          automatically. After a server restart, the host resumes the paused
          game.
        </p>
      </details>
      <button className="primary" onClick={onClose}>
        Back to game
      </button>
    </Modal>
  );
}
