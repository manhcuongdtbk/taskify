"use client";

import { type ComponentProps } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type FieldErrors } from "@/lib/create-safe-action.types";
import { FormErrors } from "./form-errors";
import { useFormStatus } from "react-dom";

type FormTextareaProps = {
  id: string;
  label?: string;
  errors?: FieldErrors;
} & Pick<
  ComponentProps<"textarea">,
  | "placeholder"
  | "required"
  | "disabled"
  | "className"
  | "defaultValue"
  | "onBlur"
  | "onClick"
  | "onKeyDown"
  | "ref"
>;

export const FormTextarea = ({
  id,
  label,
  placeholder,
  required,
  disabled,
  errors,
  className,
  onBlur,
  onClick,
  onKeyDown,
  defaultValue,
  ref,
}: FormTextareaProps) => {
  const { pending } = useFormStatus();

  return (
    <div className="w-full space-y-2">
      <div className="w-full space-y-1">
        {label ? (
          <Label
            htmlFor={id}
            className="text-xs font-semibold text-neutral-700"
          >
            {label}
          </Label>
        ) : null}
        <Textarea
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onClick={onClick}
          ref={ref}
          required={required}
          placeholder={placeholder}
          name={id}
          id={id}
          disabled={pending || disabled}
          className={cn(
            "resize-none shadow-sm ring-0 outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
            className,
          )}
          aria-describedby={`${id}-error`}
          defaultValue={defaultValue}
        />
        <FormErrors id={id} errors={errors} />
      </div>
    </div>
  );
};
