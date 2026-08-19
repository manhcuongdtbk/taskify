import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => <div data-testid="query-devtools" />,
}));

import { QueryProvider } from "./query-provider";

describe("QueryProvider", () => {
  test("renders children and mounts Query Devtools", () => {
    render(
      <QueryProvider>
        <p>platform</p>
      </QueryProvider>,
    );

    expect(screen.getByText("platform")).toBeInTheDocument();
    expect(screen.getByTestId("query-devtools")).toBeInTheDocument();
  });
});
