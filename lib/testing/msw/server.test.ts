import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, test } from "vitest";

import { server } from "./server";

describe("msw server", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  test("intercepts fetch with a runtime handler", async () => {
    server.use(
      http.get("/api/msw-smoke", () =>
        HttpResponse.json({ ok: true as const }),
      ),
    );

    const response = await fetch("/api/msw-smoke");

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toStrictEqual({ ok: true });
  });
});
