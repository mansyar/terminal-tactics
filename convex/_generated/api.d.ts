/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as aiSquadBuilder from "../aiSquadBuilder.js";
import type * as chat from "../chat.js";
import type * as combat from "../combat.js";
import type * as commander from "../commander.js";
import type * as engineer from "../engineer.js";
import type * as game from "../game.js";
import type * as gameEnd from "../gameEnd.js";
import type * as lobby from "../lobby.js";
import type * as mapSelection from "../mapSelection.js";
import type * as movement from "../movement.js";
import type * as players from "../players.js";
import type * as presence from "../presence.js";
import type * as rematch from "../rematch.js";
import type * as squadBuilder from "../squadBuilder.js";
import type * as sudo from "../sudo.js";
import type * as timers from "../timers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiSquadBuilder: typeof aiSquadBuilder;
  chat: typeof chat;
  combat: typeof combat;
  commander: typeof commander;
  engineer: typeof engineer;
  game: typeof game;
  gameEnd: typeof gameEnd;
  lobby: typeof lobby;
  mapSelection: typeof mapSelection;
  movement: typeof movement;
  players: typeof players;
  presence: typeof presence;
  rematch: typeof rematch;
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
