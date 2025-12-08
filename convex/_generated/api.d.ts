/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as maintenance from "../maintenance.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as offers from "../offers.js";
import type * as portfolio from "../portfolio.js";
import type * as reports from "../reports.js";
import type * as requests from "../requests.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  maintenance: typeof maintenance;
  messages: typeof messages;
  notifications: typeof notifications;
  offers: typeof offers;
  portfolio: typeof portfolio;
  reports: typeof reports;
  requests: typeof requests;
  reviews: typeof reviews;
  seed: typeof seed;
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

export declare const components: {};
