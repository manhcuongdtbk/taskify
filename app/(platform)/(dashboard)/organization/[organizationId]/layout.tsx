import { auth } from "@clerk/nextjs/server";
import { OrganizationControl } from "./_components/organization-control";
import { startCase } from "es-toolkit/string";
import { type Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { orgSlug } = await auth();

  return {
    title: startCase(orgSlug || "Organization"),
  };
}

export default function OrganizationIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OrganizationControl />
      {children}
    </>
  );
}
