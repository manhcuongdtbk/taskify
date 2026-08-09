/**
 * Test-only helper — `lib/testing/**` must not be imported by app code (ESLint).
 * See docs/testing.md.
 *
 * Drop-in for `vi.mock("next/image", () => import("@/lib/testing/next/image"))`.
 * Renders a plain `<img>` so jsdom suites don’t need the Next Image runtime.
 */

type NextImageMockProps = {
  alt: string;
  src: unknown;
  fill?: boolean;
  className?: string;
};

const NextImageMock = ({ alt, src }: NextImageMockProps) => (
  // eslint-disable-next-line @next/next/no-img-element -- test double for next/image
  <img alt={alt} src={typeof src === "string" ? src : undefined} />
);

export default NextImageMock;
