import { type ReactElement } from "react";

/**
 * Props for a wrapper component that forwards its single child into a
 * Base UI component's `render` prop — Base UI's equivalent of Radix's
 * `asChild`.
 *
 * `children` is a `ReactElement` (not `ReactNode`) because `render` accepts
 * a single element. This is the element-only arm of Base UI's exported
 * `useRender.RenderProp` type (from `@base-ui/react/use-render`), which also
 * permits a render function; these wrappers intentionally restrict to one
 * element.
 *
 * Name: "BaseUI" is spelled out explicitly (rather than an implicit name like
 * `RenderForwardingProps`) so that every `extends` site signals its Base UI
 * origin at a glance — clearest for a newcomer who would otherwise have to open
 * this file. The casing matches how Base UI writes the acronym in its own
 * identifiers (e.g. its internal `BaseUIComponentProps`).
 */
export interface BaseUIRenderForwardingProps {
  children: ReactElement;
}
