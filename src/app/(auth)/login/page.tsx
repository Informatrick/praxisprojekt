import { LoginForm } from "./login-form";

export const metadata = { title: "Anmelden — WetterSlot" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm invalidLink={params.error === "invalid-link"} />;
}
