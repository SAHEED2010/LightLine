import { requireOperatorPage } from "@/server/auth";
import { OperatorFrame } from "@/components/operator-ui";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireOperatorPage();
  return <OperatorFrame>{children}</OperatorFrame>;
}
