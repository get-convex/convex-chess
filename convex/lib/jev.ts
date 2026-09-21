import { convexGateway } from "@convex-dev/ai-sdk-provider";
import { experimental_evaluate as evaluate } from "ai";
import { Chess } from "chess.js";

const criteria = [
  "Throws away a winning or drawable game by allowing an immediate forced loss.",
  "Loses decisive material or permits a decisive attack without compensation.",
  "Loses material or creates a serious lasting weakness without compensation.",
  "Gives up a clear advantage or misses an important defensive resource.",
  "Creates a small weakness or misses an opportunity to improve the position.",
  "Maintains a playable position without a clear improvement.",
  "Improves the position with sound development, defense, or piece activity.",
  "Creates a concrete advantage while keeping the position safe.",
  "Finds a strong tactical or positional resource that decisively improves the position.",
  "Finds the best available move, including forced mate or the only move that saves the game.",
];

export async function rateChessMove(previousPGN: string, move: string) {
  const game = new Chess();
  game.loadPgn(previousPGN);
  const before = game.fen();
  const player = game.turn() === "w" ? "white" : "black";
  game.move(move);

  const result = await evaluate({
    model: convexGateway.evaluationModel("typesafe/jev-1.13"),
    state: { before, after: game.fen(), player, move, previousPGN },
    questions: {
      moveQuality: {
        type: "score",
        instructions:
          "Evaluate this chess move from the moving player's perspective, relative to the legal alternatives in the position.",
        criteria,
      },
    },
    abortSignal: AbortSignal.timeout(30_000),
  });
  const answer = result.answers.moveQuality;
  if (
    answer?.type !== "score" ||
    typeof answer.score !== "number" ||
    !Number.isFinite(answer.score) ||
    answer.score < 0 ||
    answer.score > 9
  ) {
    throw new Error("Jev returned an invalid move score.");
  }
  // Jev scores use zero-based rubric positions; display them on a 1–10 scale.
  return Math.round((answer.score + 1) * 10) / 10;
}
