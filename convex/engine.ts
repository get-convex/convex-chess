"use node";

import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
const jsChessEngine = require("js-chess-engine");
import { Chess } from "chess.js";

export const maybeMakeComputerMove = internalAction(
  async (ctx, { id }: { id: Id<"games"> }) => {
    const { runQuery, runMutation } = ctx;
    const state = await runQuery(api.games.internalGetPgnForComputerMove, {
      id,
    });
    if (state === null) {
      return;
    }
    const [pgn, strategy] = state;
    const gameState = new Chess();
    gameState.loadPgn(pgn);
    const moveNumber = gameState.history().length;
    const game = new jsChessEngine.Game(gameState.fen());
    let level = 1;
    if (strategy === "hard") {
      level = 2;
    } else if (strategy === "tricky") {
      if (moveNumber > 6) {
        level = 2;
        if (moveNumber % 3 === 0) {
          level = 3;
        }
      }
    }
    const aiMove = game.aiMove(level);
    // aiMove has format {moveFrom: moveTo}
    let moveFrom = Object.keys(aiMove)[0];
    let moveTo = aiMove[moveFrom];
    console.log(`move at level ${level}: ${moveFrom}->${moveTo}`);
    await runMutation(internal.games.internalMakeComputerMove, {
      id,
      moveFrom: moveFrom.toLowerCase(),
      moveTo: moveTo.toLowerCase(),
      finalPiece: "q", // js-chess-engine only knows how to promote queen
    });
  }
);
