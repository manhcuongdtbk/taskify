/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 */

import type { AssetBasic } from "unsplash-js";

/**
 * Return shape for mocked `unsplash.GET("/photos/random", …)`.
 * Wider than a single failure payload so suites can `mockResolvedValue` success
 * (one photo, an array, or `null`) without fighting inference from the default impl.
 */
export type UnsplashGetMockResult = {
  data: AssetBasic | AssetBasic[] | null;
  error: string | null;
};

/** Default failure — FormPicker treats this as empty and falls back to `defaultImages`. */
export const unsplashGetNetworkError: UnsplashGetMockResult = {
  data: null,
  error: "network",
};
