/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 */

import * as z from "zod";

/**
 * `fieldErrors` from a failed Zod `safeParse`.
 * Throwing (not casting) narrows the `safeParse` union: Vitest's
 * `expect(result.success).toBe(false)` does not narrow, and a cast would fail
 * later inside `flattenError` with an unreadable message.
 */
export const safeParseFieldErrors = <T>(result: z.ZodSafeParseResult<T>) => {
  if (result.success) {
    throw new Error("Expected safeParse to fail");
  }

  return z.flattenError(result.error).fieldErrors;
};
