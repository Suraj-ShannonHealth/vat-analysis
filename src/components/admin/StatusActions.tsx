"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const STATUSES = [
  { value: "NEW", label: "New" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "APPROVED", label: "Approved" },
  { value: "NOT_APPROVED", label: "Not approved" },
] as const;

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
    <div className="flex flex-wrap items-center gap-2">
      {!archived && (
        <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className="sr-only sm:not-sr-only sm:inline">Status</span>
          <select
            className="h-8 min-w-[9.5rem] rounded-md border border-input bg-background px-2 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            value={status}
            disabled={loading}
            onChange={(e) => {
              if (e.target.value !== status) {
                update({ status: e.target.value });
              }
            }}
            aria-label="Change status"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <Button
        size="sm"
        variant={archived ? "secondary" : "outline"}
        disabled={loading}
        onClick={() => {
          if (
            !archived &&
            !window.confirm("Archive this request? You can restore it later from View archived.")
          ) {
            return;
          }
          update({ archived: !archived });
        }}
        className="h-8 text-sm font-medium"
      >
        {archived ? "Unarchive" : "Archive"}
      </Button>
    </div>
  );
}