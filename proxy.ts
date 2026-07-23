import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// TODO: Migrate away from middleware-based auth checks. Refer https://clerk.com/docs/nextjs/guides/development/custom-sign-in-or-up-page#make-the-route-public

const PUBLIC_ROUTES = ["/"];
const AUTH_PATHS = ["/sign-in", "/sign-up"];

// Check for matching instead of exact match to allow for nested routes
const matches = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (AUTH_PATHS.some((p) => matches(pathname, p))) return;

  const isPublicRoute = PUBLIC_ROUTES.some((p) => matches(pathname, p));

  const { isAuthenticated, orgId, redirectToSignIn } = await auth();

  // If user is authenticated and on a public route, redirect to the organization page
  if (isAuthenticated && isPublicRoute) {
    const path = orgId ? `/organization/${orgId}` : "/select-org";
    return NextResponse.redirect(new URL(path, req.url));
  }

  // If user is not authenticated and on a non-public route, redirect to the sign in page
  if (!isAuthenticated && !isPublicRoute) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // If user is authenticated and on a non-public route but no organization is selected, redirect to the select organization page
  if (isAuthenticated && !orgId && pathname !== "/select-org") {
    return NextResponse.redirect(new URL("/select-org", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
