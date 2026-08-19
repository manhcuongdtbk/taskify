import { parseISO } from "date-fns";
import * as z from "zod";

/**
 * JSON DateTime → `Date`. Wire strings are ISO-8601 (`JSON.stringify(Date)` is
 * UTC `Z`; `offset: true` also accepts `+00:00` / numeric offsets). Parse with
 * date-fns — not `z.coerce.date()` / `new Date(string)`. See `docs/conventions.md`.
 */
export const JsonIsoDateTimeSchema = z.iso
  .datetime({ offset: true })
  .transform((iso) => parseISO(iso));
