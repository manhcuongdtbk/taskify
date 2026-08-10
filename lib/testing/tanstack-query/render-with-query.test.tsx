import { useQueryClient } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { renderWithQuery } from "./render-with-query";

const Probe = () => {
  const queryClient = useQueryClient();
  return <p>{queryClient ? "ready" : "missing"}</p>;
};

describe("renderWithQuery", () => {
  test("provides a QueryClient and exposes an invalidateQueries spy", () => {
    const { invalidateQueries } = renderWithQuery(<Probe />);

    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
