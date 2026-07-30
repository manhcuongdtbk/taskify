import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
// Registers `@typescript-eslint/*` (transitive via `typescript-eslint`) — not a direct package.json dep.
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import pluginQuery from "@tanstack/eslint-plugin-query";
import filenameMatchExport from "eslint-plugin-filename-match-export";
// Community-only (new, niche). We use a single rule — watch releases / health; replace with a local rule if it stalls. See docs/conventions.md § Component export names.
import noctcoreReact from "@noctcore/eslint-plugin-react";

/** One-word generics that must be qualified — docs/conventions.md § Component export names */
const GENERIC_COMPONENT_NAMES =
  "Header|Footer|Navbar|Sidebar|Actions|Activity|Description|Info|Content|Item";

const genericComponentMessage =
  "Qualify one-word component names (e.g. CardModalHeader, OrganizationInfo). See docs/conventions.md § Component export names.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs["flat/recommended-strict"],
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendor / agent skill trees (not app source)
    ".agents/**",
    ".claude/**",
    ".windsurf/**",
  ]),

  // Filename ↔ export, generics denylist, ComponentProps naming for app UI (not shadcn).
  {
    files: [
      "components/**/*.{ts,tsx}",
      "app/**/_components/**/*.{ts,tsx}",
      "app/**/page.tsx",
    ],
    ignores: ["components/ui/**"],
    plugins: {
      "filename-match-export": filenameMatchExport,
      "noctcore-react": noctcoreReact,
    },
    rules: {
      "filename-match-export/match-named-export": "error",
      // `Component` → `ComponentProps` (community plugin; not in stock eslint-plugin-react)
      "noctcore-react/component-props-naming": [
        "error",
        { requireExported: true },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: `ExportNamedDeclaration > FunctionDeclaration[id.name=/^(${GENERIC_COMPONENT_NAMES})$/]`,
          message: genericComponentMessage,
        },
        {
          selector: `ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/^(${GENERIC_COMPONENT_NAMES})$/]`,
          message: genericComponentMessage,
        },
      ],
    },
  },

  // Shared form kit: exported components must be Form*.
  {
    files: ["components/form/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "function",
          modifiers: ["exported"],
          format: ["PascalCase"],
          prefix: ["Form"],
        },
        {
          selector: "variable",
          modifiers: ["const", "exported"],
          format: ["PascalCase"],
          prefix: ["Form"],
        },
      ],
    },
  },
]);

export default eslintConfig;
