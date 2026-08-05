import { startCase } from "es-toolkit/string";
import { z } from "zod";

import { type ActionState, type FieldErrors } from "./create-safe-action.types";

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

  if (issue.code === "too_small" && issue.origin === "string") {
    const minimum = Number(issue.minimum);

    return `${label} must be at least ${minimum} ${minimum === 1 ? "character" : "characters"}`;
  }

  return undefined;
};

export const createSafeAction = <TInput, TOutput>(
  schema: z.ZodType<TInput>,
  handler: (validatedData: TInput) => Promise<ActionState<TInput, TOutput>>,
) => {
  return async (data: TInput): Promise<ActionState<TInput, TOutput>> => {
    const validationResult = schema.safeParse(data, {
      error: actionValidationError,
    });

    if (!validationResult.success) {
      const { fieldErrors, formErrors } = z.flattenError(
        validationResult.error,
      );

      return {
        fieldErrors: fieldErrors as FieldErrors<TInput>,
        ...(formErrors.length > 0 && { formErrors }),
      };
    }

    return handler(validationResult.data);
  };
};
