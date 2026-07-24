import { z } from "zod";

export const CreateBoard = z.object({
  title: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Title is required" : "Title is required", // https://zod.dev/v4/changelog?id=drops-invalid_type_error-and-required_error#drops-invalid_type_error-and-required_error
    })
    .min(3, { error: "Title is too short" }),
});
