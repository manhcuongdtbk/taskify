import { OrganizationList } from "@clerk/nextjs";

export default function SelectOrgPage({}: PageProps<"/select-org/[[...select-org]]">) {
  return (
    <OrganizationList
      hidePersonal
      afterSelectOrganizationUrl="/organization/:id"
      afterCreateOrganizationUrl="/organization/:id"
    />
  );
}
