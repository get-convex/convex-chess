import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  games: defineTable({
    pgn: v.string(),
    player1: v.union(v.id('users'), v.literal('Computer'), v.null()),
    player2: v.union(v.id('users'), v.literal('Computer'), v.null()),
    finished: v.boolean(),
  })
    .index('finished', ['finished'])
    .searchIndex('search_pgn', { searchField: 'pgn' }),
  analysis: defineTable({
    game: v.id("games"),
    moveIndex: v.number(),
    analysis: v.string(),
  })
    .index('by_game_index', ['game', 'moveIndex'])
    .searchIndex('search_analysis', { searchField: 'analysis' }),
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
    profilePic: v.optional(v.union(v.string(), v.null())),
  })
    .index('by_token', ['tokenIdentifier'])
    .searchIndex('search_name', { searchField: 'name' }),
})
