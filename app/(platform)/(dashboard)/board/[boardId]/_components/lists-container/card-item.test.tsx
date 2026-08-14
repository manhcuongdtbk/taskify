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
        role: "button",
        tabIndex: 0,
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

    render(<CardItem index={0} card={card} />);

    screen.getByRole("button", { name: card.title }).focus();
    await user.keyboard("{Enter}");

    expect(useCardModalStore.getState().id).toBe(card.id);
    expect(selectCardModalIsOpen(useCardModalStore.getState())).toBe(true);
  });

  test("does not open the card modal with Space", async () => {
    const card = cardFactory.build();
    const user = userEvent.setup();

    render(<CardItem index={0} card={card} />);

    screen.getByRole("button", { name: card.title }).focus();
    await user.keyboard(" ");

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
});
