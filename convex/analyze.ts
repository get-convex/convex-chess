import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  PersistentTextStreaming,
  StreamId,
  StreamIdValidator,
  StreamWriter,
} from "@convex-dev/persistent-text-streaming";
import { chatCompletion } from "./lib/openai";
import { Chess } from "chess.js";
import {
  httpAction,
  internalAction,
  internalMutation,
  internalQuery,
  MutationCtx,
  query,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getCurrentPlayer, getNextPlayer, playerEquals } from "./utils";

const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming
);

export const createStream = async (
  ctx: MutationCtx,
  args: {
    game: Chess;
    gameId: Id<"games">;
    moveIndex: number;
    previousPGN: string;
    move: string;
  }
) => {
  const boardState = boardView(args.game);
  const _boardState = args.game.fen();
  const oldPrompt = `Analyze just the move at index ${
    args.moveIndex
  } in this chess game. Only tell me about the effect of that move.: ${args.game.history()}.`;
  const prompt = `You are a chess expert. I am playing a chess game. The board looks like this:\n${boardState}\n\nAnalyze the effect of playing the move ${args.move}. Please analyze concisely, with less than 20 words. Then conclude with an over-the-top sentence describing sarcastic, flippant, or humorous feelings about the move.`;
  const streamId = await persistentTextStreaming.createStream(ctx);
  await ctx.db.insert("prompts", {
    game: args.gameId,
    moveIndex: args.moveIndex,
    prompt,
    streamId,
  });
  await ctx.db.insert("analysis", {
    game: args.gameId,
    moveIndex: args.moveIndex,
    analysis: "",
    streamId,
  });
  return streamId;
};

export const getPrompt = internalQuery({
  args: { streamId: StreamIdValidator },
  handler: async (ctx, { streamId }) => {
    const prompt = await ctx.db
      .query("prompts")
      .withIndex("by_stream_id", (q) => q.eq("streamId", streamId))
      .unique();
    if (prompt === null) {
      throw new Error("Prompt not found");
    }
    return prompt.prompt;
  },
});

export const getAnalysis = query({
  args: {
    streamId: StreamIdValidator,
  },
  handler: async (ctx, args) => {
    return await persistentTextStreaming.getStreamBody(
      ctx,
      args.streamId as StreamId
    );
  },
});

export const analyzeMoveHttpHandler = httpAction(async (ctx, request) => {
  const { streamId }: { streamId: StreamId } = await request.json();
  const prompt = await ctx.runQuery(internal.analyze.getPrompt, {
    streamId,
  });
  const generateChat: StreamWriter<any> = async (
    ctx,
    request,
    streamId,
    chunkAppender
  ) => {
    // Call the language model
    const result = streamText({
      // @ts-expect-error -- I'm not sure why these types aren't matching up,
      // but it works at runtime.
      model: openai("gpt-4o-mini"),
      messages: [{ role: "system", content: prompt }],
    });
    for await (const chunk of result.textStream) {
      await chunkAppender(chunk);
    }
    return;
  };

  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    streamId,
    generateChat
  );

  // Set CORS headers appropriately.
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");
  return response;
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

/**
 * Return a `streamId` for the latest analysis stream for a given game.
 *
 * The recipient of this `streamId` will attempt to kick off the stream itself.
 *
 * We'll only return a `streamId` if the current user is playing in the game,
 * or if the game is between two computers.
 *
 * It's ok if multiple tabs try and kick off the stream, since persistentTextStreaming
 * should handle that gracefully.
 */
export const getLatestAnalysisStream = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId == null) {
      return null;
    }

    // Load the game.
    let state = await ctx.db.get(gameId);
    if (state == null) {
      throw new Error(`Invalid game ${gameId}`);
    }
    const isComputerVsComputer =
      state.player1 === "Computer" && state.player2 === "Computer";
    const isPlaying =
      playerEquals(getCurrentPlayer(state), userId) ||
      playerEquals(getNextPlayer(state), userId);
    if (!isPlaying && !isComputerVsComputer) {
      return null;
    }
    const prompt = await ctx.db
      .query("prompts")
      .withIndex("by_game_index", (q) => q.eq("game", gameId))
      .order("desc")
      .first();
    console.log(`PROMPT: ${JSON.stringify(prompt)}`);
    if (prompt == null) {
      return null;
    }
    return prompt.streamId as StreamId;
  },
});

export const getSiteUrl = query({
  args: {},
  handler: async (ctx) => {
    return process.env.CONVEX_SITE_URL;
  },
});

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
