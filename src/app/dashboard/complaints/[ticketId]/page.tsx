import type { Metadata } from "next";
import { ComplaintDetail } from "@/components/operator-ui";
import { requireOperatorPage } from "@/server/auth";

export const metadata: Metadata = { title: "Complaint detail" };
export default async function ComplaintPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  await requireOperatorPage();
  const { ticketId } = await params;
  return <ComplaintDetail key={ticketId} ticketId={ticketId} />;
}
