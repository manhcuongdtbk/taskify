import type { ComponentProps } from "react";

function loadingStatusLabel(heading: string) {
  return `Loading ${heading}`;
}

/**
 * Accessible wrapper for compound `.Skeleton` UIs. Pass the same `heading`
 * string used for the loaded section title when one exists.
 * docs/conventions.md · docs/project-structure.md (`components/ui/` is shadcn-only)
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
