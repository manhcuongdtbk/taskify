import type { Route } from "next";

/** Single cast site for `typedRoutes` — do not export; use `paths.*` instead. */
function route(path: string): Route {
  return path as Route;
}

/**
 * Path helpers for routes that need a `Route` cast under `typedRoutes`.
 *
 * Only optional catch-alls and dynamic templates live here. Static app paths
 * (`"/"`, `"/protected"`, …) stay as inline literals at the call site.
 *
 * Casts go through `route()` above (one assertion), not on every entry.
 *
 * **Common practice:** path helpers / named path constants (`paths.ts`, `routes.ts`, …)
 * show up beside React Router or Vue Router too. This file is *not* those libraries’
 * route table: `app/` still registers routes; we only mirror URLs that need casts.
 * ESLint bans `as Route` outside this file — use `paths.*` at call sites.
 * Details: docs/nextjs.md.
 *
 * @see https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links
 * @see docs/nextjs.md
 */
export const paths = {
  signIn: route("/sign-in"),
  signUp: route("/sign-up"),
  selectOrg: route("/select-org"),
  board: (boardId: string) => route(`/board/${boardId}`),
  organization: (organizationId: string) =>
    route(`/organization/${organizationId}`),
  organizationActivity: (organizationId: string) =>
    route(`/organization/${organizationId}/activity`),
  organizationSettings: (organizationId: string) =>
    route(`/organization/${organizationId}/settings`),
  organizationBilling: (organizationId: string) =>
    route(`/organization/${organizationId}/billing`),
} as const;
