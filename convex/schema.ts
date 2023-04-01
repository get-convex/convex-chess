import { defineSchema, defineTable } from 'convex/schema'
import { v as s } from 'convex/values'

export const player = s.union(s.id('users'), s.literal('Computer'), s.null())

export default defineSchema({
  games: defineTable({
    pgn: s.string(),
    player1: player,
    player2: player,
    finished: s.boolean(),
  })
    .index('finished', ['finished'])
    .searchIndex('search_pgn', { searchField: 'pgn' }),
  users: defineTable({
    name: s.string(),
    tokenIdentifier: s.string(),
    profilePic: s.union(s.string(), s.null()),
  })
    .index('by_token', ['tokenIdentifier'])
    .searchIndex('search_name', { searchField: 'name' }),
})
