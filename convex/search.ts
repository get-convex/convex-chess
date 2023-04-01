import { denormalizePlayerNames } from './games'
import { Doc } from './_generated/dataModel'
import { query } from './_generated/server'

export interface Game extends Doc<'games'> {
  kind: 'Game'
  player1Name: string
  player2Name: string
}

export interface User extends Doc<'users'> {
  kind: 'User'
}

export default query(async ({ db }, query: string) => {
  const users = await db
    .query('users')
    .withSearchIndex('search_name', (q) => q.search('name', query))
    .collect()
  const games = await db
    .query('games')
    .withSearchIndex('search_pgn', (q) => q.search('pgn', query))
    .collect()
  let results: (Game | User)[] = []
  results = results.concat(
    users.map((u) => {
      return { ...u, kind: 'User' }
    })
  )
  for (const game of games) {
    results.push(await denormalizePlayerNames(db, game))
  }
  return results
})
