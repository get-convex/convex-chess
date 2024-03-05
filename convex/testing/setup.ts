import { testingMutation } from "./wrappers";
import { Doc, Id } from "../_generated/dataModel";
import { WithoutSystemFields } from "convex/server";
import { getOrCreateUser } from "../users";

export const game = testingMutation(async ({ db }, args: WithoutSystemFields<Doc<"games">>) => {
    return db.insert("games", args)
  });

export const user = testingMutation(async ({ db, auth }) => {
  return getOrCreateUser(db, auth)
});