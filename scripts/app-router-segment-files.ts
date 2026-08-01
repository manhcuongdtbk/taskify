/**
 * App Router segment-file basename matchers.
 * Shared by `scripts/check-route-export-names.ts` and lint-staged (no side effects).
 */

export const PAGE_LAYOUT_BASENAME_RE = /^(page|layout)\.(tsx|ts|jsx|js)$/;
export const ROUTE_HANDLER_BASENAME_RE = /^route\.(tsx|ts|jsx|js)$/;

/** True when `filePath` is an App Router `page` / `layout` / `route` segment file. */
export const isAppRouterSegmentFile = (filePath: string): boolean => {
  const base = filePath.replace(/\\/g, "/").split("/").pop() ?? "";
  return (
    PAGE_LAYOUT_BASENAME_RE.test(base) || ROUTE_HANDLER_BASENAME_RE.test(base)
  );
};
