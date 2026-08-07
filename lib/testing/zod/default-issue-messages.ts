/**
 * Test-only — Zod’s current English default issue messages, derived from a
 * failed `safeParse` so schema suites don’t hardcode copy. Names follow Zod
 * issue `code`s (`invalid_type`, `too_small`, …). `invalidType*` helpers are
 * specifically `invalid_type` with `received undefined` (omitted/undefined
 * required values) — not wrong-type payloads. `lib/testing/**` must not be
 * imported by app code (ESLint). See docs/testing.md.
 */

import * as z from "zod";

/**
 * First flattened issue message from a failed `safeParse`
 * (`issues[i].message` via `flattenError`).
 * Prefers pathless `formErrors`, then the first `fieldErrors` entry.
 */
export const issueMessageOf = (result: z.ZodSafeParseResult<unknown>) => {
  if (result.success) {
    throw new Error("Expected safeParse to fail");
  }

  const { formErrors, fieldErrors } = z.flattenError(result.error);
  const issueMessage = formErrors[0] ?? Object.values(fieldErrors).flat()[0];

  if (issueMessage === undefined) {
    throw new Error("Expected at least one issue message");
  }

  return issueMessage;
};

/** `invalid_type` — expected string, received `undefined`. */
export const invalidTypeString = issueMessageOf(
  z.string().trim().safeParse(undefined),
);

/** `invalid_type` — expected object, received `undefined`. */
export const invalidTypeObject = issueMessageOf(
  z.object({}).safeParse(undefined),
);

/** `invalid_type` — expected array, received `undefined`. */
export const invalidTypeArray = issueMessageOf(
  z.array(z.string().trim()).safeParse(undefined),
);

/** `invalid_type` — expected number, received `undefined`. */
export const invalidTypeNumber = issueMessageOf(
  z.number().safeParse(undefined),
);

/** `invalid_type` — expected date, received `undefined`. */
export const invalidTypeDate = issueMessageOf(z.date().safeParse(undefined));

/** `invalid_format` — failed `z.url()` (or https-only url) parse. */
export const invalidFormatUrl = issueMessageOf(z.url().safeParse("not-a-url"));

/** `too_small` — `z.string().min(minimum)`. */
export const tooSmallString = (minimum: number) =>
  issueMessageOf(z.string().trim().min(minimum).safeParse(""));

/** `too_big` — `z.string().max(maximum)`. */
export const tooBigString = (maximum: number) =>
  issueMessageOf(
    z
      .string()
      .trim()
      .max(maximum)
      .safeParse("x".repeat(maximum + 1)),
  );

/** `too_small` — `z.number().min(minimum)`. */
export const tooSmallNumber = (minimum: number) =>
  issueMessageOf(
    z
      .number()
      .min(minimum)
      .safeParse(minimum - 1),
  );
