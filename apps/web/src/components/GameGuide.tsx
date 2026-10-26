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
          <b>Build.</b> At the start of each round, everyone has 25 seconds to
          develop their properties. Own 3 properties in a district to build; all
          4 to build landmarks.
        </li>
        <li>
          <b>Win.</b> After 12 rounds, the player with the most cash and
          property value wins. The last player still in business also wins.
        </li>
      </ol>
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
          You have 45 seconds to sell building levels at half their original
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
