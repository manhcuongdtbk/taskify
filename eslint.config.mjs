import { basename } from "node:path";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
// Registers `@typescript-eslint/*` (transitive via `typescript-eslint`) — not a direct package.json dep.
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import pluginQuery from "@tanstack/eslint-plugin-query";
import filenameMatchExport from "eslint-plugin-filename-match-export";
// Community-only (new, niche). We use a single rule — watch releases / health; replace with a local rule if it stalls. See docs/conventions.md § Component export names.
import noctcoreReact from "@noctcore/eslint-plugin-react";
// npm package `@vitest/eslint-plugin` (repo: vitest-dev/eslint-plugin-vitest). Docs: docs/testing.md
import vitest from "@vitest/eslint-plugin";
// Companion lint for `@testing-library/jest-dom` matchers — docs/testing.md
import jestDom from "eslint-plugin-jest-dom";
// Companion lint for Testing Library queries / async / cleanup — docs/testing.md
import testingLibrary from "eslint-plugin-testing-library";
// Zod 4 authoring lint (namespace import + *Schema naming) — docs/conventions.md
import eslintPluginZod from "eslint-plugin-zod";

/** Matches eslint-config-next’s JS/TS family — one place for custom `files` globs. */
const JS_TS_FILES = ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"];

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

/**
 * `memo`: no inline function/arrow — wrap a named `const` (keeps `.name`).
 * Prefer React 19 `ref` as a prop over `forwardRef` (banned via `no-restricted-imports` on app UI).
 */
const memoNamedIdentifierMessage =
  "Pass a named component identifier to memo: `const Foo = () => { … }; export const FooMemo = memo(Foo)`. No inline `() =>` or `function` — those are Anonymous in DevTools / fail `react/display-name`. See docs/conventions.md.";

const memoNamedIdentifierRestrictions = [
  {
    selector: "CallExpression[callee.name='memo'] > ArrowFunctionExpression",
    message: memoNamedIdentifierMessage,
  },
  {
    selector:
      "CallExpression[callee.property.name='memo'] > ArrowFunctionExpression",
    message: memoNamedIdentifierMessage,
  },
  {
    selector: "CallExpression[callee.name='memo'] > FunctionExpression",
    message: memoNamedIdentifierMessage,
  },
  {
    selector:
      "CallExpression[callee.property.name='memo'] > FunctionExpression",
    message: memoNamedIdentifierMessage,
  },
];

const nonNextExportStyleRestrictions = [
  ...nonNextFunctionDeclarationRestrictions,
  nonNextExportConstMustBeArrowRestriction,
  ...memoNamedIdentifierRestrictions,
];

/** Prefer React 19 ref-as-prop; `forwardRef` is legacy (will be deprecated). */
const preferEsToolkitMessage =
  "Use es-toolkit instead of Lodash/Underscore. See docs/conventions.md (TypeScript / JavaScript).";

const noLodashImportPaths = [
  { name: "lodash", message: preferEsToolkitMessage },
  { name: "lodash-es", message: preferEsToolkitMessage },
  { name: "underscore", message: preferEsToolkitMessage },
];

const noLodashImportPatterns = [
  {
    group: ["lodash/*", "lodash.*", "lodash-es/*"],
    message: preferEsToolkitMessage,
  },
];

const zustandCreateOnlyInStoreMessage =
  "Import Zustand only in lib/create-store.ts; define stores with createStore in stores/use-*-store.ts as use*Store. See docs/client-ui-state.md.";

const noZustandImportPaths = [
  {
    name: "zustand",
    message: zustandCreateOnlyInStoreMessage,
  },
];

const noZustandImportPatterns = [
  {
    group: ["zustand/*"],
    message: zustandCreateOnlyInStoreMessage,
  },
];

/** `lib/testing/**` is Vitest-suite infrastructure — never shipped app code. */
const testOnlyImportPatterns = [
  {
    group: [
      "@/lib/testing",
      "@/lib/testing/*",
      "@/lib/testing/**",
      "**/lib/testing/*",
      "**/lib/testing/**",
    ],
    message:
      "lib/testing/** is test-only: import it from *.test.* files. See docs/testing.md.",
  },
];

/** Lodash/Underscore banned everywhere we lint (es-toolkit is the utility lib). */
const noLodashImport = {
  "no-restricted-imports": [
    "error",
    {
      paths: [...noLodashImportPaths, ...noZustandImportPaths],
      patterns: [
        ...noLodashImportPatterns,
        ...noZustandImportPatterns,
        ...testOnlyImportPatterns,
      ],
    },
  ],
};

/** Prefer React 19 ref-as-prop; also re-state Lodash + Zustand-location bans. */
const noForwardRefImport = {
  "no-restricted-imports": [
    "error",
    {
      paths: [
        {
          name: "react",
          importNames: ["forwardRef"],
          message:
            "Pass `ref` as a normal prop (React 19). Do not use forwardRef. See docs/conventions.md.",
        },
        ...noLodashImportPaths,
        ...noZustandImportPaths,
      ],
      patterns: [
        ...noLodashImportPatterns,
        ...noZustandImportPatterns,
        ...testOnlyImportPatterns,
      ],
    },
  ],
};

