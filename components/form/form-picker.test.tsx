import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { describe, expect, test, vi } from "vitest";

import { defaultImages } from "@/constants/images";
import type { BoardImageInput } from "@/actions/create-board/types";
import {
  type UnsplashGetMockResult,
  unsplashGetNetworkError,
} from "@/lib/testing/unsplash/get-mock-result";

const unsplashGet = vi.hoisted(() =>
  vi.fn(async (): Promise<UnsplashGetMockResult> => unsplashGetNetworkError),
);
const useFormStatusMock = vi.hoisted(() => vi.fn(() => ({ pending: false })));

vi.mock("@/lib/unsplash", () => ({
  unsplash: {
    GET: unsplashGet,
  },
}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormStatus: useFormStatusMock,
  };
});

vi.mock("next/image", () => import("@/lib/testing/next/image"));

import { FormPicker } from "./form-picker";

const firstImage = defaultImages[0]!;
const firstTileName = firstImage.description || "Unsplash Image";

function expectedSelection(image = firstImage): BoardImageInput {
  return {
    id: image.id,
    thumbUrl: image.urls.thumb,
    fullUrl: image.urls.full,
    linkHTML: image.links.html,
    userName: image.user.name,
  };
}

describe("FormPicker", () => {
  test("activates a tile with Enter and calls onSelect with the image", async () => {
    unsplashGet.mockResolvedValue(unsplashGetNetworkError);
    useFormStatusMock.mockReturnValue({ pending: false });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <form>
        <FormPicker onSelect={onSelect} />
      </form>,
    );

    const tile = await screen.findByRole("button", {
      name: firstTileName,
    });
    tile.focus();
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(expectedSelection());
    consoleError.mockRestore();
  });

  test("activates a tile with Space and calls onSelect with the image", async () => {
    unsplashGet.mockResolvedValue(unsplashGetNetworkError);
    useFormStatusMock.mockReturnValue({ pending: false });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <form>
        <FormPicker onSelect={onSelect} />
      </form>,
    );

    const tile = await screen.findByRole("button", {
      name: firstTileName,
    });
    tile.focus();
    await user.keyboard(" ");

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(expectedSelection());
  });

  test("selects a tile on click", async () => {
    unsplashGet.mockResolvedValue(unsplashGetNetworkError);
    useFormStatusMock.mockReturnValue({ pending: false });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <form>
        <FormPicker onSelect={onSelect} />
      </form>,
    );

    const tile = await screen.findByRole("button", {
      name: firstTileName,
    });
    await user.click(tile);

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(expectedSelection());
  });

  test("disables tiles while the form is pending", async () => {
    unsplashGet.mockResolvedValue(unsplashGetNetworkError);
    useFormStatusMock.mockReturnValue({ pending: true });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const onSelect = vi.fn();
    render(
      <form>
        <FormPicker onSelect={onSelect} />
      </form>,
    );

    const tile = await screen.findByRole("button", {
      name: firstTileName,
    });

    expect(tile).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("shows a checkmark for the selected image", async () => {
    unsplashGet.mockResolvedValue(unsplashGetNetworkError);
    useFormStatusMock.mockReturnValue({ pending: false });
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <form>
        <FormPicker onSelect={vi.fn()} selectedImage={expectedSelection()} />
      </form>,
    );

    const tile = await screen.findByRole("button", {
      name: firstTileName,
      pressed: true,
    });

    expect(tile).toHaveAttribute("aria-pressed", "true");
    // Visual selected affordance; AT users get aria-pressed above.
    expect(
      within(tile).getByTestId("selected-image-check"),
    ).toBeInTheDocument();
  });

  test("renders field errors for image", async () => {
    unsplashGet.mockResolvedValue(unsplashGetNetworkError);
    useFormStatusMock.mockReturnValue({ pending: false });
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <form>
        <FormPicker onSelect={vi.fn()} errors={{ image: ["Missing Image"] }} />
      </form>,
    );

    expect(await screen.findByText("Missing Image")).toBeInTheDocument();
  });

  test("uses Unsplash results when the request succeeds with an array", async () => {
    const remote = {
      ...firstImage,
      id: "remote-1",
      description: "Remote photo",
    };
    unsplashGet.mockResolvedValue({ data: [remote], error: null });
    useFormStatusMock.mockReturnValue({ pending: false });

    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <form>
        <FormPicker onSelect={onSelect} />
      </form>,
    );

    const tile = await screen.findByRole("button", { name: "Remote photo" });
    await user.click(tile);

    expect(onSelect).toHaveBeenCalledExactlyOnceWith({
      id: "remote-1",
      thumbUrl: remote.urls.thumb,
      fullUrl: remote.urls.full,
      linkHTML: remote.links.html,
      userName: remote.user.name,
    });
  });

  test("wraps a single Unsplash photo in a list", async () => {
    const remote = {
      ...firstImage,
      id: "remote-single",
      description: null,
    };
    unsplashGet.mockResolvedValue({ data: remote, error: null });
    useFormStatusMock.mockReturnValue({ pending: false });

    render(
      <form>
        <FormPicker onSelect={vi.fn()} />
      </form>,
    );

    expect(
      await screen.findByRole("button", { name: "Unsplash Image" }),
    ).toBeInTheDocument();
  });

  test("falls back to default images when Unsplash throws", async () => {
    unsplashGet.mockRejectedValue(new Error("boom"));
    useFormStatusMock.mockReturnValue({ pending: false });
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <form>
        <FormPicker onSelect={vi.fn()} />
      </form>,
    );

    expect(
      await screen.findByRole("button", {
        name: firstTileName,
      }),
    ).toBeInTheDocument();
  });

  test("ignores a stale Unsplash response after the effect re-runs", async () => {
    useFormStatusMock.mockReturnValue({ pending: false });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const stale = {
      ...firstImage,
      id: "stale",
      description: "Stale photo",
    };
    const fresh = {
      ...firstImage,
      id: "fresh",
      description: "Fresh photo",
    };

    let resolveStale!: (value: UnsplashGetMockResult) => void;
    const stalePromise = new Promise<UnsplashGetMockResult>((resolve) => {
      resolveStale = resolve;
    });

    unsplashGet
      .mockImplementationOnce(() => stalePromise)
      .mockImplementationOnce(async () => ({ data: [fresh], error: null }));

    render(
      <StrictMode>
        <form>
          <FormPicker onSelect={vi.fn()} />
        </form>
      </StrictMode>,
    );

    expect(
      await screen.findByRole("button", { name: "Fresh photo" }),
    ).toBeInTheDocument();

    resolveStale({ data: [stale], error: null });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Stale photo" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Fresh photo" }),
      ).toBeInTheDocument();
    });
  });
});
