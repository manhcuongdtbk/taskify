import { useState, useCallback } from "react";

import {
  type ActionState,
  type FieldErrors,
  type FormErrors,
  type ServerError,
} from "@/lib/create-safe-action.types";

type Action<TInput, TOutput> = (
  data: TInput,
) => Promise<ActionState<TInput, TOutput>>;

interface UseActionOptions<TOutput> {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: ServerError) => void;
  onComplete?: () => void;
}

export const useAction = <TInput, TOutput>(
  action: Action<TInput, TOutput>,
  options: UseActionOptions<TOutput> = {},
) => {
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<TInput> | undefined
  >(undefined);
  const [formErrors, setFormErrors] = useState<FormErrors | undefined>(
    undefined,
  );
  const [serverError, setServerError] = useState<ServerError | undefined>(
    undefined,
  );
  const [data, setData] = useState<TOutput | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (input: TInput) => {
      setIsLoading(true);

      try {
        const result = await action(input);

        if (!result) return;

        setFieldErrors(result.fieldErrors);
        setFormErrors(result.formErrors);

        if (result.serverError) {
          setServerError(result.serverError);
          options.onError?.(result.serverError);
        }

        if (result.data) {
          setData(result.data);
          options.onSuccess?.(result.data);
        }
      } finally {
        setIsLoading(false);
        options.onComplete?.();
      }
    },
    [action, options],
  );

  return {
    execute,
    fieldErrors,
    formErrors,
    serverError,
    data,
    isLoading,
  };
};
