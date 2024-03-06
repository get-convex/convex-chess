import { api } from "./convex/_generated/api";
import { ConvexTestingHelper } from "./testing/ConvexTestingHelper";

describe('games', () => {
  let t: ConvexTestingHelper
  beforeEach(() => {
    t = new ConvexTestingHelper()
  })

  afterEach(async () => {
    await t.mutation(api.testing.clearAll.default, {})
    await t.close()
  })


  test('sample', async () => {
    const ongoingGames = await t.query(api.games.ongoingGames, {});
    expect(ongoingGames.length).toEqual(0)
  });
});
