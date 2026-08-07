import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { useAction } from "./use-action";
import type { ActionState } from "@/lib/create-safe-action.types";

type Input = { title: string };
type Output = { id: string };

describe("useAction", () => {
  test("sets data and calls onSuccess then onComplete on success", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onComplete = vi.fn();
    const action = vi.fn(async (): Promise<ActionState<Input, Output>> => ({
      data: { id: "board_1" },
    }));
    const options = { onSuccess, onError, onComplete };

    const { result } = renderHook(() => useAction(action, options));

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.execute({ title: "Roadmap" });
    });

    expect(action).toHaveBeenCalledExactlyOnceWith({ title: "Roadmap" });
    expect(result.current.data).toStrictEqual({ id: "board_1" });
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith({ id: "board_1" });
    expect(onError).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(result.current.isLoading).toBe(false);
  });

  test("sets isLoading while the action is in flight", async () => {
    let resolveAction!: (value: ActionState<Input, Output>) => void;
    const action = vi.fn(
      () =>
        new Promise<ActionState<Input, Output>>((resolve) => {
          resolveAction = resolve;
        }),
    );

    const { result } = renderHook(() => useAction(action));

    let executePromise: Promise<void>;
    act(() => {
      executePromise = result.current.execute({ title: "Roadmap" });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolveAction({ data: { id: "board_1" } });
      await executePromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("sets serverError and calls onError then onComplete", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onComplete = vi.fn();
    const action = vi.fn(async (): Promise<ActionState<Input, Output>> => ({
      serverError: "Unauthorized",
    }));
    const options = { onSuccess, onError, onComplete };

    const { result } = renderHook(() => useAction(action, options));

    await act(async () => {
      await result.current.execute({ title: "Roadmap" });
    });

    expect(action).toHaveBeenCalledExactlyOnceWith({ title: "Roadmap" });
    expect(result.current.serverError).toBe("Unauthorized");
    expect(onError).toHaveBeenCalledExactlyOnceWith("Unauthorized");
    expect(result.current.data).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(result.current.isLoading).toBe(false);
  });

  test("reflects field and form errors without calling onSuccess", async () => {
    const onSuccess = vi.fn();
    const onComplete = vi.fn();
    const action = vi.fn(async (): Promise<ActionState<Input, Output>> => ({
      fieldErrors: { title: ["Missing Title"] },
      formErrors: ["Form is invalid"],
    }));
    const options = { onSuccess, onComplete };

    const { result } = renderHook(() => useAction(action, options));

    await act(async () => {
      await result.current.execute({ title: "" });
    });

    expect(action).toHaveBeenCalledExactlyOnceWith({ title: "" });
    expect(result.current.fieldErrors).toStrictEqual({
      title: ["Missing Title"],
    });
    expect(result.current.formErrors).toStrictEqual(["Form is invalid"]);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledOnce();
  });

  test("clears loading and calls onComplete when the action returns nothing", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onComplete = vi.fn();
    const action = vi.fn(
      async () => undefined as unknown as ActionState<Input, Output>,
    );
    const options = { onSuccess, onError, onComplete };

    const { result } = renderHook(() => useAction(action, options));

    await act(async () => {
      await result.current.execute({ title: "Roadmap" });
    });

    expect(action).toHaveBeenCalledExactlyOnceWith({ title: "Roadmap" });
    expect(result.current.data).toBeUndefined();
    expect(result.current.serverError).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(result.current.isLoading).toBe(false);
  });
});
