import { defineSchema, defineTable, s } from 'convex/schema'

export default defineSchema({
  games: defineTable({
    pgn: s.string(),
    player1: s.union(s.id('users'), s.literal<string>('Computer'), s.null()),
    player2: s.union(s.id('users'), s.literal<string>('Computer'), s.null()),
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
