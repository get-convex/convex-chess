import { query, mutation, DatabaseWriter, DatabaseReader } from './_generated/server'
import { Id, Doc } from "./_generated/dataModel";

import { getCurrentPlayer, validateMove, PlayerId } from "./utils"

import { Chess, Move } from "chess.js";
import { getOrCreateUser } from './users';

async function playerName(
  db: DatabaseReader,
  playerId: Id<"users"> | string | null,
) {
  if (playerId === null) {
    return "";
  } else if (typeof playerId == "string") {
    return playerId;
  } else {
    const user = await db.get(playerId);
    if (user === null) {
      throw new Error(`Missing player id ${playerId}`);
    }
    return user.name;
  }
}

export async function denormalizePlayerNames(
  db: DatabaseReader,
  game: Doc<"games">,
) {
  return {
    ...game,
    player1Name: await playerName(db, game.player1),
    player2Name: await playerName(db, game.player2),
  }
}

export const get = query(async ({ db }, id: Id<"games">) => {
  const game = await db.get(id);
  if (!game) {
    throw new Error(`Invalid game ${id}`);
  }
  return await denormalizePlayerNames(db, game);
})

export const ongoingGames = query(async ({ db }) => {
  const games = await db.query("games")
    .withIndex("finished", q => q.eq("finished", false))
    .order("desc")
    .take(50);
  const result = [];
  for (let game of games) {
    result.push(await denormalizePlayerNames(db, game));
  };
  return result;
})

export const newGame = mutation(async (
  { db, auth, scheduler },
  player1Arg: null | "Computer" | "Me",
  player2Arg: null | "Computer" | "Me",
) => {
  const userId = await getOrCreateUser(db, auth);
  let player1 : PlayerId;
  if (player1Arg === "Me") {
    if (!userId) {
      throw new Error("Can't play as unauthenticated user");
    }
    player1 = userId;
  } else {
    player1 = player1Arg;
  }
  let player2 : PlayerId;
  if (player2Arg === "Me") {
    if (!userId) {
      throw new Error("Can't play as unauthenticated user");
    }
    player2 = userId;
  } else {
    player2 = player2Arg;
  }

  const game = new Chess();
  const id = await db.insert('games', {
    pgn: game.pgn(),
    player1,
    player2,
    finished: false,
  });

  scheduler.runAfter(1000, "actions/engine:maybeMakeComputerMove", id);

  return id;
})

export const joinGame = mutation(async (
  { db, auth },
  id: Id<"games">,
) => {
  const user = await getOrCreateUser(db, auth);
  if (!user) {
    throw new Error("Trying to join game with unauthenticated user");
  }
  let state = await db.get(id);
  if (state == null) {
    throw new Error(`Invalid game ${id}`);
  }

  if (!state.player1 && !user.equals(state.player2)) {
    await db.patch(id, {
      player1: user,
    });
  } else if (!state.player2 && !user.equals(state.player1)) {
    await db.patch(id, {
      player2: user,
    });
  }
})

async function _performMove(
  db: DatabaseWriter,
  player: PlayerId,
  scheduler: any,
  state: Doc<"games">,
  from: string,
  to: string,
) {
  let nextState = validateMove(state, player, from, to);
  if (!nextState) {
    console.log(`invalid move ${from}-${to}`);
    // Invalid move.
    return;
  }

  await db.patch(state._id, {
    pgn: nextState.pgn(),
    finished: nextState.isGameOver(),
  });

  scheduler.runAfter(1000, "actions/engine:maybeMakeComputerMove", state._id);
}

export const move = mutation(async (
  { db, auth, scheduler },
  id: Id<"games">,
  from: string,
  to: string,
) => {
  const userId = await getOrCreateUser(db, auth);
  if (!userId) {
    throw new Error("Trying to perform a move with unauthenticated user");
  }

  // Load the game.
  let state = await db.get(id);
  if (state == null) {
    throw new Error(`Invalid game ${id}`);
  }

  await _performMove(db, userId, scheduler, state, from, to);
})

export const internalGetPgnForComputerMove = query(async (
  {db},
  id: Id<"games">,
) => {
  let state = await db.get(id);
  if (state == null) {
    throw new Error(`Invalid game ${id}`);
  }

  if (getCurrentPlayer(state) !== "Computer") {
    console.log("it's not the computer's turn");
    return null;
  }

  const game = new Chess();
  game.loadPgn(state.pgn);

  const possibleMoves = game.moves({ verbose: true });
  if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0) {
    console.log("no moves");
    return null;
  }
  return state.pgn;
})

export const internalMakeComputerMove = mutation(async (
  {db, scheduler},
  id: Id<"games">,
  moveFrom: string,
  moveTo: string,
) => {
  let state = await db.get(id);
  if (state == null) {
    throw new Error(`Invalid game ${id}`);
  }
  if (getCurrentPlayer(state) !== "Computer") {
    return;
  }
  await _performMove(db, "Computer", scheduler, state, moveFrom, moveTo);
})
