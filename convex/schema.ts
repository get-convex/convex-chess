import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  games: defineTable({
    pgn: v.string(),
    player1: v.union(v.id("users"), v.literal("Computer"), v.null()),
    player2: v.union(v.id("users"), v.literal("Computer"), v.null()),
    finished: v.boolean(),
  })
    .index("finished", ["finished"])
    .searchIndex("search_pgn", { searchField: "pgn" }),
  analysis: defineTable({
    game: v.id("games"),
    moveIndex: v.number(),
    analysis: v.string(),
  })
    .index("by_game_index", ["game", "moveIndex"])
    .searchIndex("search_analysis", { searchField: "analysis" }),
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Additional fields
    profilePic: v.optional(v.union(v.string(), v.null())),
    // For old Auth0 accounts
    tokenIdentifier: v.optional(v.string()),
  })
    .index("email", ["email"])
    .searchIndex("search_name", { searchField: "name" }),
});
