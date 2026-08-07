import { afterEach, describe, expect, test, vi } from "vitest";

describe("env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  test.for([
    {
      nodeEnv: "development",
      isDevelopment: true,
      isProduction: false,
    },
    {
      nodeEnv: "production",
      isDevelopment: false,
      isProduction: true,
    },
    {
      nodeEnv: "test",
      isDevelopment: false,
      isProduction: false,
    },
  ])(
    "NODE_ENV=$nodeEnv → isDevelopment=$isDevelopment, isProduction=$isProduction",
    async ({ nodeEnv, isDevelopment, isProduction }) => {
      vi.stubEnv("NODE_ENV", nodeEnv);
      vi.resetModules();

      const env = await import("./env");

      expect(env.isDevelopment).toBe(isDevelopment);
      expect(env.isProduction).toBe(isProduction);
    },
  );
});
