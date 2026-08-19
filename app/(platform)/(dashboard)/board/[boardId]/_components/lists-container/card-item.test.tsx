import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type DraggableProvided } from "@hello-pangea/dnd";
import { type ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { cardFactory } from "@/lib/testing/factories/card";
import {
  selectCardModalIsOpen,
  useCardModalStore,
} from "@/stores/use-card-modal-store";

const dragHandle = vi.hoisted(() => ({
  role: "button",
  tabIndex: 0,
}));

vi.mock("@hello-pangea/dnd", () => ({
  Draggable: ({
    children,
  }: {
    children: (provided: DraggableProvided) => ReactNode;
  }) =>
    children({
      innerRef: () => {},
      draggableProps: {
        "data-rfd-draggable-context-id": "test",
        "data-rfd-draggable-id": "card",
      },
      dragHandleProps: {
        "data-rfd-drag-handle-draggable-id": "card",
        "data-rfd-drag-handle-context-id": "test",
        role: dragHandle.role,
        tabIndex: dragHandle.tabIndex,
        "aria-describedby": "drag-handle-instruction",
        draggable: true,
        onDragStart: () => {},
      },
    } as DraggableProvided),
}));

import { CardItem } from "./card-item";

describe("CardItem", () => {
  afterEach(() => {
    useCardModalStore.getState().close();
    dragHandle.role = "button";
    dragHandle.tabIndex = 0;
  });

  test("opens the card modal on click", async () => {
    const card = cardFactory.build();
    const user = userEvent.setup();

    render(<CardItem index={0} card={card} />);

    await user.click(screen.getByRole("button", { name: card.title }));

    expect(useCardModalStore.getState().id).toBe(card.id);
    expect(selectCardModalIsOpen(useCardModalStore.getState())).toBe(true);
  });

  test("opens the card modal with Enter", async () => {
    const card = cardFactory.build();
    const user = userEvent.setup();
    let enterDefaultPrevented: boolean | undefined;
    const handleEnterKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent) || event.key !== "Enter") {
        return;
      }

      enterDefaultPrevented = event.defaultPrevented;
    };

    render(<CardItem index={0} card={card} />);

    const handle = screen.getByRole("button", { name: card.title });
    document.addEventListener("keydown", handleEnterKeyDown);
    handle.focus();
    await user.keyboard("{Enter}");
    document.removeEventListener("keydown", handleEnterKeyDown);

    expect(enterDefaultPrevented).toBe(true);
    expect(useCardModalStore.getState().id).toBe(card.id);
    expect(selectCardModalIsOpen(useCardModalStore.getState())).toBe(true);
  });

  test("does not open the card modal with Space", async () => {
    const card = cardFactory.build();
    const user = userEvent.setup();
    let spaceDefaultPrevented: boolean | undefined;
    const handleSpaceKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent) || event.key !== " ") {
        return;
      }

      spaceDefaultPrevented = event.defaultPrevented;
    };

    render(<CardItem index={0} card={card} />);

    const handle = screen.getByRole("button", { name: card.title });
    document.addEventListener("keydown", handleSpaceKeyDown);
    handle.focus();
    await user.keyboard(" ");
    document.removeEventListener("keydown", handleSpaceKeyDown);

    expect(spaceDefaultPrevented).toBe(false);
    expect(useCardModalStore.getState().id).toBeUndefined();
    expect(selectCardModalIsOpen(useCardModalStore.getState())).toBe(false);
  });

  test("ignores keys other than Enter", async () => {
    const card = cardFactory.build();
    const user = userEvent.setup();

    render(<CardItem index={0} card={card} />);

    screen.getByRole("button", { name: card.title }).focus();
    await user.keyboard("{Escape}");

    expect(useCardModalStore.getState().id).toBeUndefined();
    expect(selectCardModalIsOpen(useCardModalStore.getState())).toBe(false);
  });

  test("keeps dnd drag-handle role and tabIndex", () => {
    const card = cardFactory.build();
    dragHandle.role = "group";
    dragHandle.tabIndex = -1;

    render(<CardItem index={0} card={card} />);

    const handle = screen.getByText(card.title);
    expect(handle).toHaveAttribute("role", "group");
    expect(handle).toHaveAttribute("tabindex", "-1");
  });
});
