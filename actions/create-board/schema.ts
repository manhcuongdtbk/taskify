import * as z from "zod";

// https-only: these URLs are painted into CSS background-image via cssUrl().
// TODO: (docs/data.md) allowlist Unsplash hosts; server-verify photo by id.
const httpsUrlSchema = z.url({ protocol: /^https$/ });

export const CreateBoardSchema = z.object({
  title: z.string().trim().min(3),
  // Nested so the picker's five values share one error slot, keyed `image`.
  image: z.object({
    id: z.string().trim().min(1),
    thumbUrl: httpsUrlSchema,
    fullUrl: httpsUrlSchema,
    linkHTML: httpsUrlSchema,
    userName: z.string().trim().min(1),
  }),
});
