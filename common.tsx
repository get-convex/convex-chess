import { Document } from "./convex/_generated/dataModel";

export function gameTitle(state: { player1Name: string, player2Name: string }) {
    const player1Span = state.player1Name ? (<span className="whitePlayer">{state.player1Name}</span>) : (<></>)
    const player2Span = state.player2Name ? (<span className="blackPlayer">{state.player2Name}</span>) : (<></>)
    if (state.player1Name && state.player2Name) {
      return (
        <div>
          {player1Span} vs {player2Span}
        </div>
      )
    } else if (state.player1Name) {
      return player1Span;
    } else if (state.player2Name) {
      return player2Span;
    } else {
      return <div></div>;
    }
}
