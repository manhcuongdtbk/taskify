/**
 * Deferred promise helper for tests.
 *
 * A "deferred promise" is a promise whose `resolve`/`reject` functions are
 * captured so the test can decide *when* it settles.
 *
 * This is useful for deterministic async timing assertions, e.g.:
 * - proving work in a loop runs sequentially (not concurrently)
 * - pausing a `$transaction` callback until you assert something
 */
export const deferPromise = <T>() => {
  if (typeof Promise.withResolvers === "function") {
    return Promise.withResolvers<T>();
  }

  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};
