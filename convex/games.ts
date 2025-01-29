import { api, components, internal } from "./_generated/api";
import {
  query,
  mutation,
  DatabaseWriter,
  DatabaseReader,
  internalMutation,
  internalAction,
  internalQuery,
  MutationCtx,
} from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";

import {
  getCurrentPlayer,
  validateMove,
  PlayerId,
  getNextPlayer,
} from "./utils";

import { Chess } from "chess.js";
import { Scheduler } from "convex/server";
import { ConvexError, v } from "convex/values";
import { chatCompletion } from "./lib/openai";
import { getAuthUserId } from "@convex-dev/auth/server";
import { aggregate } from "./index";
import { Workpool } from "@convex-dev/workpool";

const analysisWorkpool = new Workpool(components.analysisWorkpool, {
  maxParallelism: 10,
});

async function playerName(
  db: DatabaseReader,
  playerId: "Computer" | Id<"users"> | null
) {
  if (playerId === null) {
    return "";
  } else if (playerId == "Computer") {
    return playerId;
  } else {
    const user = await db.get(playerId as Id<"users">);
    if (user === null) {
      throw new Error(`Missing player id ${playerId}`);
    }
    return user.name ?? "Unknown";
  }
}

export async function denormalizePlayerNames(
  db: DatabaseReader,
  game: Doc<"games">
) {
  return {
    ...game,
    player1Name: await playerName(db, game.player1),
    player2Name: await playerName(db, game.player2),
  };
}

export const get = query(async ({ db }, { id }: { id: Id<"games"> }) => {
  const game = await db.get(id);
  if (!game) {
    throw new Error(`Invalid game ${id}.`);
  }
  return await denormalizePlayerNames(db, game);
});

export const ongoingGames = query(async ({ db }) => {
  const games = await db
    .query("games")
    .withIndex("finished", (q) => q.eq("finished", false))
    .order("desc")
    .take(50);
  const result = [];
  for (let game of games) {
    result.push(await denormalizePlayerNames(db, game));
  }
  return result;
});

export const newGame = mutation(
  async (
    { db, auth, scheduler },
    {
      player1,
      player2,
    }: {
      player1: null | "Computer" | "Me";
      player2: null | "Computer" | "Me";
    }
  ) => {
    const userId = await getAuthUserId({ auth });
    let player1Id: PlayerId;
    if (player1 === "Me") {
      if (!userId) {
        throw new Error("Can't play as unauthenticated user");
      }
      player1Id = userId;
    } else {
      player1Id = player1;
    }
    let player2Id: PlayerId;
    if (player2 === "Me") {
      if (!userId) {
        throw new Error("Can't play as unauthenticated user");
      }
      player2Id = userId;
    } else {
      player2Id = player2;
    }

    const game = new Chess();
    let id: Id<"games"> = await db.insert("games", {
      pgn: game.pgn(),
      player1: player1Id,
      player2: player2Id,
      finished: false,
    });

    scheduler.runAfter(1000, internal.engine.maybeMakeComputerMove, { id });

    return id;
  }
);

export const joinGame = mutation(
  async ({ db, auth }, { id }: { id: Id<"games"> }) => {
    const userId = await getAuthUserId({ auth });
    if (!userId) {
      throw new Error("Trying to join game with unauthenticated user");
    }
    let state = await db.get(id);
    if (state == null) {
      throw new Error(`Invalid game ${id}`);
    }

    if (!state.player1 && userId !== state.player2) {
      await db.patch(id, {
        player1: userId,
      });
    } else if (!state.player2 && userId !== state.player1) {
      await db.patch(id, {
        player2: userId,
      });
    }
  }
);

async function _performMove(
  ctx: MutationCtx,
  player: PlayerId,
  state: Doc<"games">,
  from: string,
  to: string,
  finalPiece: string
) {
  const currentPGN = state.pgn;
  let nextState = validateMove(state, player, from, to, finalPiece);
  if (!nextState) {
    // Invalid move.
    throw new ConvexError(`invalid move ${from}-${to}`);
  }

  if (nextState.isGameOver()) {
    const currentPlayer = await playerName(ctx.db, getCurrentPlayer(state));
    const nextPlayer = await playerName(ctx.db, getNextPlayer(state));

    if (nextState.isCheckmate()) {
      console.log(`Checkmate! ${currentPlayer} beat ${nextPlayer}`);
    }
    if (nextState.isDraw()) {
      console.log(
        `Draw! ${currentPlayer} and ${nextPlayer} are evenly matched`
      );
    }
  }

  await ctx.db.patch(state._id, {
    pgn: nextState.pgn(),
    finished: nextState.isGameOver(),
  });
  const history = nextState.history();
  const move = history[history.length - 1];
  await analysisWorkpool.enqueueAction(ctx, internal.games.analyzeMove, {
    gameId: state._id,
    moveIndex: history.length - 1,
    previousPGN: currentPGN,
    move,
  });

  await aggregate.insert(ctx, move, `${state._id}:${history.length - 1}`, 1);

  await ctx.scheduler.runAfter(1000, internal.engine.maybeMakeComputerMove, {
    id: state._id,
  });
}

