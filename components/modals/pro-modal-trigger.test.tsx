import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";

import { useProModalStore } from "@/stores/use-pro-modal-store";

import { ProModalTrigger } from "./pro-modal-trigger";

describe("ProModalTrigger", () => {
  beforeEach(() => {
    useProModalStore.getState().close();
  });

  test("opens the pro modal when the trigger is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ProModalTrigger>
        <span>Upgrade</span>
      </ProModalTrigger>,
    );

    await user.click(screen.getByRole("button", { name: "Upgrade" }));

    expect(useProModalStore.getState().isOpen).toBe(true);
  });

  test("is a single native button wrapping its children", () => {
    render(
      <ProModalTrigger>
        <span>Upgrade</span>
      </ProModalTrigger>,
    );

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeInTheDocument();
  });
});
