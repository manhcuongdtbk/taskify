import { z } from "zod";

export const UpdateBoard = z.object({
  title: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Title is required" : "Title is required",
    })
    .min(3, { error: "Title is too short" }),
  id: z.string(),
});
