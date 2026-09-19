import { getServiceToken } from "convex/server";
import { rateChessMove } from "./convex/lib/jev";

jest.mock("convex/server", () => ({ getServiceToken: jest.fn() }));

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

test("sends the move's positions with gateway authentication and converts the score", async () => {
  jest.mocked(getServiceToken).mockResolvedValue("test-token");
  global.fetch = jest.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        answers: { moveQuality: { type: "score", score: 6.25 } },
      })
    )
  );

  expect(await rateChessMove("", "e4")).toBe(7.3);
  const [url, options] = jest.mocked(global.fetch).mock.calls[0];
  expect(new URL(String(url)).pathname).toBe("/alpha/decisions");
  expect(options?.headers).toEqual(
    expect.objectContaining({ Authorization: "Bearer test-token" })
  );
  const request = JSON.parse(options?.body as string);
  expect(request.model).toBe("typesafe/jev-1.13");
  expect(request.state.player).toBe("white");
  expect(request.state.before).not.toBe(request.state.after);
  expect(request.questions.moveQuality.criteria).toHaveLength(10);
});

test.each([0, 9])(
  "maps rubric endpoint %s onto the 1–10 rating scale",
  async (score) => {
    jest.mocked(getServiceToken).mockResolvedValue("test-token");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          answers: { moveQuality: { type: "score", score } },
        })
      )
    );
    expect(await rateChessMove("", "e4")).toBe(score + 1);
  }
);

test("rejects a score outside the rubric", async () => {
  jest.mocked(getServiceToken).mockResolvedValue("test-token");
  global.fetch = jest.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        answers: { moveQuality: { type: "score", score: 10 } },
      })
    )
  );
  await expect(rateChessMove("", "e4")).rejects.toThrow("invalid move score");
});

test("reports upstream failures without treating them as ratings", async () => {
  jest.mocked(getServiceToken).mockResolvedValue("test-token");
  global.fetch = jest
    .fn()
    .mockResolvedValue(new Response("unavailable", { status: 503 }));
  await expect(rateChessMove("", "e4")).rejects.toThrow("failed (503)");
});
