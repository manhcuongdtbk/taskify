import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ACTION, ENTITY_TYPE } from "@/app/generated/prisma/client";
import {
  cardDetailOk,
  cardDetailPending,
  cardDetailUnauthorized,
  cardLogsOk,
  cardLogsPending,
  cardLogsUnauthorized,
} from "@/lib/testing/msw/card-handlers";
import { server } from "@/lib/testing/msw/server";
import { renderWithQuery } from "@/lib/testing/tanstack-query/render-with-query";
import { useCardModalStore } from "@/stores/use-card-modal-store";
import { type CardWithList } from "@/types";

vi.mock("./card-modal-header", () => {
  const Skeleton = () => <div data-testid="card-header-skeleton" />;
  const CardModalHeader = Object.assign(
    ({ data }: { data: { title: string } }) => (
      <div data-testid="card-header">{data.title}</div>
    ),
    { Skeleton },
  );
  return { CardModalHeader };
});

vi.mock("./card-modal-description", () => {
  const Skeleton = () => <div data-testid="card-description-skeleton" />;
  const CardModalDescription = Object.assign(
    ({ data }: { data: { id: string } }) => (
      <div data-testid="card-description">{data.id}</div>
    ),
    { Skeleton },
  );
  return { CardModalDescription };
});

vi.mock("./card-modal-actions", () => {
  const Skeleton = () => <div data-testid="card-actions-skeleton" />;
  const CardModalActions = Object.assign(
    ({ data }: { data: { id: string } }) => (
      <div data-testid="card-actions">{data.id}</div>
    ),
    { Skeleton },
  );
  return { CardModalActions };
});

vi.mock("./card-modal-activity", () => {
  const Skeleton = () => <div data-testid="card-activity-skeleton" />;
  const CardModalActivity = Object.assign(
    ({ items }: { items: { id: string }[] }) => (
      <div data-testid="card-activity">{items.length}</div>
    ),
    { Skeleton },
  );
  return { CardModalActivity };
});

import { CardModal } from "./index";

const card: CardWithList = {
  id: "card_1",
  title: "Ship P3",
  description: null,
  order: 0,
  listId: "list_1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  list: {
    id: "list_1",
    title: "Todo",
    order: 0,
    boardId: "board_1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
};

const log = {
  id: "log_1",
  orgId: "org_1",
  action: ACTION.CREATE,
  entityId: "card_1",
  entityType: ENTITY_TYPE.CARD,
  entityTitle: "Ship P3",
  userId: "user_1",
  userImage: "https://example.com/avatar.png",
  userName: "Ada Lovelace",
  createdAt: new Date("2026-01-15T10:30:00.000Z"),
  updatedAt: new Date("2026-01-15T10:30:00.000Z"),
};

describe("CardModal", () => {
  beforeEach(() => {
    useCardModalStore.getState().close();
  });

  test("does not render dialog content when the store is closed", () => {
    renderWithQuery(<CardModal />);

    expect(
      screen.queryByTestId("card-header-skeleton"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-header")).not.toBeInTheDocument();
  });

  test("shows loaded sections when card and logs fetch succeed", async () => {
    server.use(cardDetailOk(card), cardLogsOk([log]));
    useCardModalStore.getState().open("card_1");

    renderWithQuery(<CardModal />);

    expect(await screen.findByTestId("card-header")).toHaveTextContent(
      "Ship P3",
    );
    expect(screen.getByTestId("card-description")).toHaveTextContent("card_1");
    expect(screen.getByTestId("card-actions")).toHaveTextContent("card_1");
    expect(screen.getByTestId("card-activity")).toHaveTextContent("1");
    expect(
      screen.queryByTestId("card-header-skeleton"),
    ).not.toBeInTheDocument();
  });

  test("shows card skeletons while the card query is pending", async () => {
    server.use(cardDetailPending(), cardLogsPending());
    useCardModalStore.getState().open("card_1");

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByTestId("card-header-skeleton"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-description-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-actions-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-activity-skeleton")).toBeInTheDocument();
  });

  test("keeps the activity skeleton when only logs are pending", async () => {
    server.use(cardDetailOk(card), cardLogsPending());
    useCardModalStore.getState().open("card_1");

    renderWithQuery(<CardModal />);

    expect(await screen.findByTestId("card-header")).toBeInTheDocument();
    expect(screen.getByTestId("card-description")).toBeInTheDocument();
    expect(screen.getByTestId("card-actions")).toBeInTheDocument();
    expect(screen.getByTestId("card-activity-skeleton")).toBeInTheDocument();
  });

  test("stays on card skeletons when the detail body is null", async () => {
    server.use(cardDetailOk(null), cardLogsOk([log]));
    useCardModalStore.getState().open("card_1");

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByTestId("card-header-skeleton"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-description-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-actions-skeleton")).toBeInTheDocument();
    // Logs can still resolve independently.
    await waitFor(() => {
      expect(screen.getByTestId("card-activity")).toHaveTextContent("1");
    });
  });

  test("stays on skeletons when card fetches are unauthorized", async () => {
    server.use(cardDetailUnauthorized(), cardLogsUnauthorized());
    useCardModalStore.getState().open("card_1");

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByTestId("card-header-skeleton"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-description-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-actions-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-activity-skeleton")).toBeInTheDocument();
  });
});
