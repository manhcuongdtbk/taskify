/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 *
 * MSW resolver that never responds (`delay("infinite")`). Pair with
 * `stillPending` in handler suites.
 */

import { delay, type HttpResponseResolver } from "msw";

export const pendingForever: HttpResponseResolver = () => delay("infinite");
