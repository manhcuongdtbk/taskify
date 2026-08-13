/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 *
 * MSW Node server for Vitest (jsdom). Lifecycle lives in `vitest.setup.ts`.
 * @see https://mswjs.io/docs/quick-start/
 */

import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);
