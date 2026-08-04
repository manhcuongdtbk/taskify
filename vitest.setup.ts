/**
 * Vitest setup — loaded via `setupFiles` in `vitest.config.mts`.
 *
 * Why: Vitest matchers aren’t DOM-aware; Testing Library queries but doesn’t
 * assert. jest-dom adds `toBeInTheDocument()` etc. (matchers only — not Jest).
 *
 * @see docs/testing.md
 * @see https://github.com/testing-library/jest-dom#with-vitest
 */
import "@testing-library/jest-dom/vitest";
