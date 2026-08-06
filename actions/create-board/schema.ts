import { z } from "zod";

// https-only: these URLs are painted into CSS background-image via cssUrl().
// TODO: (docs/data.md) allowlist Unsplash hosts; server-verify photo by id.
const httpsUrl = z.url({ protocol: /^https$/ });

export const CreateBoard = z.object({
  title: z.string().min(3),
  // Nested so the picker's five values share one error slot, keyed `image`.
  image: z.object({
    id: z.string().min(1),
    thumbUrl: httpsUrl,
    fullUrl: httpsUrl,
    linkHTML: httpsUrl,
    userName: z.string().min(1),
  }),
});
