"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const STATUSES = ["NEW", "REVIEWING", "APPROVED", "NOT_APPROVED"] as const;

export function StatusActions({
  id,
  status,
  archived,
}: {
  id: string;
  status: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const update = async (body: Record<string, unknown>) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/submissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {!archived &&
        STATUSES.filter((s) => s !== status).map((s) => (
          <Button
            key={s}
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => update({ status: s })}
            className="text-xs h-7"
          >
            {s.replace("_", " ")}
          </Button>
        ))}
      <Button
        size="sm"
        variant={archived ? "secondary" : "ghost"}
        disabled={loading}
        onClick={() => update({ archived: !archived })}
        className="text-xs h-7"
      >
        {archived ? "Unarchive" : "Archive"}
      </Button>
    </div>
  );
}
