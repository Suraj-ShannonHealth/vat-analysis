import { redirect, notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionDetailClient } from "@/components/admin/SubmissionDetailClient";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { files: true },
  });

  if (!submission) notFound();

  // Serialize dates for the client component
  const serialized = {
    ...submission,
    createdAt: submission.createdAt.toISOString(),
    dateReceived: submission.dateReceived?.toISOString() ?? null,
    mmActionDate: submission.mmActionDate?.toISOString() ?? null,
    mmTargetDueDate: submission.mmTargetDueDate?.toISOString() ?? null,
    vatActionDate: submission.vatActionDate?.toISOString() ?? null,
    evalActionDate: submission.evalActionDate?.toISOString() ?? null,
  };

  return <SubmissionDetailClient submission={serialized as any} />;
}
