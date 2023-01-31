import { Chess } from "chess.js";
import { Document, Id } from "../convex/_generated/dataModel";

export type PlayerId = Id<"users"> | "Computer" | null;

export function playerEquals(player1: PlayerId, player2: PlayerId) {
  if (!player1) {
    // null is not equal to null.
    return false;
  }
  return (typeof player1 == "string") ? player1 == player2 : player1.equals(player2);
}

export function isOpen(state: Document<"games">) : boolean {
  return !state.player1 || !state.player2;
}

export function hasPlayer(state: Document<"games">, player: PlayerId) : boolean {
  if (!player) {
    return false;
  }
  return playerEquals(state.player1 as any, player) || playerEquals(state.player2 as any, player);
}

export function getCurrentPlayer(state: Document<"games">) : PlayerId {
    const game = new Chess();
    game.loadPgn(state.pgn);
    let result = (game.turn() == 'w') ? state.player1 : state.player2;
    return result as any;
}

export function validateMove(
  state: Document<"games">,
  player: PlayerId,
  from: string,
  to: string,
) : Chess | null {
    if (!playerEquals(getCurrentPlayer(state), player)) {
      // Wrong player.
      return null;
    }
    const game = new Chess();
    game.loadPgn(state.pgn);
    let valid = game.move({from, to});
    if (!valid) {
        // This is lame but try promoting.
        let moveAndPromote = {from, to, promotion: 'q' }
        moveAndPromote.promotion = 'q';      
        valid = game.move(moveAndPromote);
    }

    return valid ? game : null;
}
