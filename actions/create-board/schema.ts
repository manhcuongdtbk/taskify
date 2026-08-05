import { z } from "zod";

export const CreateBoard = z.object({
  title: z.string().min(3),
  image: z.string(),
});
