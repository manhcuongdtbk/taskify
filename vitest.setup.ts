/**
 * Vitest setup — loaded via `setupFiles` in `vitest.config.mts`.
 *
 * Why: Vitest matchers aren’t DOM-aware; Testing Library queries but doesn’t
 * assert. jest-dom adds `toBeInTheDocument()` etc. (matchers only — not Jest).
 * Auto-cleanup: we don’t use Vitest `globals`, so RTL’s framework hook doesn’t
 * run — clean the DOM after each test (same as RTL’s Vitest recipe).
 * MSW: Node `setupServer` lifecycle so Query/`fetcher` HTTP is intercepted
 * without real network (docs/testing.md · lib/testing/msw/).
 *
 * @see docs/testing.md
 * @see https://github.com/testing-library/jest-dom#with-vitest
 * @see https://testing-library.com/docs/react-testing-library/setup#cleanup
 * @see https://mswjs.io/docs/quick-start/
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./lib/testing/msw/server";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});
