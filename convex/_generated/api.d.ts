/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chat from "../chat.js";
import type * as combat from "../combat.js";
import type * as game from "../game.js";
import type * as gameEnd from "../gameEnd.js";
import type * as lobby from "../lobby.js";
import type * as movement from "../movement.js";
import type * as squadBuilder from "../squadBuilder.js";
import type * as sudo from "../sudo.js";
import type * as timers from "../timers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  combat: typeof combat;
  game: typeof game;
  gameEnd: typeof gameEnd;
  lobby: typeof lobby;
  movement: typeof movement;
  squadBuilder: typeof squadBuilder;
  sudo: typeof sudo;
  timers: typeof timers;
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

export declare const components: {};
