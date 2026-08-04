import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // AI-generated spies/mocks often skip cleanup — restore between tests.
    // See docs/testing.md · https://vitest.dev/guide/learn/writing-tests-with-ai.html
    restoreMocks: true,
    // Fail tests that never call expect (empty/accidental passes).
    // https://vitest.dev/config/expect.html#expect-requireassertions
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
