import { denormalizePlayerNames } from "./games";
import { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";

export interface Game extends Doc<"games"> {
    player1Name: string,
    player2Name: string,
};

type SearchResult = { 
    users: Doc<"users">[],
    games: Game[],
}

export default query(async ({ db }, { query }: { query: string; }) => {
    const users = await db.query("users").withSearchIndex("search_name", q =>
        q.search("name", query)
    ).collect();
    const games = await db.query("games").withSearchIndex("search_pgn",  q =>
        q.search("pgn", query)
    ).collect();
    let normalizedGames = [];
    for (const game of games) {
        normalizedGames.push(await denormalizePlayerNames(db, game));
    }
    return { users, games: normalizedGames }
})
