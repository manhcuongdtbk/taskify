/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 *
 * Vitest has no pending-promise matcher; awaiting a hung `fetch` would hit
 * the test timeout. Race a short timer instead. Fulfill → `"fulfilled"`;
 * reject propagates (a failure is not pending).
 */

const PENDING_WINDOW_MS = 50;

export const stillPending = (promise: Promise<unknown>) =>
  Promise.race([
    promise.then(() => "fulfilled" as const),
    new Promise<"pending">((resolve) => {
      setTimeout(() => resolve("pending"), PENDING_WINDOW_MS);
    }),
  ]);
