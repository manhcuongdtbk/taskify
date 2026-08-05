import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { createSafeAction } from "./create-safe-action";

const Schema = z.object({
  title: z.string().min(3),
});

const fieldErrorsFor = async (schema: z.ZodType, input: unknown) => {
  const action = createSafeAction(schema, async (data) => ({ data }));

  return (await action(input)).fieldErrors;
};

describe("createSafeAction", () => {
  test("valid: passes parsed data to the handler", async () => {
    const handler = vi.fn(async (data: z.infer<typeof Schema>) => ({
      data: data.title,
    }));
    const action = createSafeAction(Schema, handler);

    await expect(action({ title: "Roadmap" })).resolves.toStrictEqual({
      data: "Roadmap",
    });
    expect(handler).toHaveBeenCalledExactlyOnceWith({ title: "Roadmap" });
  });

  test.for([
    {
      case: "missing",
      input: {},
      expected: "Missing Title",
    },
    {
      case: "wrong type",
      input: { title: 42 },
      expected: "Invalid Title",
    },
    {
      case: "too short",
      input: { title: "ab" },
      expected: "Title must be at least 3 characters",
    },
  ])(
    "invalid: returns friendly field error for $case input",
    async ({ input, expected }) => {
      const handler = vi.fn();
      const action = createSafeAction(Schema, handler);

      await expect(
        action(input as z.input<typeof Schema>),
      ).resolves.toStrictEqual({
        fieldErrors: { title: [expected] },
      });
      expect(handler).not.toHaveBeenCalled();
    },
  );

  test.for([
    {
      case: "camelCase names ending in id",
      schema: z.object({ boardId: z.string() }),
      input: { boardId: 42 },
      expected: { boardId: ["Invalid Board ID"] },
    },
    {
      case: "plural field names, which no copula would fit",
      schema: z.object({ tags: z.array(z.string()) }),
      input: {},
      expected: { tags: ["Missing Tags"] },
    },
    {
      case: "array items, which are keyed by their field",
      schema: z.object({ tags: z.array(z.string()) }),
      input: { tags: [1] },
      expected: { tags: ["Invalid Tags"] },
    },
    {
      case: "paths that carry no field name",
      schema: z.array(z.string()),
      input: [1],
      expected: { 0: ["Invalid Field"] },
    },
  ])("invalid: labels $case", async ({ schema, input, expected }) => {
    await expect(fieldErrorsFor(schema, input)).resolves.toStrictEqual(
      expected,
    );
  });

  test("invalid: keeps the character count singular when the minimum is 1", async () => {
    await expect(
      fieldErrorsFor(z.object({ title: z.string().min(1) }), { title: "" }),
    ).resolves.toStrictEqual({
      title: ["Title must be at least 1 character"],
    });
  });

  test.for([
    {
      case: "a string that is too long",
      schema: z.object({ title: z.string().max(3) }),
      input: { title: "Roadmap" },
      expected: { title: ["Too big: expected string to have <=3 characters"] },
    },
    {
      case: "a number below its minimum",
      schema: z.object({ order: z.number().min(3) }),
      input: { order: 1 },
      expected: { order: ["Too small: expected number to be >=3"] },
    },
  ])(
    "invalid: keeps Zod's message for $case",
    async ({ schema, input, expected }) => {
      await expect(fieldErrorsFor(schema, input)).resolves.toStrictEqual(
        expected,
      );
    },
  );

  test("invalid: surfaces pathless refine issues on formErrors", async () => {
    const SchemaWithRefine = z
      .object({
        start: z.string().optional(),
        end: z.string().optional(),
      })
      .refine((data) => !data.start || !data.end || data.start <= data.end, {
        error: "Start must be before end",
      });
    const handler = vi.fn();
    const action = createSafeAction(SchemaWithRefine, handler);

    await expect(action({ start: "b", end: "a" })).resolves.toStrictEqual({
      fieldErrors: {},
      formErrors: ["Start must be before end"],
    });
    expect(handler).not.toHaveBeenCalled();
  });

  test("invalid: surfaces root-schema issues on formErrors", async () => {
    const handler = vi.fn();
    const action = createSafeAction(z.string().min(3), handler);

    await expect(action("ab" as never)).resolves.toStrictEqual({
      fieldErrors: {},
      formErrors: ["Field must be at least 3 characters"],
    });
    expect(handler).not.toHaveBeenCalled();
  });

  test("invalid: leaves serverError unset for schema issues", async () => {
    const action = createSafeAction(Schema, vi.fn());

    await expect(action({} as z.input<typeof Schema>)).resolves.toStrictEqual({
      fieldErrors: { title: ["Missing Title"] },
    });
  });
});
