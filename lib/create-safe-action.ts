import { z } from "zod";

export type FieldErrors<T> = {
  [K in keyof T]: string[];
};

export type ActionState<TInput, TOutput> = {
  fieldErrors?: FieldErrors<TInput>;
  error?: string | null;
  data?: TOutput;
};

export const createSafeAction = <TInput, TOutput>(
  schema: z.Schema<TInput>, // TODO: use something non deprecated instead of `z.Schema`
  handler: (validatedData: TInput) => Promise<ActionState<TInput, TOutput>>,
) => {
  return async (data: TInput): Promise<ActionState<TInput, TOutput>> => {
    const validationResult = schema.safeParse(data);

    if (!validationResult.success) {
      return {
        fieldErrors: validationResult.error.flatten()
          .fieldErrors as FieldErrors<TInput>, // TODO: upgrade zod related code to use non deprecated code. More info: https://zod.dev/v4/changelog?id=deprecates-flatten#deprecates-flatten
      };
    }

    return handler(validationResult.data);
  };
};
