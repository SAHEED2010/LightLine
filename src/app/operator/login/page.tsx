import { LoginForm } from "@/components/operator-login";

export default async function OperatorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm expired={params.expired === "1"} />;
}
