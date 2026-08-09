"use client";

import { type ChangeEventHandler, type ComponentRef, type Ref } from "react";
import { useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type FieldErrors } from "@/lib/create-safe-action.types";
import { FormErrors } from "./form-errors";

type FormInputSharedProps = {
  id: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  errors?: FieldErrors;
  className?: string;
  onBlur?: () => void;
  ref?: Ref<ComponentRef<"input">>;
};

/** Controlled: `value` and `onChange` are a required pair (no `defaultValue`). */
type FormInputControlledProps = FormInputSharedProps & {
  value: string;
  onChange: ChangeEventHandler<ComponentRef<"input">>;
  defaultValue?: never;
};

/** Uncontrolled: optional `defaultValue`; `onChange` may still listen without owning the value. */
type FormInputUncontrolledProps = FormInputSharedProps & {
  value?: never;
  onChange?: ChangeEventHandler<ComponentRef<"input">>;
  defaultValue?: string;
};

type FormInputProps = FormInputControlledProps | FormInputUncontrolledProps;

export const FormInput = ({
  id,
  label,
  type,
  placeholder,
  required,
  disabled,
  errors,
  className,
  defaultValue,
  value,
  onChange,
  onBlur,
  ref,
}: FormInputProps) => {
  const { pending } = useFormStatus();
  const isControlled = value !== undefined;

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {label ? (
          <Label
            htmlFor={id}
            className="text-xs font-semibold text-neutral-700"
          >
            {label}
          </Label>
        ) : null}
        <Input
          onBlur={onBlur}
          onChange={onChange}
          {...(isControlled ? { value } : { defaultValue })}
          // Runtime guard if types are bypassed: controlled without onChange would otherwise stick.
          readOnly={isControlled && !onChange}
          ref={ref}
          required={required}
          name={id}
          id={id}
          placeholder={placeholder}
          type={type}
          disabled={pending || disabled}
          className={cn("h-7 px-2 py-1 text-sm", className)}
          aria-describedby={`${id}-error`}
        />
      </div>
      <FormErrors id={id} errors={errors} />
    </div>
  );
};
