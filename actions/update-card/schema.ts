import { z } from "zod";

export const UpdateCard = z.object({
  boardId: z.string(),
  description: z.optional(
    z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "Description is required"
            : "Description is required",
      })
      .min(3, { error: "Description is too short" }),
  ),
  title: z.optional(
    z
      .string({
        error: (issue) =>
          issue.input === undefined ? "Title is required" : "Title is required",
      })
      .min(3, { error: "Title is too short" }),
  ),
  id: z.string(),
});
