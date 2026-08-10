import type { ComponentProps } from "react";

function loadingStatusLabel(heading: string) {
  return `Loading ${heading}`;
}

/**
 * Accessible wrapper for **section** `.Skeleton` UIs (one status landmark per
 * loading region). Pass the same `heading` as the loaded section title when one
 * exists. Item/row placeholders use `Foo.SkeletonItem` (no status) —
 * docs/conventions.md. `components/ui/` is shadcn-only — docs/project-structure.md.
 */
export const SkeletonStatus = ({
  heading,
  className,
  children,
  ...props
}: { heading: string } & ComponentProps<"div">) => {
  return (
    <div
      role="status"
      aria-label={loadingStatusLabel(heading)}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};
