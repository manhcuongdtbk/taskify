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

const genericComponentRestrictions = [
  {
    selector: `ExportNamedDeclaration > FunctionDeclaration[id.name=/^(${GENERIC_COMPONENT_NAMES})$/]`,
    message: genericComponentMessage,
  },
  {
    selector: `ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/^(${GENERIC_COMPONENT_NAMES})$/]`,
    message: genericComponentMessage,
  },
];

/** next/link = in-app; plain <a> = external — docs/nextjs.md § Link vs <a> */
const linkVsAnchorMessage =
  "Use <a> for external URLs (http(s)/mailto/tel/sms). Reserve next/link for in-app routes. See docs/nextjs.md § Link vs <a>.";

const linkVsAnchorRestrictions = [
  {
    selector:
      "JSXOpeningElement[name.name='Link'] > JSXAttribute[name.name='href'] > Literal[value=/^(https?:|mailto:|tel:|sms:)/i]",
    message: linkVsAnchorMessage,
  },
  {
    selector:
      "JSXOpeningElement[name.name='Link'] > JSXAttribute[name.name='href'] > JSXExpressionContainer > Literal[value=/^(https?:|mailto:|tel:|sms:)/i]",
    message: linkVsAnchorMessage,
  },
  {
    selector:
      "JSXOpeningElement[name.name='Link'] > JSXAttribute[name.name='href'] > JSXExpressionContainer > TemplateLiteral[quasis.0.value.raw=/^(https?:|mailto:|tel:|sms:)/i]",
    message: linkVsAnchorMessage,
  },
  {
    selector:
      "JSXOpeningElement[name.name='Link'] > JSXAttribute[name.name='href'] > JSXExpressionContainer > TSAsExpression[typeAnnotation.typeName.name='Route'] > Literal[value=/^(https?:|mailto:|tel:|sms:)/i]",
    message:
      "Do not cast external URLs as Route for Link. Use <a> instead. See docs/nextjs.md § Link vs <a>.",
  },
  {
    selector:
      "JSXOpeningElement[name.name='Link'] > JSXAttribute[name.name='href'] > JSXExpressionContainer > ObjectExpression > Property[key.name='pathname'] > Literal[value=/^(https?:|mailto:|tel:|sms:)/i]",
    message: linkVsAnchorMessage,
  },
];

/** `as Route` only in lib/paths.ts — forces cast-needed URLs through paths.* */
const routeCastOnlyInPathsRestriction = {
  selector: "TSAsExpression[typeAnnotation.typeName.name='Route']",
  message:
    "Cast to Route only in lib/paths.ts; use paths.* at call sites (or an inline literal for static routes). External URLs: use <a>, not Route. See docs/nextjs.md.",
};

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

  // Link = in-app; <a> = external. Inverse of @next/next/no-html-link-for-pages.
  // Flat config: later `no-restricted-syntax` for overlapping files must re-include these.
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-html-link-for-pages": "error",
      // Tabnabbing: target="_blank" requires rel with noopener/noreferrer (off in Next’s defaults).
      "react/jsx-no-target-blank": "error",
      "no-restricted-syntax": ["error", ...linkVsAnchorRestrictions],
    },
  },

  // typedRoutes casts live only in lib/paths.ts (ignored here).
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["lib/paths.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        routeCastOnlyInPathsRestriction,
      ],
    },
  },

  // Filename ↔ export, generics denylist, ComponentProps naming for app UI (not shadcn).
  {
    files: [
      "components/**/*.{ts,tsx}",
      "app/**/_components/**/*.{ts,tsx}",
      "app/**/page.tsx",
    ],
    ignores: ["components/ui/**", "lib/paths.ts"],
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
      // Re-include prior no-restricted-syntax entries — flat config replaces, does not merge.
      "no-restricted-syntax": [
        "error",
        ...genericComponentRestrictions,
        ...linkVsAnchorRestrictions,
        routeCastOnlyInPathsRestriction,
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
