import { describe, expect, test, vi } from "vitest";
import * as z from "zod";

import { createSafeAction } from "./create-safe-action";
import {
  tooSmallNumber,
  tooBigString,
} from "@/lib/testing/zod/default-issue-messages";

const Schema = z.object({
  title: z.string().trim().min(3),
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

    const result = await action({ title: "Roadmap" });

    expect(handler).toHaveBeenCalledExactlyOnceWith({ title: "Roadmap" });
    expect(result).toStrictEqual({ data: "Roadmap" });
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

      const result = await action(input as z.input<typeof Schema>);

      expect(handler).not.toHaveBeenCalled();
      expect(result).toStrictEqual({
        fieldErrors: { title: [expected] },
      });
    },
  );

  test.for([
    {
      case: "camelCase names ending in id",
      schema: z.object({ boardId: z.string().trim() }),
      input: { boardId: 42 },
      expected: { boardId: ["Invalid Board ID"] },
    },
    {
      case: "plural field names, which no copula would fit",
      schema: z.object({ tags: z.array(z.string().trim()) }),
      input: {},
      expected: { tags: ["Missing Tags"] },
    },
    {
      case: "array items, which are keyed by their field",
      schema: z.object({ tags: z.array(z.string().trim()) }),
      input: { tags: [1] },
      expected: { tags: ["Invalid Tags"] },
    },
    {
      case: "paths that carry no field name",
      schema: z.array(z.string().trim()),
      input: [1],
      expected: { 0: ["Invalid Field"] },
    },
  ])("invalid: labels $case", async ({ schema, input, expected }) => {
    await expect(fieldErrorsFor(schema, input)).resolves.toStrictEqual(
      expected,
    );
  });

  test.for([
    {
      case: "labels a refine that carries no copy of its own",
      // Intentionally no refine error — createSafeAction's map must supply "Invalid Image".
      /* eslint-disable zod/require-error-message -- fixture for map fallback */
      schema: z.object({
        image: z
          .string()
          .trim()
          .refine(() => false),
      }),
      /* eslint-enable zod/require-error-message */
      expected: { image: ["Invalid Image"] },
    },
    {
      case: "keeps a refine's own copy, which outranks this map",
      schema: z.object({
        image: z
          .string()
          .trim()
          .refine(() => false, { error: "Pick an image" }),
      }),
      expected: { image: ["Pick an image"] },
    },
  ])("invalid: $case", async ({ schema, expected }) => {
    await expect(fieldErrorsFor(schema, { image: "x" })).resolves.toStrictEqual(
      expected,
    );
  });

  test("invalid: keeps the character count singular when the minimum is 1", async () => {
    await expect(
      fieldErrorsFor(z.object({ title: z.string().trim().min(1) }), {
        title: "",
      }),
    ).resolves.toStrictEqual({
      title: ["Title must be at least 1 character"],
    });
  });

  test.for([
    {
      case: "a string that is too long",
      schema: z.object({ title: z.string().trim().max(3) }),
      input: { title: "Roadmap" },
      expected: { title: [tooBigString(3)] },
    },
    {
      case: "a number below its minimum",
      schema: z.object({ order: z.number().min(3) }),
      input: { order: 1 },
      expected: { order: [tooSmallNumber(3)] },
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
    const SchemaWithRefineSchema = z
      .object({
        start: z.string().trim().optional(),
        end: z.string().trim().optional(),
      })
      .refine((data) => !data.start || !data.end || data.start <= data.end, {
        error: "Start must be before end",
      });
    const handler = vi.fn();
    const action = createSafeAction(SchemaWithRefineSchema, handler);

    const result = await action({ start: "b", end: "a" });

    expect(handler).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      fieldErrors: {},
      formErrors: ["Start must be before end"],
    });
  });

  test("invalid: surfaces root-schema issues on formErrors", async () => {
    const handler = vi.fn();
    const action = createSafeAction(z.string().trim().min(3), handler);

    const result = await action("ab");

    expect(handler).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      fieldErrors: {},
      formErrors: ["Field must be at least 3 characters"],
    });
  });

  test("invalid: leaves serverError unset for schema issues", async () => {
    const action = createSafeAction(Schema, vi.fn());

    await expect(action({} as z.input<typeof Schema>)).resolves.toStrictEqual({
      fieldErrors: { title: ["Missing Title"] },
    });
  });
});
