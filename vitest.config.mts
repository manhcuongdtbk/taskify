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
  },
});
