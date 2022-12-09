import { Document } from "./convex/_generated/dataModel";

export function gameTitle(state: Document<"games">) {
    const player1 = state.player1 ? (<span className="whitePlayer">{state.player1}</span>) : (<></>)
    const player2 = state.player1 ? (<span className="blackPlayer">{state.player2}</span>) : (<></>)
    if (state.player1 && state.player2) {
      return (
        <div>
          {player1} vs {player2}
        </div>
      )
    } else if (state.player1) {
      return player1;
    } else if (state.player2) {
      return player2;
    } else {
      return <div></div>;
    }
}
