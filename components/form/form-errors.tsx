import { XCircle } from "lucide-react";

import { type FieldErrors } from "@/lib/create-safe-action.types";

interface FormErrorsProps {
  id: string;
  errors?: FieldErrors;
}

export const FormErrors = ({ id, errors }: FormErrorsProps) => {
  const messages = errors?.[id];

  if (!messages?.length) return null;

  return (
    <div
      id={`${id}-error`}
      role="status"
      aria-live="polite"
      className="mt-2 text-xs text-rose-500"
    >
      {messages.map((error) => (
        <div
          key={error}
          className="flex items-center rounded-xs border border-rose-500 bg-rose-500/10 p-2 font-medium"
        >
          <XCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      ))}
    </div>
  );
};
