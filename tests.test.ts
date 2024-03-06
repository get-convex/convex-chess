import { api } from "./convex/_generated/api";
import { ConvexError } from "convex/values";
import { TestConvex, setup,  } from "./testing/ConvexTestingHelper";
import schema from "./convex/schema";
import * as games from "./convex/games";
import { getOrCreateUser } from "./convex/users";

describe("games", () => {
  let t: TestConvex<typeof schema>;

  beforeEach(() => {
    t = setup(schema);
  });

  afterEach(() => {
    t.cleanup()
  })

  test("two players can join game", async () => {
    const sarahIdentity = { subject: "test subject 1", issuer: "test issuer", name: "Sarah", tokenIdentifier: "test issuer|test subject 1"}
    t.auth.setUserIdentity(sarahIdentity)
    const gameId = await t.runMutation(games.newGame, {
      player1: "Me",
      player2: null,
    });

    let game = await t.runQuery(games.get, { id: gameId });
    expect(game.player1Name).toEqual("Sarah");

    const leeIdentity = { subject: "test subject 2", issuer: "test issuer", name: "Lee", tokenIdentifier: "abd|def"}
    t.auth.setUserIdentity(leeIdentity)
    await t.runMutation(games.joinGame, { id: gameId });
    game = await t.runQuery(games.get, { id: gameId });
    expect(game.player2Name).toEqual("Lee");

    t.auth.setUserIdentity(sarahIdentity)
    await t.runMutation(games.move, { gameId, from: "c2", to: "c3" });
    game = await t.runQuery(games.get, { id: gameId });
    expect(game.pgn).toEqual("1. c3");

    // Invalid move -- out of turn
    expect(() =>
      t.runMutation(games.move, { gameId, from: "d2", to: "d3" })
    ).rejects.toThrow(ConvexError);
    game = await t.runQuery(games.get, { id: gameId });
    expect(game.pgn).toEqual("1. c3");
  });

  test("game finishes", async () => {
    // Set up data using test only functions
    const sarahIdentity = { subject: "test subject 1", issuer: "test issuer", name: "Sarah", tokenIdentifier: "test issuer|test subject 1"}
    t.auth.setUserIdentity(sarahIdentity)
    const sarahId = await t.run((ctx) => {
      return getOrCreateUser(ctx.db, ctx.auth);
    });

    const leeIdentity = { subject: "test subject 2", issuer: "test issuer", name: "Lee", tokenIdentifier: "abd|def"}
    t.auth.setUserIdentity(leeIdentity)
    const leeId = await t.run((ctx) => {
      return getOrCreateUser(ctx.db, ctx.auth)
    });

    // Two moves before the end of the game
    const gameAlmostFinishedPgn =
      "1. Nf3 Nf6 2. d4 Nc6 3. e4 Nxe4 4. Bd3 Nf6 5. Nc3 Nxd4 6. Nxd4 b6 7. O-O Bb7 8. g3 Qb8 9. Be3 c5 10. Nf5 a6 11. f3 b5 12. Bxc5 d6 13. Bd4 b4 14. Bxf6 gxf6 15. Ne2 e6 16. Nfd4 e5 17. Nf5 Qc8 18. Ne3 d5 19. Re1 d4 20. Nf1 Bh6 21. Nxd4 O-O 22. Ne2 f5 23. a3 bxa3 24. bxa3 Re8 25. Qb1 e4 26. fxe4 fxe4 27. Bxe4 Rxe4 28. Ne3 Rxe3 29. c3 Be4 30. Qb2 Bg7 31. g4 Bxc3 32. Nxc3 Rxc3 33. Rxe4 Kg7 34. g5 Kg6 35. Re7 Rc7 36. Qf6+ Kh5 37. Re5 Rb8 38. Rae1 Rc6 39. Qxf7+ Kg4 40. Qxh7 Rb7 41. Qd3 Rbc7 42. Rd1 Rc3 43. Qd4+ Kh5 44. a4 R7c4 45. g6+ Kxg6 46. Qd6+ Kf7 47. Re7+ Kf8 48. Rc7+";

    const gameId = await t.run((ctx) => {
      return ctx.db.insert("games", {
        player1: sarahId,
        player2: leeId,
        pgn: gameAlmostFinishedPgn,
        finished: false,
      })
    });

    // Test that winning the game marks the game as finished
    await t.runMutation(games.move, { gameId, from: "f8", to: "e8" });
    let game = await t.runQuery(games.get, { id: gameId });
    expect(game.finished).toBe(false);

    t.auth.setUserIdentity(sarahIdentity)
    await t.runMutation(games.move, { gameId, from: "d6", to: "e7" });
    game = await t.runQuery(games.get, { id: gameId });
    expect(game.finished).toBe(true);
  });
});