/**
 * `no-restricted-imports` for modules that **may** import `lib/testing/**`.
 *
 * Same bans as `noForwardRefImport` (forwardRef, Lodash, Zustand-in-the-wrong-place)
 * but **omits** `testOnlyImportPatterns`. Needed because flat config replaces the whole
 * `no-restricted-imports` rule — you cannot “turn off” only the lib/testing patterns.
 *
 * Use for: `lib/testing/**` (siblings) and `vitest.setup.ts` (MSW lifecycle import).
 * Not about React refs — forwardRef stays banned here; the point is allowing test helpers.
 */
const noRestrictedImportsAllowLibTesting = {
  "no-restricted-imports": [
    "error",
    {
      paths: [
        {
          name: "react",
          importNames: ["forwardRef"],
          message:
            "Pass `ref` as a normal prop (React 19). Do not use forwardRef. See docs/conventions.md.",
        },
        ...noLodashImportPaths,
        ...noZustandImportPaths,
      ],
      patterns: [...noLodashImportPatterns, ...noZustandImportPatterns],
    },
  ],
};

/** lib/create-store.ts may import zustand; still ban forwardRef + Lodash. */
const noForwardRefImportAllowZustand = {
  "no-restricted-imports": [
    "error",
    {
      paths: [
        {
          name: "react",
          importNames: ["forwardRef"],
          message:
            "Pass `ref` as a normal prop (React 19). Do not use forwardRef. See docs/conventions.md.",
        },
        ...noLodashImportPaths,
      ],
      patterns: [...noLodashImportPatterns, ...testOnlyImportPatterns],
    },
  ],
};

/** App UI: no co-exported types — keep props local or use sibling `*.types.ts`. */
const appUiNoExportedTypeMessage =
  "Do not export types/interfaces from app UI component files (keeps filename ↔ export on). Keep props file-local, or move importable types to a sibling `*.types.ts`. See docs/conventions.md.";

const appUiNoGenericDataPropMessage =
  "Name UI props after the value (list, lists, board, card, auditLog). Keep library `data` (Prisma, ActionState, useQuery). See docs/conventions.md.";

/** App UI: ban generic `data` as a component prop / JSX attribute — not `data-*`, not `.data`. */
const appUiNoGenericDataPropRestrictions = [
  {
    selector: "JSXAttribute[name.name='data']",
    message: appUiNoGenericDataPropMessage,
  },
  {
    selector:
      "TSInterfaceDeclaration[id.name=/Props$/] TSPropertySignature[key.name='data']",
    message: appUiNoGenericDataPropMessage,
  },
  {
    selector:
      "TSTypeAliasDeclaration[id.name=/Props$/] TSPropertySignature[key.name='data']",
    message: appUiNoGenericDataPropMessage,
  },
];

const appUiNoExportedTypeRestrictions = [
  {
    selector:
      "ExportNamedDeclaration[declaration.type='TSTypeAliasDeclaration']",
    message: appUiNoExportedTypeMessage,
  },
  {
    selector:
      "ExportNamedDeclaration[declaration.type='TSInterfaceDeclaration']",
    message: appUiNoExportedTypeMessage,
  },
  {
    // `export type { Foo }` / `export type { Foo } from '…'` (no inline declaration)
    selector: "ExportNamedDeclaration[exportKind='type']:not([declaration])",
    message: appUiNoExportedTypeMessage,
  },
];

/**
 * Event handler naming — docs/conventions.md.
 * Prefer destructuring; keep prop names as `on*` and locals as `handle*` so the
 * two stay distinguishable. (Stock react/jsx-handler-names rejects bare `on*`
 * values, which forces rename aliases or `props.on*` — we avoid both.)
 */
const eventHandlerValueMessage =
  "Handler values must be `handle*` (local fn) or `on*` (destructured prop). See docs/conventions.md.";

const eventHandlerPropKeyMessage =
  "Handler props must start with `on` (e.g. onClick), not `handle`. See docs/conventions.md.";

const eventHandlerNamingRestrictions = [
  {
    selector:
      "JSXAttribute[name.name=/^on[A-Z]/] > JSXExpressionContainer > Identifier[name=/^(?!(handle|on)[A-Z])\\w+/]",
    message: eventHandlerValueMessage,
  },
  {
    selector:
      "JSXAttribute[name.name=/^on[A-Z]/] > JSXExpressionContainer > MemberExpression > Identifier.property[name=/^(?!(handle|on)[A-Z])\\w+/]",
    message: eventHandlerValueMessage,
  },
  {
    selector: "JSXAttribute[name.name=/^handle[A-Z]/]",
    message: eventHandlerPropKeyMessage,
  },
];

