/**
 * Read a FormData field as a string.
 * `FormData.get` is `string | File | null` — never cast with `as string`.
 * @see docs/data.md
 */
export const formDataString = (formData: FormData, name: string): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};
