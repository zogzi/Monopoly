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
          properties, or pay rent when you land on someone else’s property. Your
          full turn has five minutes; decisions share that time. Finish earlier
          whenever you are ready.
        </li>
        <li>
          <b>Build.</b> From round two, everyone has up to five minutes to
          develop their properties. Own 3 properties in a district to build; all
          4 to build landmarks.
        </li>
        <li>
          <b>Win.</b> Capital Race lasts 12 rounds; Blitz lasts 8 with more
          starting cash and cheaper building. Highest net empire value wins.
          Domination ends early with one solvent player, or uses net empire
          value after a 30-round safety limit.
        </li>
      </ol>
      <details>
        <summary>Trades, counteroffers and contracts</summary>
        <p>
          Open Trade & bank to offer cash and several properties. Only the two
          parties see an unaccepted offer. Accept, decline, withdraw or counter;
          a counter replaces the original terms. Optional preset contracts cover
          future payments, private loans, revenue sharing, rent immunity and
          purchase options. Accepted terms are public and enforced by the
          server. Pledged or contracted properties stay locked until their
          obligation ends.
        </p>
      </details>
      <details>
        <summary>Property auctions</summary>
        <p>
          Declined properties go to a public auction. Every solvent player can
          bid or pass, even off turn. Bids are binding and increase by at least
          $10. Each new bid gives every rival another chance to respond. Passes
          apply to that price. All rivals passing ends the auction early; the
          leading bidder cannot end it. A late bid leaves at least a minute to
          respond. Find auction locates the property in the city.
        </p>
      </details>
      <details>
        <summary>Bank borrowing and score</summary>
        <p>
          The bank lends up to 65% of your collateral value. The displayed rate
          is fixed for that loan; interest begins after the next round and the
          principal comes due after three rounds. Early repayment releases the
          collateral. Refinancing draws unused equity without delaying maturity.
          Net empire value subtracts bank debt and promised repayments, and adds
          receivables. Borrowed cash alone never improves your score.
        </p>
      </details>
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
          choose. If caught, police escort you to Ravenwatch Prison outside the
          city. A custody notice stays visible in every sidebar panel. Pay $200
          bail, play an Alibi card, or serve two turns. Your properties still
          collect rent.
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
          You have ten minutes to sell unpledged building levels, borrow against
          free collateral, accept a trade or auction an undeveloped property.
          Round-end debt shortfalls must be resolved before play resumes.
          Bankruptcy settles secured bank claims first, distributes available
          cash to private creditors, writes off remaining claims and returns
          remaining properties to the city.
        </p>
      </details>
      <details>
        <summary>Finding places and following your turn</summary>
        <p>
          Your turn stays visible above the sidebar tabs; click it to return to
          Play. Owner names, colored plot borders and flags show who owns every
          property on the map. Price tags mark unowned properties; hover a tag
          for details. Open Properties to search or click the small city map.
          Selecting a property moves the camera there. Other players’ dice never
          cover your controls. Auctions have their own timer and pause your
          remaining turn time. Pausing or restarting the server preserves the
          time left.
        </p>
      </details>
      <details>
        <summary>Audio and display settings</summary>
        <p>
          Open Settings in the sidebar footer to adjust master, game-effect and
          alert volumes, or turn off movement sounds, interface clicks and other
          players’ effects. Settings save in this browser. Turn alerts have
          their own channel. Graphics quality and storm visuals are in the same
          compact panel.
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
