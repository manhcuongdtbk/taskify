import { describe, expect, test, vi } from "vitest";

import { fetcher } from "./fetcher";

describe("fetcher", () => {
  test("returns the parsed JSON body for an ok response", async () => {
    const json = vi.fn().mockResolvedValue({ id: "card_1" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json,
    });
    vi.stubGlobal("fetch", fetchMock);

    const body = await fetcher<{ id: string }>("/api/cards/card_1");

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

    await expect(fetcher("/api/missing")).rejects.toThrow(
      "Request failed: 404 Not Found",
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/missing");
    expect(json).not.toHaveBeenCalled();
  });
});
