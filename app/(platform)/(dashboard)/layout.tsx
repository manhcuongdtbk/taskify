import { DashboardNavbar } from "./_components/dashboard-navbar";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="h-full">
      <DashboardNavbar />
      {children}
    </div>
  );
}