/**
 * try/catch + Promise rejection callbacks — docs/conventions.md.
 * Spec / Next.js call the value a *rejection reason* (`unknown`), not necessarily
 * an `Error`. Naming it `reason` teaches that; `error`/`err` imply the wrong type.
 * Omit unused try/catch bindings (`catch {`). Inline `.catch` / `then` onRejected
 * params must be `reason` when present.
 */
const catchReasonMessage =
  "Name thrown/rejected values `reason` (not `error`/`err`) — a rejection reason is `unknown`, not always an Error. See docs/conventions.md.";

const catchReasonNamingRestrictions = [
  {
    // try { … } catch (x) — any param that is not the identifier `reason`
    selector: "CatchClause[param][param.name!='reason']",
    message: catchReasonMessage,
  },
  {
    // promise.catch((x) => …) / .catch(function (x) { … })
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='catch'] > ArrowFunctionExpression[params.0.type='Identifier'][params.0.name!='reason']",
    message: catchReasonMessage,
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='catch'] > FunctionExpression[params.0.type='Identifier'][params.0.name!='reason']",
    message: catchReasonMessage,
  },
  {
    // promise.catch(({ message }) => …) / patterns — require a `reason` identifier
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='catch'] > ArrowFunctionExpression[params.0.type=/^(ObjectPattern|ArrayPattern|AssignmentPattern)$/]",
    message: catchReasonMessage,
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='catch'] > FunctionExpression[params.0.type=/^(ObjectPattern|ArrayPattern|AssignmentPattern)$/]",
    message: catchReasonMessage,
  },
  {
    // promise.then(ok, (x) => …) — second arg is onRejected
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='then'][arguments.length>=2] > ArrowFunctionExpression:nth-child(2)[params.0.type='Identifier'][params.0.name!='reason']",
    message: catchReasonMessage,
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='then'][arguments.length>=2] > FunctionExpression:nth-child(2)[params.0.type='Identifier'][params.0.name!='reason']",
    message: catchReasonMessage,
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='then'][arguments.length>=2] > ArrowFunctionExpression:nth-child(2)[params.0.type=/^(ObjectPattern|ArrayPattern|AssignmentPattern)$/]",
    message: catchReasonMessage,
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='then'][arguments.length>=2] > FunctionExpression:nth-child(2)[params.0.type=/^(ObjectPattern|ArrayPattern|AssignmentPattern)$/]",
    message: catchReasonMessage,
  },
];

/**
 * Zustand store action keys — docs/client-ui-state.md.
 * Ban React-style `on*` / `handle*` on store APIs; prefer domain verbs (`open`).
 * Scoped to store modules under stores/ (files matching use-*-store.ts).
 */
const zustandStoreActionMessage =
  "Zustand store keys must not use React `on*` / `handle*` names — use domain verbs (e.g. open, close). See docs/client-ui-state.md.";

const zustandStoreActionNamingRestrictions = [
  {
    selector: "Property[key.name=/^(on|handle)[A-Z]/]",
    message: zustandStoreActionMessage,
  },
  {
    selector: "TSPropertySignature[key.name=/^(on|handle)[A-Z]/]",
    message: zustandStoreActionMessage,
  },
  {
    selector: "TSMethodSignature[key.name=/^(on|handle)[A-Z]/]",
    message: zustandStoreActionMessage,
  },
];

/**
 * Require a selector on Zustand store hooks — docs/client-ui-state.md.
 * Convention: store hooks are named `use*Store` (no allowlist to maintain).
 * Also bans identity selectors `(s) => s` / `(s) => { return s }` (whole-store subscribe).
 */
const zustandSelectorRequiredMessage =
  "Pass a slice selector to Zustand store hooks (e.g. useXStore((s) => s.open)). Bare useXStore() subscribes to the whole store. See docs/client-ui-state.md.";

const zustandIdentitySelectorMessage =
  "Do not use an identity selector (s) => s — pick a field or action (e.g. (s) => s.isOpen). See docs/client-ui-state.md.";

const zustandSelectorRequiredRestrictions = [
  {
    selector:
      "CallExpression[callee.name=/^use[A-Z]\\w*Store$/][arguments.length=0]",
    message: zustandSelectorRequiredMessage,
  },
  {
    // useXStore((s) => s)
    selector:
      "CallExpression[callee.name=/^use[A-Z]\\w*Store$/] > ArrowFunctionExpression[params.length=1][params.0.type='Identifier'][body.type='Identifier']",
    message: zustandIdentitySelectorMessage,
  },
  {
    // useXStore((s) => { return s })
    selector:
      "CallExpression[callee.name=/^use[A-Z]\\w*Store$/] > ArrowFunctionExpression[params.length=1][params.0.type='Identifier'][body.type='BlockStatement'] > BlockStatement[body.length=1] > ReturnStatement[argument.type='Identifier']",
    message: zustandIdentitySelectorMessage,
  },
];

/** Exported bindings in store modules: use*Store hooks and select* derived selectors. */
const zustandStoreExportNameMessage =
  "Zustand store modules may export use*Store hooks and select* derived selectors only (e.g. useProModalStore, selectCardModalIsOpen). See docs/client-ui-state.md.";

