import { query, mutation, DatabaseWriter, DatabaseReader } from './_generated/server'
import { Id, Document } from "./_generated/dataModel";

import { getCurrentPlayer, validateMove } from "./utils"

import { Chess, Move } from "chess.js";

export const get = query(async ({ db }, id: Id<"games">) => {
  return await db.get(id);
})

export const ongoingGames = query(async ({ db }) => {
  // Games are considered completed after 24h.
  let minStartTime = Date.now() - 24 * 3600 * 1000;
  return await db.query("games")
    .withIndex("finished", q => q.eq("finished", false))
    .order("desc")
    .filter(q => q.gt(q.field("_creationTime"), minStartTime))
    .take(100);
})

export const newGame = mutation(async (
  ctx: any,
  player1: string | null,
  player2: string | null,
) => {
  const { db, scheduler } = ctx;
  const game = new Chess();
  const id = await db.insert('games', {
    pgn: game.pgn(),
    player1,
    player2,
    finished: false,
  });
  scheduler.runAfter(1000, "games:maybeMakeComputerMove", id);

  return id;
})

export const joinGame = mutation(async (
  { db },
  id: Id<"games">,
  user: string,
) => {
  if (!user) {
    return
  }
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

async function _performMove(
  db: DatabaseWriter,
  scheduler: any,
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
    pgn: nextState.pgn(),
    finished: nextState.isGameOver(),
  });

  scheduler.runAfter(1000, "games:maybeMakeComputerMove", state._id);
}

export const move = mutation(async (
  ctx: any,
  id: Id<"games">,
  user: string,
  from: string,
  to: string,
) => {
  const { db, scheduler } = ctx;
  // Load the game.
  let state = await db.get(id);
  if (state == null) {
    throw new Error(`Invalid game ${id}`);
  }

  await _performMove(db, scheduler, state, user, from, to);
})

export const maybeMakeComputerMove = mutation(async (
  ctx: any,
  id: Id<"games">,
) => {
  const { db, scheduler } = ctx;
  let state = await db.get(id);
  if (state == null) {
    throw new Error(`Invalid game ${id}`);
  }

  if (getCurrentPlayer(state) !== "Computer") {
    return;
  }

  const game = new Chess();
  game.loadPgn(state.pgn);

  const possibleMoves = game.moves({ verbose: true });
  if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0) {
    return;
  }
  const randomIndex = Math.floor(Math.random() * possibleMoves.length);
  const move = possibleMoves[randomIndex] as Move;
  await _performMove(db, scheduler, state, "Computer", move.from, move.to);
})
