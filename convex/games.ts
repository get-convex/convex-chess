import { query, mutation } from './_generated/server'
import { Id } from "./_generated/dataModel";

import { Chess } from "chess.js";

export const newGame = mutation(async (
  { db },
  player1: "random" | null,
  player2: "random" | null,
) => {
  const game = new Chess();
  return await db.insert('games', {
    pgn: game.pgn(),
    player1,
    player2,
    finished: false,
  })
})

export const get = query(async ({ db }, id: Id<"games">) => {
  return await db.get(id);
})

export const openGames = query(async ({ db }) => {
  return await db.query("games").withIndex(
    "finished",
    q => q.eq("finished", false)
  )
  .order("desc")
  .take(10);
})

export const move = mutation(async ({ db }, id: Id<"games">, from: string, to: string) => {
  // Load the game.
  let gameState = await db.get(id);
  if (gameState == null) {
    throw new Error(`Invalid game ${id}`);
  }
  const game = new Chess();
  game.loadPgn(gameState.pgn);

  let move = game.move({from, to});
  if (!move) {
    // May be the move requires promoting? Queens are usually the best.
    move = game.move({from, to, promotion: 'q'});
  }

  if (!move) {
    // Invalid move
    return null;
  }

  db.patch(id, {
    pgn: game.pgn(),
    finished: game.isGameOver(),
  });
})
