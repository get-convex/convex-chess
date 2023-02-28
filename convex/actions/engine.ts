import { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { action } from "../_generated/server";
// @ts-ignore
const jsChessEngine = require('js-chess-engine')
import { Chess } from "chess.js";


export const maybeMakeComputerMove = action(async (
  ctx,
  id: Id<"games">,
) => {
  const { runQuery, runMutation } = ctx;
  let pgn = await runQuery('games:internalGetPgnForComputerMove', id);
  if (pgn === null) {
    return;
  }
  const gameState = new Chess();
  gameState.loadPgn(pgn);
  const game = new jsChessEngine.Game(gameState.fen());
  const aiMove = game.aiMove(1);
  console.log(aiMove);
  // aiMove has format {moveFrom: moveTo}
  let moveFrom = Object.keys(aiMove)[0];
  let moveTo = aiMove[moveFrom];
  await runMutation(
    'games:internalMakeComputerMove',
    id,
    moveFrom.toLowerCase(),
    moveTo.toLowerCase(),
  );
})
