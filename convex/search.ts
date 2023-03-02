import { denormalizePlayerNames } from "./games";
import { Document } from "./_generated/dataModel";
import { query } from "./_generated/server";

export interface Game extends Document<"games"> {
    player1Name: string,
    player2Name: string,
};

export default query(async ({ db }, query: string) => {
    const users = await db.query("users").withSearchIndex("search_name", q =>
        q.search("name", query)
    ).collect();
    const games = await db.query("games").withSearchIndex("search_pgn",  q =>
        q.search("pgn", query)
    ).collect();
    let results : (Game|Document<"users">)[] = [];
    results = results.concat(users);
    for (const game of games) {
        results.push(await denormalizePlayerNames(db, game));
    }
    return results;
})
