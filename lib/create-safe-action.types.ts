import { type z } from "zod";

/**
 * Per-field schema issues from `z.flattenError(…).fieldErrors`.
 * Aliased so ActionState stays aligned with Zod’s flatten shape (optional keys).
 * Default `T` is for form controls that key by string `id`; action results still
 * pass a concrete input type (`FieldErrors<TInput>`).
 */
export type FieldErrors<T = Record<string, unknown>> =
  z.core.$ZodFlattenedError<T>["fieldErrors"];

/** Schema issues with no field path (object `.refine()`, root schema). */
export type FormErrors = string[];

/** Handler failure: auth, not-found, persist. Shown as a toast. */
export type ServerError = string;

/**
 * Full result of a `createSafeAction`-wrapped Server Action.
 * The wrapper fills `fieldErrors` / `formErrors` on schema failure; handlers
 * fill `serverError` / `data`. Clients consume the combined shape.
 * See docs/conventions.md.
 */
export type ActionState<TInput, TOutput> = {
  /** Schema issues attached to an input field. Shown under that control. */
  fieldErrors?: FieldErrors<TInput>;
  formErrors?: FormErrors;
  serverError?: ServerError;
  data?: TOutput;
};
