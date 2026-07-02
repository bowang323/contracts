/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as contracts from "../contracts.js";
import type * as lib_contracts from "../lib/contracts.js";
import type * as lib_pageFormat from "../lib/pageFormat.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_templates from "../lib/templates.js";
import type * as pdf from "../pdf.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  contracts: typeof contracts;
  "lib/contracts": typeof lib_contracts;
  "lib/pageFormat": typeof lib_pageFormat;
  "lib/password": typeof lib_password;
  "lib/templates": typeof lib_templates;
  pdf: typeof pdf;
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
