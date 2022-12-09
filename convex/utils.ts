import { Chess } from "chess.js";
import { Document } from "../convex/_generated/dataModel";

export function isOpen(state: Document<"games">) : boolean {
  return !state.player1 || !state.player2;
}

export function hasPlayer(state: Document<"games">, player: string) : boolean {
  return state.player1 == player || state.player2 == player;
}

export function getCurrentPlayer(state: Document<"games">) : string | null {
    const game = new Chess();
    game.loadPgn(state.pgn);
    return (game.turn() == 'w') ? state.player1 : state.player2;
}

export function validateMove(state: Document<"games">, player: string, from: string, to: string) : Chess | null {
    if (getCurrentPlayer(state) != player) {
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
