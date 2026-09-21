import { convexGateway } from "@convex-dev/ai-sdk-provider";
import { experimental_evaluate as evaluate } from "ai";
import { rateChessMove } from "./convex/lib/jev";

jest.mock("@convex-dev/ai-sdk-provider", () => ({
  convexGateway: {
    evaluationModel: jest.fn(() => "test-evaluation-model"),
  },
}));
jest.mock("ai", () => ({ experimental_evaluate: jest.fn() }));

const mockedEvaluate = evaluate as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

test("evaluates the move's positions with the ten-level rubric", async () => {
  mockedEvaluate.mockResolvedValue({
    answers: { moveQuality: { type: "score", score: 6.25 } },
  });

  expect(await rateChessMove("", "e4")).toBe(7.3);
  expect(convexGateway.evaluationModel).toHaveBeenCalledWith(
    "typesafe/jev-1.13"
  );
  expect(mockedEvaluate).toHaveBeenCalledWith(
    expect.objectContaining({
      model: "test-evaluation-model",
      state: expect.objectContaining({
        player: "white",
        move: "e4",
        previousPGN: "",
      }),
      questions: {
        moveQuality: expect.objectContaining({
          type: "score",
          criteria: expect.any(Array),
        }),
      },
      abortSignal: expect.any(AbortSignal),
    })
  );
  const request = mockedEvaluate.mock.calls[0][0];
  expect(request.state.before).not.toBe(request.state.after);
  expect(request.questions.moveQuality.criteria).toHaveLength(10);
});

test.each([0, 9])(
  "maps rubric endpoint %s onto the 1–10 rating scale",
  async (score) => {
    mockedEvaluate.mockResolvedValue({
      answers: { moveQuality: { type: "score", score } },
    });
    expect(await rateChessMove("", "e4")).toBe(score + 1);
  }
);

test("rejects a score outside the rubric", async () => {
  mockedEvaluate.mockResolvedValue({
    answers: { moveQuality: { type: "score", score: 10 } },
  });
  await expect(rateChessMove("", "e4")).rejects.toThrow("invalid move score");
});

test("reports upstream failures without treating them as ratings", async () => {
  mockedEvaluate.mockRejectedValue(new Error("upstream unavailable"));
  await expect(rateChessMove("", "e4")).rejects.toThrow("upstream unavailable");
});
