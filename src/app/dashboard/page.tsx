import type { Metadata } from "next";
import { ComplaintRegister } from "@/components/operator-ui";
import { requireOperatorPage } from "@/server/auth";

export const metadata: Metadata = { title: "Complaint register" };
export default async function DashboardPage() {
  await requireOperatorPage();
  return <ComplaintRegister />;
}
