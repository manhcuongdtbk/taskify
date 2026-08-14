import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // DOM matchers (`toBeInTheDocument`, …) — @testing-library/jest-dom; docs/testing.md
    setupFiles: ["./vitest.setup.ts"],
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
    // `restoreMocks` does not clear/reset `vi.fn()` history or implementations
    mockReset: true,
    // `restoreMocks` does not undo stubGlobal / stubEnv
    unstubGlobals: true,
    unstubEnvs: true,
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
        "**/*.types.ts", // lib/create-safe-action.types.ts
        "**/types.ts", // actions/<name>/types.ts — docs/conventions.md
        "actions/**/index.ts", // handlers — drop this exclude when mocked Vitest suites land
        "lib/prisma/client.ts",
        "lib/prisma/query-options/**", // shapes only — docs/prisma.md
        "lib/unsplash.ts",
        "constants/images.ts",
      ],
      // Floor under All-files on this include/exclude (not 100% of every file).
      // CI: .github/workflows/vitest.yml
      thresholds: {
        statements: 99,
        branches: 99,
        functions: 99,
        lines: 99,
      },
    },
  },
});
