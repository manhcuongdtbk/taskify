import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { Button } from "@/components/ui/button";
import { useProModalStore } from "@/stores/use-pro-modal-store";
import { paths } from "@/lib/paths";
import { defaultImages } from "@/constants/images";

const createBoard = vi.hoisted(() =>
  vi.fn(async () => ({
    fieldErrors: { image: ["Missing Image"] },
  })),
);
const push = vi.hoisted(() => vi.fn());
const toastAdd = vi.hoisted(() => vi.fn());
const unsplashGet = vi.hoisted(() =>
  vi.fn(async () => ({ data: null, error: "network" })),
);

vi.mock("@/actions/create-board", () => ({
  createBoard,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

vi.mock("@/lib/unsplash", () => ({
  unsplash: { GET: unsplashGet },
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
  }: {
    alt: string;
    src: string;
    fill?: boolean;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test double for next/image
    <img alt={alt} src={src} />
  ),
}));

import { FormPopover } from "./form-popover";

const firstImage = defaultImages[0]!;
const firstTileName = firstImage.description || "Unsplash Image";

async function openPopover(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Open create board" }));
  expect(await screen.findByText("Create board")).toBeInTheDocument();
}

describe("FormPopover", () => {
  beforeEach(() => {
    useProModalStore.getState().close();
    createBoard.mockReset();
    push.mockReset();
    toastAdd.mockReset();
    unsplashGet.mockResolvedValue({ data: null, error: "network" });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("keeps the typed title after an invalid submit without an image", async () => {
    createBoard.mockResolvedValue({
      fieldErrors: { image: ["Missing Image"] },
    });
    const user = userEvent.setup();

    render(
      <FormPopover>
        <Button>Open create board</Button>
      </FormPopover>,
    );

    await openPopover(user);

    const titleInput = screen.getByLabelText("Board title");
    await user.type(titleInput, "Roadmap");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createBoard).toHaveBeenCalledExactlyOnceWith({
        title: "Roadmap",
        image: undefined,
      });
    });

    expect(screen.getByLabelText("Board title")).toHaveValue("Roadmap");
    expect(screen.getByText("Missing Image")).toBeInTheDocument();
  });

  test("creates a board, toasts, closes, and navigates on success", async () => {
    createBoard.mockResolvedValue({ data: { id: "board_1" } });
    const user = userEvent.setup();

    render(
      <FormPopover side="right" align="start" sideOffset={10}>
        <Button>Open create board</Button>
      </FormPopover>,
    );

    await openPopover(user);

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Board title"), "Roadmap");
    await user.click(
      await within(dialog).findByRole("button", { name: firstTileName }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createBoard).toHaveBeenCalledExactlyOnceWith({
        title: "Roadmap",
        image: {
          id: firstImage.id,
          thumbUrl: firstImage.urls.thumb,
          fullUrl: firstImage.urls.full,
          linkHTML: firstImage.links.html,
          userName: firstImage.user.name,
        },
      });
    });

    expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: "Board created!",
    });
    expect(push).toHaveBeenCalledExactlyOnceWith(paths.board("board_1"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("toasts and opens the pro modal on server error", async () => {
    createBoard.mockResolvedValue({ serverError: "Board limit reached" });
    const user = userEvent.setup();

    render(
      <FormPopover>
        <Button>Open create board</Button>
      </FormPopover>,
    );

    await openPopover(user);
    await user.type(screen.getByLabelText("Board title"), "Roadmap");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        title: "Board limit reached",
      });
    });
    expect(useProModalStore.getState().isOpen).toBe(true);
  });

  test("clears title and image selection when the popover closes", async () => {
    createBoard.mockResolvedValue({
      fieldErrors: { image: ["Missing Image"] },
    });
    const user = userEvent.setup();

    render(
      <FormPopover>
        <Button>Open create board</Button>
      </FormPopover>,
    );

    await openPopover(user);
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Board title"), "Roadmap");
    await user.click(
      await within(dialog).findByRole("button", { name: firstTileName }),
    );

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await openPopover(user);

    expect(screen.getByLabelText("Board title")).toHaveValue("");
    expect(
      await screen.findByRole("button", {
        name: firstTileName,
        pressed: false,
      }),
    ).toBeInTheDocument();
  });
});
