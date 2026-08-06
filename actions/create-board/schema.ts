import { z } from "zod";

export const CreateBoard = z.object({
  title: z.string().min(3),
  // Nested so the picker's five values share one error slot, keyed `image`.
  image: z.object({
    id: z.string().min(1),
    thumbUrl: z.url(),
    fullUrl: z.url(),
    linkHTML: z.url(),
    userName: z.string().min(1),
  }),
});
