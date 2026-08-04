import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // *.test.* = Vitest only; *.spec.* = Playwright under e2e/ — docs/testing.md
    // Ban Vitest-doc separate suite folders: __tests__/, test/, tests/
    include: ["**/*.test.?(c|m)[jt]s?(x)"],
    exclude: [
      ...configDefaults.exclude,
      "e2e/**",
      "**/__tests__/**",
      "**/tests/**",
      "test/**",
    ],
    // Mock/assert hygiene — rationale: docs/testing.md
    restoreMocks: true,
    expect: {
      requireAssertions: true,
    },
    // https://vitest.dev/guide/coverage.html — v8 is the recommended provider on Node.
    coverage: {
      provider: "v8",
      include: [
        "lib/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "actions/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "stores/**/*.{ts,tsx}",
        "constants/**/*.{ts,tsx}",
      ],
      exclude: [
        "components/ui/**", // shadcn
        "**/*.{test,spec}.{ts,tsx}",
      ],
    },
  },
});
