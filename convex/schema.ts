import { defineSchema, defineTable, s } from 'convex/schema'

export default defineSchema({
  messages: defineTable({
    author: s.string(),
    body: s.string(),
  }),
  games: defineTable({
    pgn: s.string(),
    player1: s.union(
      s.literal<string>("random"),
      s.null(),
    ),
    player2: s.union(
      s.literal<string>("random"),
      s.null(),
    ),
    finished: s.boolean(),
  }).index("finished", ["finished"])
})
