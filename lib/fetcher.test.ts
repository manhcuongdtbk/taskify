import { describe, expect, test, vi } from "vitest";
import * as z from "zod";

import { fetcher } from "./fetcher";

const CardIdJsonSchema = z.object({
  id: z.string().trim(),
});

describe("fetcher", () => {
  test("returns schema output for an ok JSON body", async () => {
    const json = vi.fn().mockResolvedValue({ id: "card_1" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json,
    });
    vi.stubGlobal("fetch", fetchMock);

    const body = await fetcher("/api/cards/card_1", CardIdJsonSchema);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/cards/card_1");
    expect(json).toHaveBeenCalledOnce();
    expect(body).toStrictEqual({ id: "card_1" });
  });

  test("throws with status and statusText when the response is not ok", async () => {
    const json = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetcher("/api/missing", CardIdJsonSchema)).rejects.toThrow(
      "Request failed: 404 Not Found",
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/missing");
    expect(json).not.toHaveBeenCalled();
  });

  test("throws when the JSON body fails the schema", async () => {
    const json = vi.fn().mockResolvedValue({ id: 1 });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetcher("/api/cards/card_1", CardIdJsonSchema),
    ).rejects.toBeInstanceOf(z.ZodError);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/cards/card_1");
    expect(json).toHaveBeenCalledOnce();
  });
});
