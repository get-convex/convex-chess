import { ConvexTestingHelper } from "convex-helpers/testing"
import { api } from "./convex/_generated/api";
describe("games", () => {
  let t: ConvexTestingHelper;

  beforeEach(() => {
    t = new ConvexTestingHelper();
  })

  afterEach(async () => {
    await t.mutation(api.testing.clearAll, {})
    await t.close()
  })

  test("simple", async () => {
    const games = await t.query(api.games.ongoingGames, {})
    expect(games.length).toStrictEqual(0)
  })
})