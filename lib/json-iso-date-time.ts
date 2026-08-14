import { parseISO } from "date-fns";
import * as z from "zod";

/**
 * JSON DateTime → `Date`. Wire strings are ISO-8601 from `JSON.stringify(Date)`
 * (`toISOString`, UTC `Z`). Parse with date-fns — not `z.coerce.date()` /
 * `new Date(string)`. See `docs/conventions.md`.
 */
export const JsonIsoDateTimeSchema = z.iso
  .datetime()
  .transform((iso) => parseISO(iso));
