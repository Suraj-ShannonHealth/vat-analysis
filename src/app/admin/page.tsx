import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusActions } from "@/components/admin/StatusActions";

const statusVariant: Record<string, "info" | "warning" | "success" | "destructive" | "secondary"> = {
  NEW: "info",
  REVIEWING: "warning",
  APPROVED: "success",
  NOT_APPROVED: "destructive",
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const params = await searchParams;
  const showArchived = params.archived === "1";

  const submissions = await prisma.submission.findMany({
    where: { archived: showArchived },
    orderBy: { createdAt: "desc" },
    include: { files: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Submissions</h1>
          <p className="text-muted-foreground text-sm">
            {showArchived ? "Archived requests" : "Active requests"}
          </p>
        </div>
        <div className="flex gap-2">
          {showArchived ? (
            <Link
              href="/admin"
              className="text-sm text-primary hover:underline"
            >
              ← Active
            </Link>
          ) : (
            <Link
              href="/admin?archived=1"
              className="text-sm text-muted-foreground hover:underline"
            >
              View archived
            </Link>
          )}
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No submissions yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">
                      <Link
                        href={`/admin/submissions/${s.id}`}
                        className="hover:underline"
                      >
                        {s.productServiceName}
                      </Link>
                      {" · "}
                      <Link
                        href={`/admin/submissions/${s.id}/present`}
                        className="text-sm font-normal text-primary hover:underline"
                      >
                        Product Request
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {s.requestedByNameTitle} · {s.requestingDepartment} ·{" "}
                      {s.typeOfRequest}
                    </CardDescription>
                  </div>
                  <Badge variant={statusVariant[s.status] || "secondary"}>
                    {s.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString()} · {s.files.length}{" "}
                  file(s)
                </span>
                <StatusActions
                  id={s.id}
                  status={s.status}
                  archived={s.archived}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}