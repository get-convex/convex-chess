import { query, mutation, DatabaseWriter } from './_generated/server'
import { Id, Document } from "./_generated/dataModel";

import { validateMove } from "./utils"

import { Chess, Move } from "chess.js";

export const get = query(async ({ db }, id: Id<"games">) => {
  return await db.get(id);
})

export const openGames = query(async ({ db }) => {
  // Games are considered completed after an hour.
  let minStartTime = Date.now() - 3600 * 1000;
  return await db.query("games")
    .order("desc")
    .filter(q => q.gt(q.field("_creationTime"), minStartTime))
    .take(10);
})

export const newGame = mutation(async (
  { db },
  player1: string | null,
  player2: string | null,
) => {
  const game = new Chess();
  return await db.insert('games', {
    pgn: game.pgn(),
    player1,
    player2,
  })
})

export const joinGame = mutation(async (
  { db },
  id: Id<"games">,
  user: string,
) => {
  let state = await db.get(id);
  if (state == null) {
    throw new Error(`Invalid game ${id}`);
  }

  if (!state.player1 && user != state.player2) {
    await db.patch(id, {
      player1: user,
    });
  } else if (!state.player2 && user != state.player1) {
    await db.patch(id, {
      player2: user,
    });
  }
})

async function performMove(
  db: DatabaseWriter,
  state: Document<"games">,
  player: string,
  from: string,
  to: string,
) {
  let nextState = validateMove(state, player, from, to);
  console.log(player, from, to, nextState ? true : false);
  if (!nextState) {
    // Invalid move.
    return;
  }

  await db.patch(state._id, {
    pgn: nextState,
  });
}

export const move = mutation(async (
  { db },
  id: Id<"games">,
  user: string,
  from: string,
  to: string,
) => {
  // Load the game.
  let state = await db.get(id);
  if (state == null) {
    throw new Error(`Invalid game ${id}`);
  }

  await performMove(db, state, user, from, to);
})

export const makeComputerMove = mutation(async (
  { db },
  id: Id<"games">,
  num_moves: number,
) => {
  let state = await db.get(id);
  if (state == null) {
    throw new Error(`Invalid game ${id}`);
  }

  const game = new Chess();
  game.loadPgn(state.pgn);

  if (num_moves != game.history().length) {
    // Already played.
    return;
  }

  const possibleMoves = game.moves({ verbose: true });
  if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0) {
    return;
  }
  const randomIndex = Math.floor(Math.random() * possibleMoves.length);
  const move = possibleMoves[randomIndex] as Move;
  await performMove(db, state, "Computer", move.from, move.to);
})
