/**
 * Product / site display config for app UI and metadata.
 *
 * `name` is the product display name source of truth in code — prefer
 * `siteConfig.name` over hardcoding the brand in components.
 * Docs, Clerk/Stripe dashboards, package name, and domains are outside this
 * object; update those separately when renaming.
 */
export const siteConfig = {
  name: "Taskify",
  description:
    "Collaborate, manage projects, and reach new productivity peaks.",
};

const brandSlug = siteConfig.name.toLowerCase();

/** localStorage keys prefixed with the product slug — keep brand renames in one place. */
export const siteLocalStorageKeys = {
  sidebarExpanded: `${brandSlug}-sidebar-expanded`,
  mobileSidebarExpanded: `${brandSlug}-mobile-sidebar-expanded`,
} as const;
