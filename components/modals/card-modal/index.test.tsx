import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { cardWithListTitleFactory } from "@/lib/testing/factories/card";
import { auditLogFactory } from "@/lib/testing/factories/audit-log";
import {
  cardAuditLogsInvalidJson,
  cardAuditLogsNotFound,
  cardAuditLogsOk,
  cardAuditLogsPending,
  cardAuditLogsUnauthorized,
  cardDetailInvalidJson,
  cardDetailNotFound,
  cardDetailOk,
  cardDetailPending,
  cardDetailUnauthorized,
} from "@/lib/testing/msw/handlers/card";
import { server } from "@/lib/testing/msw/server";
import { renderWithQuery } from "@/lib/testing/tanstack-query/render-with-query";
import { useCardModalStore } from "@/stores/use-card-modal-store";

vi.mock("./card-modal-header", () => {
  const Skeleton = () => <div data-testid="card-header-skeleton" />;
  const CardModalHeader = Object.assign(
    ({ card }: { card: { title: string } }) => (
      <div data-testid="card-header">{card.title}</div>
    ),
    { Skeleton },
  );
  return { CardModalHeader };
});

vi.mock("./card-modal-description", () => {
  const Skeleton = () => <div data-testid="card-description-skeleton" />;
  const CardModalDescription = Object.assign(
    ({ card }: { card: { id: string } }) => (
      <div data-testid="card-description">{card.id}</div>
    ),
    { Skeleton },
  );
  return { CardModalDescription };
});

vi.mock("./card-modal-actions", () => {
  const Skeleton = () => <div data-testid="card-actions-skeleton" />;
  const CardModalActions = Object.assign(
    ({ card }: { card: { id: string } }) => (
      <div data-testid="card-actions">{card.id}</div>
    ),
    { Skeleton },
  );
  return { CardModalActions };
});

vi.mock("./card-modal-activity", () => {
  const Skeleton = () => <div data-testid="card-activity-skeleton" />;
  const CardModalActivity = Object.assign(
    ({ auditLogs }: { auditLogs: { id: string }[] }) => (
      <div data-testid="card-activity">{auditLogs.length}</div>
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
    expect(
      screen.getByRole("dialog", { name: card.title }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-description")).toHaveTextContent(card.id);
    expect(screen.getByTestId("card-actions")).toHaveTextContent(card.id);
    expect(screen.getByTestId("card-activity")).toHaveTextContent("1");
    expect(
      screen.queryByTestId("card-header-skeleton"),
    ).not.toBeInTheDocument();
  });

  test("shows the newly opened card after switching ids", async () => {
    const first = cardWithListTitleFactory.build({ title: "First card" });
    const second = cardWithListTitleFactory.build({ title: "Second card" });
    const firstAuditLog = auditLogFactory.build(
      {},
      { transient: { card: first } },
    );
    const secondAuditLog = auditLogFactory.build(
      {},
      { transient: { card: second } },
    );
    const cards = new Map([
      [first.id, first],
      [second.id, second],
    ]);
    const cardAuditLogs = new Map([
      [first.id, [firstAuditLog]],
      [second.id, [secondAuditLog]],
    ]);
    server.use(
      http.get("/api/cards/:cardId", ({ params }) => {
        const card = cards.get(String(params.cardId));
        if (!card) {
          return new HttpResponse("Not Found", { status: 404 });
        }

        return HttpResponse.json(card);
      }),
      http.get("/api/cards/:cardId/audit-logs", ({ params }) => {
        const logs = cardAuditLogs.get(String(params.cardId));
        if (!logs) {
          return new HttpResponse("Not Found", { status: 404 });
        }

        return HttpResponse.json(logs);
      }),
    );
    useCardModalStore.getState().open(first.id);

    renderWithQuery(<CardModal />);

    expect(await screen.findByTestId("card-header")).toHaveTextContent(
      first.title,
    );

    useCardModalStore.getState().open(second.id);

    await waitFor(() => {
      expect(screen.getByTestId("card-header")).toHaveTextContent(second.title);
    });
    expect(
      screen.getByRole("dialog", { name: second.title }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-description")).toHaveTextContent(second.id);
    expect(screen.getByTestId("card-actions")).toHaveTextContent(second.id);
  });

  test("shows card skeletons while the card query is pending", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailPending(), cardAuditLogsPending());
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByTestId("card-header-skeleton"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Card details" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-description-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-actions-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("card-activity-skeleton")).toBeInTheDocument();
  });

  test("keeps the activity skeleton while the card query is pending even if card audit logs return", async () => {
    const card = cardWithListTitleFactory.build();
    const cardAuditLog = auditLogFactory.build({}, { transient: { card } });
    server.use(cardDetailPending(), cardAuditLogsOk([cardAuditLog]));
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByTestId("card-header-skeleton"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-activity-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("card-activity")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Couldn't load activity"),
    ).not.toBeInTheDocument();
  });

  test("keeps the activity skeleton while the card query is pending even if card audit logs fail", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailPending(), cardAuditLogsNotFound());
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByTestId("card-header-skeleton"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-activity-skeleton")).toBeInTheDocument();
    expect(
      screen.queryByText("Couldn't load activity"),
    ).not.toBeInTheDocument();
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

  test("shows a load error when the card is missing", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailNotFound(), cardAuditLogsNotFound());
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load this card",
    );
    expect(
      screen.getByRole("dialog", { name: "Card details" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("card-header-skeleton"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-activity")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Couldn't load activity"),
    ).not.toBeInTheDocument();
  });

  test("hides activity when the card is missing even if card audit logs return", async () => {
    const card = cardWithListTitleFactory.build();
    const cardAuditLog = auditLogFactory.build({}, { transient: { card } });
    server.use(cardDetailNotFound(), cardAuditLogsOk([cardAuditLog]));
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByText("Couldn't load this card"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("card-activity")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Couldn't load activity"),
    ).not.toBeInTheDocument();
  });

  test("shows load errors when card fetches are unauthorized", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailUnauthorized(), cardAuditLogsUnauthorized());
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByText("Couldn't load this card"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(
      screen.queryByText("Couldn't load activity"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("card-header-skeleton"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("card-activity-skeleton"),
    ).not.toBeInTheDocument();
  });

  test("shows an activity load error when only card audit log JSON fails the Query schema", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailOk(card), cardAuditLogsInvalidJson());
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(await screen.findByTestId("card-header")).toBeInTheDocument();
    expect(screen.getByText("Couldn't load activity")).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  test("shows an activity load error when only card audit logs are unauthorized", async () => {
    const card = cardWithListTitleFactory.build();
    server.use(cardDetailOk(card), cardAuditLogsUnauthorized());
    useCardModalStore.getState().open(card.id);

    renderWithQuery(<CardModal />);

    expect(await screen.findByTestId("card-header")).toBeInTheDocument();
    expect(screen.getByText("Couldn't load activity")).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  test("shows load errors when card JSON fails the Query schema", async () => {
    server.use(cardDetailInvalidJson(), cardAuditLogsInvalidJson());
    useCardModalStore.getState().open("card_1");

    renderWithQuery(<CardModal />);

    expect(
      await screen.findByText("Couldn't load this card"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(
      screen.queryByText("Couldn't load activity"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-activity")).not.toBeInTheDocument();
  });
});
