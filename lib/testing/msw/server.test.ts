import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";

import { server } from "./server";

describe("msw server", () => {
  test("intercepts fetch with a runtime handler", async () => {
    server.use(
      http.get("/api/msw-smoke", () => HttpResponse.json({ ok: true })),
    );

    const response = await fetch("/api/msw-smoke");

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toStrictEqual({ ok: true });
  });
});
