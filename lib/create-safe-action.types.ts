import * as z from "zod";

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
 * Schema phase of an action result — written by `createSafeAction` when
 * `safeParse` fails. `fieldErrors` + `formErrors` are a pair (Zod flatten).
 */
export type SchemaActionErrors<TInput> = {
  /** Schema issues attached to an input field. Shown under that control. */
  fieldErrors?: FieldErrors<TInput>;
  formErrors?: FormErrors;
};

/**
 * Handler phase of an action result — written by the action handler after
 * validation succeeds. `serverError` + `data` are a pair (failure vs success).
 */
export type HandlerActionResult<TOutput> = {
  serverError?: ServerError;
  data?: TOutput;
};

/**
 * Full result of a `createSafeAction`-wrapped Server Action: schema errors
 * intersected with handler result so clients (`useAction`) consume one bag.
 * Runtime fills one phase at a time — not a discriminated union (yet).
 * See docs/conventions.md.
 */
export type ActionState<TInput, TOutput> = SchemaActionErrors<TInput> &
  HandlerActionResult<TOutput>;
