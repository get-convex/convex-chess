import { Chess } from "chess.js";
import { Doc, Id } from "../convex/_generated/dataModel";
import { DatabaseReader } from "./_generated/server";

export type PlayerId = Id<"users"> | "Computer" | null;

export async function playerName(
  db: DatabaseReader,
  player: PlayerId
): Promise<string> {
  if (player === "Computer") {
    return "Computer";
  }
  if (player === null) {
    return "nobody";
  }
  const p = await db.get(player);
  if (!p) {
    return "invalid-player-id";
  }
  return p.name;
}

export function playerEquals(player1: PlayerId, player2: PlayerId) {
  if (!player1) {
    // null is not equal to null.
    return false;
  }
  return typeof player1 == "string" ? player1 == player2 : player1 === player2;
}

export function isOpen(state: Doc<"games">): boolean {
  return !state.player1 || !state.player2;
}

export function hasPlayer(state: Doc<"games">, player: PlayerId): boolean {
  if (!player) {
    return false;
  }
  return (
    playerEquals(state.player1 as any, player) ||
    playerEquals(state.player2 as any, player)
  );
}

export function getCurrentPlayer(state: Doc<"games">): PlayerId {
  const game = new Chess();
  game.loadPgn(state.pgn);
  let result = game.turn() == "w" ? state.player1 : state.player2;
  return result as any;
}

export function getNextPlayer(state: Doc<"games">): PlayerId {
  const game = new Chess();
  game.loadPgn(state.pgn);
  let result = game.turn() == "w" ? state.player2 : state.player1;
  return result as any;
}

export function validateMove(
  state: Doc<"games">,
  player: PlayerId,
  from: string,
  to: string
): Chess | null {
  if (!playerEquals(getCurrentPlayer(state), player)) {
    // Wrong player.
    return null;
  }
  const game = new Chess();
  game.loadPgn(state.pgn);
  let valid = null;
  try {
    valid = game.move({ from, to });
  } catch {
    // This is lame but try promoting.
    try {
      valid = game.move({ from, to, promotion: "q" });
      console.log("promoted a pawn");
    } catch {
      console.log(`invalid move ${from}->${to}`);
      valid = null;
    }
  }

  return valid ? game : null;
}