const zustandStoreExportNameRestrictions = [
  {
    selector:
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/^(?!use[A-Z]\\w*Store$|select[A-Z]\\w+)\\w+/]",
    message: zustandStoreExportNameMessage,
  },
  {
    selector:
      "ExportNamedDeclaration > FunctionDeclaration[id.name=/^(?!use[A-Z]\\w*Store$|select[A-Z]\\w+)\\w+/]",
    message: zustandStoreExportNameMessage,
  },
];

/**
 * Store modules must build hooks with createStore from @/lib/create-store.
 * See docs/client-ui-state.md.
 */
const zustandCreateStoreRequiredMessage =
  "Define store hooks with createStore from @/lib/create-store (do not call zustand create here). See docs/client-ui-state.md.";

/** `use-card-modal-store.ts` → `CardModalStore` — docs/client-ui-state.md */
const kebabToPascal = (kebab) =>
  kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const devtoolsNameFromStoreFilename = (filename) => {
  const base = basename(filename).replace(/\.(ts|tsx)$/u, "");
  if (!/^use-[a-z0-9-]+-store$/u.test(base)) return undefined;
  return kebabToPascal(base.slice("use-".length));
};

const zustandDevtoolsNamePlugin = {
  meta: { name: "zustand-devtools-name" },
  rules: {
    "name-matches-file": {
      meta: {
        type: "problem",
        docs: {
          description:
            "createStore's DevTools name must match the store filename. See docs/client-ui-state.md.",
        },
        schema: [],
        messages: {
          missing:
            'Pass a DevTools name as createStore\'s second argument ("CardModalStore" from use-card-modal-store.ts). See docs/client-ui-state.md.',
          mismatch:
            "DevTools name {{actual}} must be {{expected}} (from this filename). See docs/client-ui-state.md.",
        },
      },
      create(context) {
        const expected = devtoolsNameFromStoreFilename(context.filename);
        if (!expected) return {};

        return {
          CallExpression(node) {
            if (
              node.callee.type !== "Identifier" ||
              node.callee.name !== "createStore"
            ) {
              return;
            }

            const nameArg = node.arguments[1];
            if (
              nameArg?.type !== "Literal" ||
              typeof nameArg.value !== "string"
            ) {
              context.report({ node, messageId: "missing" });
              return;
            }

            if (nameArg.value !== expected) {
              context.report({
                node: nameArg,
                messageId: "mismatch",
                data: {
                  actual: JSON.stringify(nameArg.value),
                  expected: JSON.stringify(expected),
                },
              });
            }
          },
        };
      },
    },
  },
};

const zustandCreateStoreRequiredRestrictions = [
  {
    selector:
      "Program:not(:has(ImportDeclaration[source.value='@/lib/create-store'] > ImportSpecifier[imported.name='createStore']))",
    message: zustandCreateStoreRequiredMessage,
  },
  {
    selector:
      "VariableDeclarator[id.name=/^use[A-Z]\\w*Store$/][init.type='CallExpression'][init.callee.name!='createStore']",
    message: zustandCreateStoreRequiredMessage,
  },
  {
    selector:
      "VariableDeclarator[id.name=/^use[A-Z]\\w*Store$/][init.type!='CallExpression']",
    message: zustandCreateStoreRequiredMessage,
  },
];

/**
 * NODE_ENV checks only in lib/env.ts — use isDevelopment / isProduction elsewhere.
 * See docs/conventions.md.
 */
const nodeEnvViaLibEnvMessage =
  "Use isDevelopment / isProduction from @/lib/env instead of process.env.NODE_ENV. See docs/conventions.md.";

const nodeEnvViaLibEnvRestrictions = [
  {
    // process.env.NODE_ENV
    selector:
      "MemberExpression[object.object.name='process'][object.property.name='env'][property.name='NODE_ENV']",
    message: nodeEnvViaLibEnvMessage,
  },
  {
    // process.env["NODE_ENV"]
    selector:
      "MemberExpression[object.object.name='process'][object.property.name='env'][property.value='NODE_ENV']",
    message: nodeEnvViaLibEnvMessage,
  },
];

/**
 * Argument-less `new Date()` → date-fns `constructNow(undefined)` (or pass a
 * reference date for that constructor). `new Date(value)` and `Date.now()` stay.
 * See docs/conventions.md.
 */
const constructNowRestrictions = [
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message:
      "Use constructNow(undefined) from date-fns instead of new Date(). Pass a Date/TZDate when you need that constructor’s now. new Date(value) is fine for parse/fixed instants; Date.now() for epoch ms. See docs/conventions.md.",
  },
];

/** Narrow FormData via formDataString — docs/data.md. */
const formDataGetAsStringRestrictions = [
  {
    selector:
      "TSAsExpression[typeAnnotation.typeAnnotation.type='TSStringKeyword'] > CallExpression[callee.property.name='get'][callee.object.name='formData']",
    message:
      "Narrow FormData with formDataString (lib/form-data.ts), not `as string`. See docs/data.md.",
  },
];

