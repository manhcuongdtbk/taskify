/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 *
 * Default (happy-path) request handlers for the Vitest MSW server.
 * Domain helpers live as siblings (`card.ts`, …) and are applied with
 * `server.use(...)` — keep this list empty until a handler is safe as a
 * global default.
 *
 * @see https://mswjs.io/docs/best-practices/structuring-handlers/
 */

import { type RequestHandler } from "msw";

export const handlers: RequestHandler[] = [];
