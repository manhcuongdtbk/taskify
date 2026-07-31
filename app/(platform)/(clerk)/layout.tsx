export default function ClerkLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-full items-center justify-center">{children}</div>
  );
}