/**
 * SkeletonStatus + section/item compounds — docs/conventions.md
 * (section vs item skeletons).
 * - Hand-rolled `aria-label="Loading …"` → use SkeletonStatus
 * - `Foo.Skeleton` must wrap SkeletonStatus (section landmark)
 * - `Foo.SkeletonItem` must not wrap SkeletonStatus (row placeholder)
 * - `<SkeletonStatus>` only inside a `Foo.Skeleton =` assignment
 */
/**
 * Fishery: call `*Factory.build` / `create` / `buildList` / `createList` inside
 * `test` (or a helper fn), not at module / describe / beforeEach scope — docs/testing.md.
 */
const fisheryFactoryCall =
  "CallExpression[callee.object.name=/Factory$/][callee.property.name=/^(build|create|buildList|createList)$/]";

const fisheryFactoryBuildRestrictions = [
  {
    selector: `Program > VariableDeclaration > VariableDeclarator > ${fisheryFactoryCall}`,
    message:
      "Do not call *Factory.build/create at module scope — build inside each test (or a helper). See docs/testing.md (Fishery).",
  },
  {
    selector: `CallExpression[callee.name='describe'] > :matches(ArrowFunctionExpression, FunctionExpression) > BlockStatement > VariableDeclaration > VariableDeclarator > ${fisheryFactoryCall}`,
    message:
      "Do not share a *Factory.build/create across tests via describe scope — build inside each test. See docs/testing.md (Fishery).",
  },
  {
    selector: `CallExpression[callee.name=/^(beforeEach|beforeAll)$/] ${fisheryFactoryCall}`,
    message:
      "Do not build Fishery objects in beforeEach/beforeAll (shared mutable setup). Build inside each test; rewindSequence is OK. See docs/testing.md (Fishery).",
  },
];

const skeletonStatusLabelMessage =
  "Use <SkeletonStatus heading={…}> from @/components/skeleton-status for loading-region labels (share `heading` with the section title when one exists). See docs/conventions.md.";

const skeletonCompoundFunction =
  "AssignmentExpression[left.property.name='$NAME'][right.type=/^(FunctionExpression|ArrowFunctionExpression)$/]";

const skeletonStatusLabelRestrictions = [
  {
    selector:
      'JSXAttribute[name.name="aria-label"] > Literal[value=/^Loading /]',
    message: skeletonStatusLabelMessage,
  },
  {
    selector:
      'JSXAttribute[name.name="aria-label"] > JSXExpressionContainer > Literal[value=/^Loading /]',
    message: skeletonStatusLabelMessage,
  },
  {
    selector:
      'JSXAttribute[name.name="aria-label"] > JSXExpressionContainer > TemplateLiteral[quasis.0.value.raw=/^Loading /]',
    message: skeletonStatusLabelMessage,
  },
  {
    selector: `${skeletonCompoundFunction.replace("$NAME", "Skeleton")}:not(:has(JSXOpeningElement[name.name='SkeletonStatus']))`,
    message:
      "Section compound `Foo.Skeleton` must wrap content in <SkeletonStatus heading={…}>. For bare row placeholders use `Foo.SkeletonItem` instead. See docs/conventions.md.",
  },
  {
    selector: `${skeletonCompoundFunction.replace("$NAME", "SkeletonItem")}:has(JSXOpeningElement[name.name='SkeletonStatus'])`,
    message:
      "Item compound `Foo.SkeletonItem` must stay a bare row placeholder — do not wrap <SkeletonStatus> (parent `Foo.Skeleton` owns the landmark). See docs/conventions.md.",
  },
];

