import { denormalizePlayerNames } from "./games";
import { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";

export interface Game extends Doc<"games"> {
  player1Name: string;
  player2Name: string;
  moveIndex?: number;
  resultContext?: string;
}

type SearchResult = {
  users: Doc<"users">[];
  games: Game[];
};

export default query(async ({ db }, { query }: { query: string }) => {
  const users = await db
    .query("users")
    .withSearchIndex("search_name", (q) => q.search("name", query))
    .collect();
  const games = await db
    .query("games")
    .withSearchIndex("search_pgn", (q) => q.search("pgn", query))
    .take(5);
  const analyses = await db
    .query("analysis")
    .withSearchIndex("search_analysis", (q) => q.search("analysis", query))
    .take(5);
  let denormalizedGames = [];
  for (const game of games) {
    const denormalizedGame = {
      ...(await denormalizePlayerNames(db, game)),
      // Would love snippeting here
      resultContext: game.pgn,
    };
    denormalizedGames.push(denormalizedGame);
  }
  for (const analysis of analyses) {
    const game = await db.get(analysis.game);
    const denormalizedGame = {
      ...(await denormalizePlayerNames(db, game!)),
      moveIndex: analysis.moveIndex,
      // Would love snippeting here
      resultContext: analysis.analysis,
    };
    denormalizedGames.push(denormalizedGame);
  }
  return { users, games: denormalizedGames as Game[] };
});
