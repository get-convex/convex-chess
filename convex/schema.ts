import { defineSchema, defineTable, s } from 'convex/schema'

export default defineSchema({
  games: defineTable({
    pgn: s.string(),
    title: s.string(),
    player1: s.union(
      s.id("users"),
      s.literal<string>("Computer"),
      s.null(),
    ),
    player2: s.union(
      s.id("users"),
      s.literal<string>("Computer"),
      s.null(),
    ),
    finished: s.boolean(),
  }).index("finished", ["finished"]),
  users: defineTable({
    name: s.string(),
    tokenIdentifier: s.string(),
  }).index("by_token", ["tokenIdentifier"]),
})