/** App UI only — colocated SkeletonStatus suite must render the wrapper. */
const skeletonStatusInlineUsageRestrictions = [
  {
    selector:
      "JSXOpeningElement[name.name='SkeletonStatus']:not(AssignmentExpression[left.property.name='Skeleton'] JSXOpeningElement)",
    message:
      "Use <SkeletonStatus> only inside a section compound `Foo.Skeleton = …` (not inline in load branches or item skeletons). See docs/conventions.md.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs["flat/recommended-strict"],
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vitest V8 HTML/JS report (gitignored; also in .prettierignore)
    "coverage/**",
    // Vendor / agent skill trees (not app source)
    ".agents/**",
    ".claude/**",
    ".windsurf/**",
    "app/generated/**",
  ]),

  // Link = in-app; <a> = external. Inverse of @next/next/no-html-link-for-pages.
  // Flat config: later `no-restricted-syntax` for overlapping files must re-include these.
  {
    files: JS_TS_FILES,
    ignores: ["lib/env.ts"],
    rules: {
      "@next/next/no-html-link-for-pages": "error",
      // Tabnabbing: target="_blank" requires rel with noopener/noreferrer (off in Next’s defaults).
      "react/jsx-no-target-blank": "error",
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        ...eventHandlerNamingRestrictions,
        ...catchReasonNamingRestrictions,
        ...zustandSelectorRequiredRestrictions,
        ...nodeEnvViaLibEnvRestrictions,
        ...constructNowRestrictions,
        ...formDataGetAsStringRestrictions,
        ...skeletonStatusLabelRestrictions,
        ...skeletonStatusInlineUsageRestrictions,
      ],
    },
  },

  // typedRoutes casts live only in lib/paths.ts (ignored here).
  {
    files: JS_TS_FILES,
    ignores: ["lib/paths.ts", "lib/env.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        ...eventHandlerNamingRestrictions,
        ...catchReasonNamingRestrictions,
        ...zustandSelectorRequiredRestrictions,
        ...nodeEnvViaLibEnvRestrictions,
        ...constructNowRestrictions,
        ...formDataGetAsStringRestrictions,
        ...skeletonStatusLabelRestrictions,
        ...skeletonStatusInlineUsageRestrictions,
        routeCastOnlyInPathsRestriction,
      ],
    },
  },

  // Next.js special files: default/`generate*`/HTTP handlers use `export [async] function`.
  {
    files: NEXT_SPECIAL_FILES,
    rules: {
      ...noLodashImport,
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        ...eventHandlerNamingRestrictions,
        ...catchReasonNamingRestrictions,
        ...zustandSelectorRequiredRestrictions,
        ...nodeEnvViaLibEnvRestrictions,
        ...constructNowRestrictions,
        ...formDataGetAsStringRestrictions,
        ...skeletonStatusLabelRestrictions,
        ...skeletonStatusInlineUsageRestrictions,
        routeCastOnlyInPathsRestriction,
        ...nextSpecialExportRestrictions,
      ],
    },
  },

  // Non-Next app modules: `export const` + arrow, not `export [async] function` (named or default).
  // `lib/paths.ts` / `lib/env.ts` handled below — this block re-includes the `as Route` ban.
  {
    files: JS_TS_FILES,
    ignores: [
      "components/ui/**",
      "lib/paths.ts",
      "lib/env.ts",
      ...NEXT_SPECIAL_FILES,
    ],
    rules: {
      ...noForwardRefImport,
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        ...eventHandlerNamingRestrictions,
        ...catchReasonNamingRestrictions,
        ...zustandSelectorRequiredRestrictions,
        ...nodeEnvViaLibEnvRestrictions,
        ...constructNowRestrictions,
        ...formDataGetAsStringRestrictions,
        ...skeletonStatusLabelRestrictions,
        ...skeletonStatusInlineUsageRestrictions,
        routeCastOnlyInPathsRestriction,
        ...nonNextExportStyleRestrictions,
      ],
    },
  },

  // hooks/: filename kebab ↔ single named export camelCase (use-action.ts → useAction).
  {
    files: ["hooks/**/*.{ts,tsx}"],
    plugins: {
      "filename-match-export": filenameMatchExport,
    },
    rules: {
      "filename-match-export/match-named-export": "error",
    },
  },

  // providers/: app wiring (Query, Clerk, theme, …) — filename ↔ export.
  {
    files: ["providers/**/*.{ts,tsx}"],
    plugins: {
      "filename-match-export": filenameMatchExport,
    },
    rules: {
      "filename-match-export/match-named-export": "error",
    },
  },

  // stores/: Zustand client UI stores — filename ↔ export; createStore; use*Store; domain verbs.
  // Re-includes Non-Next syntax rules — flat config replaces, does not merge.
  {
    files: ["stores/**/*-store.ts", "stores/**/*-store.tsx"],
    plugins: {
      "filename-match-export": filenameMatchExport,
      "zustand-devtools-name": zustandDevtoolsNamePlugin,
    },
    rules: {
      "filename-match-export/match-named-export": "error",
      "zustand-devtools-name/name-matches-file": "error",
      ...noForwardRefImport,
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        ...eventHandlerNamingRestrictions,
        ...catchReasonNamingRestrictions,
        ...zustandSelectorRequiredRestrictions,
        ...nodeEnvViaLibEnvRestrictions,
        ...constructNowRestrictions,
        ...formDataGetAsStringRestrictions,
        ...skeletonStatusLabelRestrictions,
        ...skeletonStatusInlineUsageRestrictions,
        ...zustandStoreActionNamingRestrictions,
        ...zustandStoreExportNameRestrictions,
        ...zustandCreateStoreRequiredRestrictions,
        routeCastOnlyInPathsRestriction,
        ...nonNextExportStyleRestrictions,
      ],
    },
  },

  // Sole module allowed to import zustand — wraps create + devtools.
  {
    files: ["lib/create-store.ts"],
    rules: {
      ...noForwardRefImportAllowZustand,
    },
  },

  // Test-only helpers: may import each other; app code may not — docs/testing.md
  {
    files: ["lib/testing/**/*.{ts,tsx}"],
    rules: {
      ...noRestrictedImportsAllowLibTesting,
    },
  },

  // Setup is not `*.test.*`, but must import MSW from lib/testing — same allowlist as above.
  {
    files: ["vitest.setup.ts"],
    rules: {
      ...noRestrictedImportsAllowLibTesting,
    },
  },

  // Sole `as Route` cast site: enforce export style here, but do not ban casts.
  {
    files: ["lib/paths.ts"],
    rules: {
      ...noForwardRefImport,
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        ...eventHandlerNamingRestrictions,
        ...catchReasonNamingRestrictions,
        ...zustandSelectorRequiredRestrictions,
        ...nodeEnvViaLibEnvRestrictions,
        ...constructNowRestrictions,
        ...formDataGetAsStringRestrictions,
        ...skeletonStatusLabelRestrictions,
        ...skeletonStatusInlineUsageRestrictions,
        ...nonNextExportStyleRestrictions,
      ],
    },
  },

  // Sole NODE_ENV read site: isDevelopment / isProduction. Do not ban NODE_ENV here.
  {
    files: ["lib/env.ts"],
    rules: {
      ...noForwardRefImport,
      "no-restricted-syntax": [
        "error",
        ...linkVsAnchorRestrictions,
        ...eventHandlerNamingRestrictions,
        ...catchReasonNamingRestrictions,
        ...zustandSelectorRequiredRestrictions,
        ...constructNowRestrictions,
        ...formDataGetAsStringRestrictions,
        ...skeletonStatusLabelRestrictions,
        ...skeletonStatusInlineUsageRestrictions,
        routeCastOnlyInPathsRestriction,
        ...nonNextExportStyleRestrictions,
      ],
    },
  },

  // shadcn may use `forwardRef`; still ban Lodash (es-toolkit only).
  // NODE_ENV ban comes from the shared JS_TS `no-restricted-syntax` blocks above.
  {
    files: ["components/ui/**/*.{ts,tsx}"],
    rules: {
      ...noLodashImport,
    },
  },

  // Filename ↔ export, generics denylist, ComponentProps naming for app UI (not shadcn).
  // Pages stay out of this block: non-Next `export const` bans would forbid
  // `export async function generateMetadata`. See the page-only block below.
  // `*.types.ts` is the allowed place for importable UI types (see no-exported-type rules).
  {
    files: ["components/**/*.{ts,tsx}", "app/**/_components/**/*.{ts,tsx}"],
    ignores: ["components/ui/**", "**/*.types.ts"],
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
      ...noForwardRefImport,
      // Re-include prior no-restricted-syntax entries — flat config replaces, does not merge.
      "no-restricted-syntax": [
        "error",
        ...genericComponentRestrictions,
        ...linkVsAnchorRestrictions,
        ...eventHandlerNamingRestrictions,
        ...catchReasonNamingRestrictions,
        ...zustandSelectorRequiredRestrictions,
        ...nodeEnvViaLibEnvRestrictions,
        ...constructNowRestrictions,
        ...formDataGetAsStringRestrictions,
        ...skeletonStatusLabelRestrictions,
        ...skeletonStatusInlineUsageRestrictions,
        routeCastOnlyInPathsRestriction,
        ...nonNextExportStyleRestrictions,
        ...appUiNoExportedTypeRestrictions,
        ...appUiNoGenericDataPropRestrictions,
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

  // Vitest suites — rationale: docs/testing.md
  // https://github.com/vitest-dev/eslint-plugin-vitest
  // *.test.* = Vitest; *.spec.* = Playwright under e2e/ only.
  // Use `*.test.` / `*.spec.` globs (not `{test}` alone — single-option braces don’t match).
  {
    ...vitest.configs.recommended,
    files: ["**/*.test.{ts,tsx}"],
    ignores: ["e2e/**"],
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/consistent-test-it": ["error", { fn: "test" }],
      "vitest/consistent-vitest-vi": ["error", { fn: "vi" }],
      "vitest/prefer-importing-vitest-globals": "error",
      "vitest/consistent-each-for": [
        "error",
        { test: "for", it: "for", describe: "for", suite: "for" },
      ],
      "vitest/hoisted-apis-on-top": "error",
      "vitest/no-alias-methods": "error",
      "vitest/prefer-strict-equal": "error",
      "vitest/no-test-prefixes": "error",
      "vitest/prefer-hooks-on-top": "error",
      "vitest/prefer-hooks-in-order": "error",
      "vitest/no-duplicate-hooks": "error",
      "vitest/max-nested-describe": ["error", { max: 3 }],
      // Re-state app import bans — flat config replaces, does not merge.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["forwardRef"],
              message:
                "Pass `ref` as a normal prop (React 19). Do not use forwardRef. See docs/conventions.md.",
            },
            ...noLodashImportPaths,
            ...noZustandImportPaths,
            {
              name: "@playwright/test",
              message:
                "*.test.* is Vitest-only. Put Playwright under e2e/*.spec.*. See docs/testing.md.",
            },
          ],
          patterns: [...noLodashImportPatterns, ...noZustandImportPatterns],
        },
      ],
    },
  },

  // Fishery build-site hygiene — docs/testing.md (Fishery practices)
  {
    files: ["**/*.test.{ts,tsx}"],
    ignores: ["e2e/**"],
    rules: {
      // Re-include prior no-restricted-syntax entries — flat config replaces, does not merge.
      "no-restricted-syntax": [
        "error",
        ...fisheryFactoryBuildRestrictions,
        ...linkVsAnchorRestrictions,
        ...eventHandlerNamingRestrictions,
        ...catchReasonNamingRestrictions,
        ...zustandSelectorRequiredRestrictions,
        ...nodeEnvViaLibEnvRestrictions,
        ...constructNowRestrictions,
        ...formDataGetAsStringRestrictions,
        ...skeletonStatusLabelRestrictions,
        routeCastOnlyInPathsRestriction,
        ...nonNextExportStyleRestrictions,
      ],
    },
  },

  // Component suites: same as above plus the app-UI entries from the components block.
  {
    files: [
      "components/**/*.test.{ts,tsx}",
      "app/**/_components/**/*.test.{ts,tsx}",
    ],
    ignores: ["components/ui/**", "e2e/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...fisheryFactoryBuildRestrictions,
        ...genericComponentRestrictions,
        ...linkVsAnchorRestrictions,
        ...eventHandlerNamingRestrictions,
        ...catchReasonNamingRestrictions,
        ...zustandSelectorRequiredRestrictions,
        ...nodeEnvViaLibEnvRestrictions,
        ...constructNowRestrictions,
        ...formDataGetAsStringRestrictions,
        ...skeletonStatusLabelRestrictions,
        routeCastOnlyInPathsRestriction,
        ...nonNextExportStyleRestrictions,
        ...appUiNoExportedTypeRestrictions,
        ...appUiNoGenericDataPropRestrictions,
      ],
    },
  },

  // Prefer jest-dom matchers over generic DOM asserts — docs/testing.md
  // https://github.com/testing-library/eslint-plugin-jest-dom
  {
    ...jestDom.configs["flat/recommended"],
    files: ["**/*.test.{ts,tsx}"],
    ignores: ["e2e/**"],
  },

  // Testing Library query / async / cleanup practices — docs/testing.md
  // https://github.com/testing-library/eslint-plugin-testing-library
  // Use `flat/react` (not `flat/dom`) — we render via `@testing-library/react`.
  {
    ...testingLibrary.configs["flat/react"],
    files: ["**/*.test.{ts,tsx}"],
    ignores: ["e2e/**"],
  },

  // Ban misplaced runner suffixes (always-fail Program selector).
  {
    files: ["**/*.spec.{ts,tsx,js,jsx,mts,cts}"],
    ignores: ["e2e/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message:
            "*.spec.* is reserved for Playwright under e2e/. Use *.test.* for Vitest. See docs/testing.md.",
        },
      ],
    },
  },
  {
    files: ["e2e/**/*.test.{ts,tsx,js,jsx,mts,cts}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message:
            "*.test.* is reserved for Vitest (colocated). Use *.spec.* under e2e/ for Playwright. See docs/testing.md.",
        },
      ],
    },
  },
  // Ban Vitest-documented separate suite folders (colocate *.test.* instead).
  // https://vitest.dev/guide/learn/writing-tests.html · testing-in-practice.html
  // Root `test/` only — nested `test/` can be a real App Router segment.
  {
    files: [
      "**/__tests__/**/*.{ts,tsx,js,jsx,mts,cts}",
      "**/tests/**/*.{ts,tsx,js,jsx,mts,cts}",
      "test/**/*.{ts,tsx,js,jsx,mts,cts}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message:
            "Do not use __tests__/, tests/, or root test/ for Vitest. Colocate *.test.* next to the module; Playwright stays under e2e/*.spec.*. See docs/testing.md.",
        },
      ],
    },
  },
  {
    files: ["e2e/**/*.spec.{ts,tsx,js,jsx,mts,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...noLodashImportPaths,
            {
              name: "vitest",
              message:
                "e2e/*.spec.* is Playwright-only. Use colocated *.test.* for Vitest. See docs/testing.md.",
            },
          ],
          patterns: [
            ...noLodashImportPatterns,
            {
              group: ["vitest/*", "@vitest/*"],
              message:
                "e2e/*.spec.* is Playwright-only. Use colocated *.test.* for Vitest. See docs/testing.md.",
            },
          ],
        },
      ],
    },
  },

  // Zod schemas — recommended (namespace import, *Schema names, trim, Zod 4 deprecations).
  // https://github.com/marcalexiei/eslint-plugin-zod · docs/conventions.md · docs/testing.md
  eslintPluginZod.configs.recommended,

  // Last: turn off stylistic rules that conflict with Prettier (must follow every
  // shareable / local config that might enable them).
  // https://github.com/prettier/eslint-config-prettier#installation
  prettier,
]);

export default eslintConfig;