const boardView = (chess: Chess): string => {
  const rows = [];
  for (const row of chess.board()) {
    let rowView = "";
    for (const square of row) {
      if (square === null) {
        rowView += ".";
      } else {
        let piece = square.type as string;
        if (square.color === "w") {
          piece = piece.toUpperCase();
        }
        rowView += piece;
      }
    }
    rows.push(rowView);
  }
  return rows.join("\n");
};

export const analyzeMove = internalAction({
  args: {
    gameId: v.id("games"),
    moveIndex: v.number(),
    previousPGN: v.string(),
    move: v.string(),
  },
  handler: async (ctx, { gameId, moveIndex, previousPGN, move }) => {
    const game = new Chess();
    game.loadPgn(previousPGN);
    const boardState = boardView(game);
    const _boardState = game.fen();
    const oldPrompt = `Analyze just the move at index ${moveIndex} in this chess game. Only tell me about the effect of that move.: ${game.history()}.`;
    const prompt = `You are a chess expert. I am playing a chess game. The board looks like this:\n${boardState}\n\nAnalyze the effect of playing the move ${move}. Please analyze concisely, with less than 20 words. Then conclude with an over-the-top sentence describing sarcastic, flippant, or humorous feelings about the move.`;
    const response = await chatCompletion({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    let responseText = "";
    for await (const chunk of response.content.read()) {
      responseText += chunk;

      await ctx.runMutation(internal.games.saveAnalysis, {
        gameId: gameId,
        moveIndex,
        analysis: responseText,
      });
    }
    console.log(`PROMPT '${prompt}' GOT RESPONSE '${responseText}'`);
  },
});

export const saveAnalysis = internalMutation({
  args: {
    gameId: v.id("games"),
    moveIndex: v.number(),
    analysis: v.string(),
  },
  handler: async (ctx, { gameId, moveIndex, analysis }) => {
    const analysisDoc = await ctx.db
      .query("analysis")
      .withIndex("by_game_index", (q) =>
        q.eq("game", gameId).eq("moveIndex", moveIndex)
      )
      .unique();
    if (analysisDoc) {
      await ctx.db.patch(analysisDoc._id, {
        analysis,
      });
    } else {
      await ctx.db.insert("analysis", {
        game: gameId,
        moveIndex,
        analysis,
      });
    }
  },
});

export const getAnalysis = query({
  args: { gameId: v.id("games"), moveIndex: v.optional(v.number()) },
  handler: async (ctx, { gameId, moveIndex }) => {
    const state = await ctx.db.get(gameId);
    if (state === null) {
      throw new Error("Invalid Game ID");
    }

    let analysis;
    if (moveIndex !== undefined) {
      analysis = await ctx.db
        .query("analysis")
        .withIndex("by_game_index", (q) =>
          q.eq("game", gameId).eq("moveIndex", moveIndex)
        )
        .unique();
    } else {
      analysis = await ctx.db
        .query("analysis")
        .withIndex("by_game_index", (q) => q.eq("game", gameId))
        .order("desc")
        .first();
    }

    if (analysis === null) {
      return null;
    }

    const currentPGN = state.pgn;
    const game = new Chess();
    game.loadPgn(currentPGN);
    const move = game.history()[analysis.moveIndex];

    return {
      analysis: analysis.analysis,
      moveIndex: analysis.moveIndex,
      move,
    };
  },
});

export const move = mutation({
  args: {
    gameId: v.id("games"),
    from: v.string(),
    to: v.string(),
    finalPiece: v.string(),
  },
  handler: async (ctx, { gameId, from, to, finalPiece }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Trying to perform a move with unauthenticated user");
    }

    // Load the game.
    let state = await ctx.db.get(gameId);
    if (state == null) {
      throw new Error(`Invalid game ${gameId}`);
    }
    await _performMove(ctx, userId, state, from, to, finalPiece);
  },
});

export const internalGetPgnForComputerMove = query(
  async ({ db }, { id }: { id: Id<"games"> }) => {
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

    const opponent = getNextPlayer(state);

    let strategy = "default";
    if (opponent !== "Computer") {
      const opponentPlayer = await db.get(opponent as Id<"users">);
      const name = opponentPlayer?.name?.toLowerCase();
      if (name?.includes("nipunn")) {
        strategy = "tricky";
      } else if (name?.includes("preslav")) {
        strategy = "hard";
      }
    }

    return [state.pgn, strategy];
  }
);

export const internalMakeComputerMove = internalMutation({
  args: {
    id: v.id("games"),
    moveFrom: v.string(),
    moveTo: v.string(),
    finalPiece: v.string(),
  },
  handler: async (ctx, { id, moveFrom, moveTo, finalPiece }) => {
    let state = await ctx.db.get(id);
    if (state == null) {
      throw new Error(`Invalid game ${id}`);
    }
    if (getCurrentPlayer(state) !== "Computer") {
      return;
    }
    await _performMove(ctx, "Computer", state, moveFrom, moveTo, finalPiece);
  },
});

export const getMoveCount = query({
  args: { move: v.string() },
  returns: v.number(),
  handler: async (ctx, { move }) => {
    const count = await aggregate.sum(ctx, {
      lower: { key: move, inclusive: true },
      upper: { key: move, inclusive: true },
    });
    return count;
  },
});
