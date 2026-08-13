import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { cardWithListTitleFactory } from "@/lib/testing/factories/card";
import { auditLogFactory } from "@/lib/testing/factories/audit-log";
import {
  cardAuditLogsOk,
  cardAuditLogsPending,
  cardAuditLogsUnauthorized,
  cardDetailOk,
  cardDetailPending,
  cardDetailUnauthorized,
} from "@/lib/testing/msw/card-handlers";
import { server } from "@/lib/testing/msw/server";
import { renderWithQuery } from "@/lib/testing/tanstack-query/render-with-query";
import { useCardModalStore } from "@/stores/use-card-modal-store";

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

  test("shows loaded sections when card and card audit logs fetch succeed", async () => {
    const card = cardWithListTitleFactory.build();
    const cardAuditLog = auditLogFactory.build({}, { transient: { card } });
    server.use(cardDetailOk(card), cardAuditLogsOk([cardAuditLog]));
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(await screen.findByTestId("card-header")).toHaveTextContent(
      card.title,
    );
    expect(screen.getByTestId("card-description")).toHaveTextContent(card.id);
    expect(screen.getByTestId("card-actions")).toHaveTextContent(card.id);
    expect(screen.getByTestId("card-activity")).toHaveTextContent("1");
    expect(
      screen.queryByTestId("card-header-skeleton"),
    ).not.toBeInTheDocument();
  });

  test("shows card skeletons while the card query is pending", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailPending(), cardAuditLogsPending());
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByTestId("card-header-skeleton"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-description-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-actions-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-activity-skeleton")).toBeInTheDocument();
  });

  test("keeps the activity skeleton when only card audit logs are pending", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailOk(card), cardAuditLogsPending());
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(await screen.findByTestId("card-header")).toBeInTheDocument();
    expect(screen.getByTestId("card-description")).toBeInTheDocument();
    expect(screen.getByTestId("card-actions")).toBeInTheDocument();
    expect(screen.getByTestId("card-activity-skeleton")).toBeInTheDocument();
  });

  test("stays on card skeletons when the detail body is null", async () => {
    const card = cardWithListTitleFactory.build();
    const cardAuditLog = auditLogFactory.build({}, { transient: { card } });
    server.use(cardDetailOk(null), cardAuditLogsOk([cardAuditLog]));
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByTestId("card-header-skeleton"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-description-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-actions-skeleton")).toBeInTheDocument();
    // Card audit logs can still resolve independently.
    await waitFor(() => {
      expect(screen.getByTestId("card-activity")).toHaveTextContent("1");
    });
  });

  test("stays on skeletons when card fetches are unauthorized", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailUnauthorized(), cardAuditLogsUnauthorized());
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByTestId("card-header-skeleton"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-description-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-actions-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-activity-skeleton")).toBeInTheDocument();
  });
});
