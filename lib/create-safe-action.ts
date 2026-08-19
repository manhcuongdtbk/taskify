import { startCase } from "es-toolkit/string";
import * as z from "zod";

import { type ActionState } from "./create-safe-action.types";
import { type OrgAuth } from "./auth/get-org-auth.types";
import { getOrgAuth } from "./auth/get-org-auth";

const fieldLabel = (path: PropertyKey[] | undefined) => {
  const field = path?.findLast(
    (part): part is string => typeof part === "string",
  );

  if (!field) return "Field";

  return startCase(field).replace(/\bId\b/g, "ID");
};

/**
 * Phrasing avoids a copula so it reads correctly for singular and plural field
 * names alike ("Missing Tags", not "Tags is required").
 */
const actionValidationError: z.core.$ZodErrorMap = (issue) => {
  const label = fieldLabel(issue.path);

  if (issue.code === "invalid_type") {
    return issue.input === undefined ? `Missing ${label}` : `Invalid ${label}`;
  }

  // A `.refine()` that carries its own copy never reaches this map.
  if (issue.code === "custom") return `Invalid ${label}`;

  if (issue.code === "too_small" && issue.origin === "string") {
    const minimum = Number(issue.minimum);

    return `${label} must be at least ${minimum} ${minimum === 1 ? "character" : "characters"}`;
  }

  return undefined;
};

/**
 * Wrap a Server Action handler with Zod validation and org auth.
 *
 * The handler receives validated input and an {@link OrgAuth}
 * (`{ userId, orgId }`) verified via {@link getOrgAuth} before the handler
 * runs. If the caller is not authenticated, the action short-circuits with
 * `{ serverError: "Unauthorized" }` — no handler code needed.
 *
 * Following Next.js data-security guidance, every Server Action must re-verify
 * authentication inside the action itself (not rely on page-level checks).
 * Centralizing the check here ensures no action forgets it.
 */
export const createSafeAction = <TInput, TOutput>(
  schema: z.ZodType<TInput>,
  handler: (
    input: TInput,
    orgAuth: OrgAuth,
  ) => Promise<ActionState<TInput, TOutput>>,
) => {
  return async (input: TInput): Promise<ActionState<TInput, TOutput>> => {
    const validationResult = schema.safeParse(input, {
      error: actionValidationError,
    });

    if (!validationResult.success) {
      const { fieldErrors, formErrors } = z.flattenError(
        validationResult.error,
      );

      return {
        fieldErrors,
        ...(formErrors.length > 0 && { formErrors }),
      };
    }

    const orgAuth = await getOrgAuth();

    if (!orgAuth) {
      return { serverError: "Unauthorized" };
    }

    return handler(validationResult.data, orgAuth);
  };
};
