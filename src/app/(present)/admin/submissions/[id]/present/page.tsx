import { redirect, notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductRequestPresent } from "@/components/admin/ProductRequestPresent";

export default async function PresentPage({
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

  const serialized = {
    ...submission,
    createdAt: submission.createdAt.toISOString(),
    dateReceived: submission.dateReceived?.toISOString() ?? null,
  };

  return <ProductRequestPresent submission={serialized as any} />;
}
