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

/** Next.js special files — default export must be `export default [async] function` (docs style). */
const NEXT_SPECIAL_FILES = [
  "app/**/page.{ts,tsx}",
  "app/**/layout.{ts,tsx}",
  "app/**/template.{ts,tsx}",
  "app/**/loading.{ts,tsx}",
  "app/**/error.{ts,tsx}",
  "app/**/global-error.{ts,tsx}",
  "app/**/not-found.{ts,tsx}",
  "app/**/global-not-found.{ts,tsx}",
  "app/**/forbidden.{ts,tsx}",
  "app/**/unauthorized.{ts,tsx}",
  "app/**/default.{ts,tsx}",
  "app/**/sitemap.{ts,js}",
  "app/**/robots.{ts,js}",
  "app/**/manifest.{ts,js}",
  "app/**/icon.{ts,tsx,js,jsx}",
  "app/**/apple-icon.{ts,tsx,js,jsx}",
  "app/**/opengraph-image.{ts,tsx,js,jsx}",
  "app/**/twitter-image.{ts,tsx,js,jsx}",
  "app/**/route.{ts,tsx}",
  "proxy.ts",
];

const nextDefaultFunctionMessage =
  "Use `export default function Name` or `export default async function Name` (Next.js doc style). See docs/conventions.md.";

const nextSpecialExportRestrictions = [
  {
    selector: "ExportDefaultDeclaration > ArrowFunctionExpression",
    message: nextDefaultFunctionMessage,
  },
  {
    selector: "ExportDefaultDeclaration > Identifier",
    message: nextDefaultFunctionMessage,
  },
  {
    selector:
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|generateMetadata|generateViewport|generateStaticParams|generateImageMetadata|generateSitemaps|proxy)$/]",
    message:
      "Use `export async function Name` / `export function Name` for Next.js special named exports (not `export const`). See docs/conventions.md.",
  },
];

/** Non-Next modules — no `export [async] function` (named or default); use `export const` + arrow. */
const nonNextFunctionDeclarationMessage =
  "Use `export const Name = () =>` / `export const Name = async () =>` for non-Next.js modules (keep `export [async] function` / `export default [async] function` for Next.js special files). See docs/conventions.md.";

const nonNextFunctionDeclarationRestrictions = [
  {
    selector: "ExportNamedDeclaration > FunctionDeclaration",
    message: nonNextFunctionDeclarationMessage,
  },
  {
    selector: "ExportDefaultDeclaration > FunctionDeclaration",
    message: nonNextFunctionDeclarationMessage,
  },
];

const nonNextExportConstMustBeArrowRestriction = {
  selector:
    "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression",
  message:
    "Use an arrow function: `export const Name = () =>` / `export const Name = async () =>` (not `function Name`). See docs/conventions.md.",
};

/** memo/forwardRef: no inline function/arrow — wrap a named `const` (keeps .name, no displayName). */
const memoForwardRefNamedIdentifierMessage =
  "Pass a named component identifier to memo/forwardRef: `const Foo = () => { … }; export const FooMemo = memo(Foo)` (same for forwardRef). No inline `() =>` or `function` — those are Anonymous in DevTools / fail `react/display-name`. See docs/conventions.md.";

const memoForwardRefNamedIdentifierRestrictions = [
  {
    selector:
      "CallExpression[callee.name=/^(memo|forwardRef)$/] > ArrowFunctionExpression",
    message: memoForwardRefNamedIdentifierMessage,
  },
  {
    selector:
      "CallExpression[callee.property.name=/^(memo|forwardRef)$/] > ArrowFunctionExpression",
    message: memoForwardRefNamedIdentifierMessage,
  },
  {
    selector:
      "CallExpression[callee.name=/^(memo|forwardRef)$/] > FunctionExpression",
    message: memoForwardRefNamedIdentifierMessage,
  },
  {
    selector:
      "CallExpression[callee.property.name=/^(memo|forwardRef)$/] > FunctionExpression",
    message: memoForwardRefNamedIdentifierMessage,
  },
];

const nonNextExportStyleRestrictions = [
  ...nonNextFunctionDeclarationRestrictions,
  nonNextExportConstMustBeArrowRestriction,
  ...memoForwardRefNamedIdentifierRestrictions,
];

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
    "app/generated/**",
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

  // Next.js special files: default/`generate*`/HTTP handlers use `export [async] function`.
  {
    files: NEXT_SPECIAL_FILES,
    rules: {
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        routeCastOnlyInPathsRestriction,
        ...nextSpecialExportRestrictions,
      ],
    },
  },

  // Non-Next app modules: `export const` + arrow, not `export [async] function` (named or default).
  // `lib/paths.ts` is handled below — this block re-includes the `as Route` ban.
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["components/ui/**", "lib/paths.ts", ...NEXT_SPECIAL_FILES],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        routeCastOnlyInPathsRestriction,
        ...nonNextExportStyleRestrictions,
      ],
    },
  },

  // Sole `as Route` cast site: enforce export style here, but do not ban casts.
  {
    files: ["lib/paths.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        ...nonNextExportStyleRestrictions,
      ],
    },
  },

  // Filename ↔ export, generics denylist, ComponentProps naming for app UI (not shadcn).
  // Pages stay out of this block: non-Next `export const` bans would forbid
  // `export async function generateMetadata`. See the page-only block below.
  {
    files: ["components/**/*.{ts,tsx}", "app/**/_components/**/*.{ts,tsx}"],
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
      // Re-include prior no-restricted-syntax entries — flat config replaces, does not merge.
      "no-restricted-syntax": [
        "error",
        ...genericComponentRestrictions,
        ...linkVsAnchorRestrictions,
        routeCastOnlyInPathsRestriction,
        ...nonNextExportStyleRestrictions,
      ],
    },
  },

  // App Router pages: keep ComponentProps naming if someone invents a handwritten
  // props alias (prefer Next `PageProps` — docs/conventions.md). Separate from the
  // UI block so Next named exports stay `export [async] function`.
  // Omits filename-match-export: default export ≠ `page`; a sole `generateMetadata`
  // named export would false-positive against the filename.
  {
    files: ["app/**/page.tsx"],
    plugins: {
      "noctcore-react": noctcoreReact,
    },
    rules: {
      "noctcore-react/component-props-naming": [
        "error",
        { requireExported: true },
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
