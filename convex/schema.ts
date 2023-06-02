import { defineSchema, defineTable } from 'convex/schema'
import { v } from 'convex/values'

export default defineSchema({
  games: defineTable({
    pgn: v.string(),
    player1: v.union(
      v.id("users"),
      v.literal<string>("Computer"),
      v.null(),
    ),
    player2: v.union(
      v.id("users"),
      v.literal<string>("Computer"),
      v.null(),
    ),
    finished: v.boolean(),
  })
  .index("finished", ["finished"])
  .searchIndex("search_pgn", { searchField: "pgn" }),
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
    profilePic: v.optional(v.union(v.string(), v.null())),
  })
  .index("by_token", ["tokenIdentifier"])
  .searchIndex("search_name", { searchField: "name" }),
})
