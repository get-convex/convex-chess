import Link from "next/link";
import { Game } from "./convex/search";
import { Id } from "./convex/_generated/dataModel";

function getProfileLink(className: string, name: string, id: string | Id<"users"> | null) {
  if (!id) {
    return <></>;
  }
  if (typeof id == "string") {
    return <span className={className}>{name}</span>
  } else {
    return <Link className={className} href={`/user/${id}`}>{name}</Link>
  }
}

export function gameTitle(state: Game) {
    const player1Span = getProfileLink("whitePlayer", state.player1Name, state.player1);
    const player2Span = getProfileLink("blackPlayer", state.player2Name, state.player2);
    const context = state.resultContext;
    if (state.player1Name && state.player2Name) {
      return (
        <div>
          <div>{player1Span} vs {player2Span}</div>
          {context && (
            <div>
              {context}
            </div>
          )}
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
