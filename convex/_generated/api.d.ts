/* eslint-disable */
/**
 * Generated API.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * Generated by convex@0.13.0.
 * To regenerate, run `npx convex codegen`.
 * @module
 */

import type { ApiFromModules } from "convex/api";
import type * as engine from "../engine";
import type * as games from "../games";
import type * as search from "../search";
import type * as users from "../users";
import type * as utils from "../utils";

/**
 * A type describing your app's public Convex API.
 *
 * This `API` type includes information about the arguments and return
 * types of your app's query and mutation functions.
 *
 * This type should be used with type-parameterized classes like
 * `ConvexReactClient` to create app-specific types.
 */
export type API = ApiFromModules<{
  engine: typeof engine;
  games: typeof games;
  search: typeof search;
  users: typeof users;
  utils: typeof utils;
}>;
