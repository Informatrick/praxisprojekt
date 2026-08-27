// Zentriertes Karten-Layout für die öffentlichen Auth-Seiten (design.md).
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
