export const metadata = {
  title: "Customer Authentication - Liquidation Port",
};

export default function CustomerAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-600/20 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 py-8">
      {children}
    </div>
  );
}
