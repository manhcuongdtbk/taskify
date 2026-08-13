import { http } from "msw";
import { describe, expect, test } from "vitest";

import { server } from "../../server";
import { pendingForever } from "./pending-forever";
import { stillPending } from "./still-pending";

describe("pendingForever", () => {
  test("keeps fetch pending when used as an MSW resolver", async () => {
    server.use(http.get("/api/pending-forever", pendingForever));

    await expect(stillPending(fetch("/api/pending-forever"))).resolves.toBe(
      "pending",
    );
  });
});
