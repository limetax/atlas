import { LoginView } from "@/components/views/LoginView";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/";

  return <LoginView redirectTo={redirectTo} />;
}

export const metadata = {
  title: "Anmelden - limetaxIQ",
  description: "Melden Sie sich bei limetaxIQ an",
};
