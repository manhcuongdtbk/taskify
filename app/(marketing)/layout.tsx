import { MarketingNavbar } from "./_components/marketing-navbar";
import { MarketingFooter } from "./_components/marketing-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full bg-slate-100">
      <MarketingNavbar />
      <main className="bg-slate-100 pt-40 pb-20">{children}</main>
      <MarketingFooter />
    </div>
  );
}
