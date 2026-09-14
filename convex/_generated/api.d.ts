/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cronFunctions from "../cronFunctions.js";
import type * as crons from "../crons.js";
import type * as engine from "../engine.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as index from "../index.js";
import type * as lib_openai from "../lib/openai.js";
import type * as search from "../search.js";
import type * as testing from "../testing.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cronFunctions: typeof cronFunctions;
  crons: typeof crons;
  engine: typeof engine;
  games: typeof games;
  http: typeof http;
  index: typeof index;
  "lib/openai": typeof lib_openai;
  search: typeof search;
  testing: typeof testing;
  users: typeof users;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  aggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregate">;
};
