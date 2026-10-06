"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductRequestSubmission = {
  id: string;
  status: string;
  productServiceName: string;
  vendorManufacturer: string;
  catalogNumber: string;
  productType: string;
  productClassification: string;
  requestNumber: string | null;
  presenters: string | null;
  teamLeads: string | null;
  purpose: string;
  procedures: string;
  usedWith: string | null;
  departmentsImpacted: string | null;
  providersImpacted: string | null;
  reasonsForRequest: string;
  requestingDepartment: string;
  proposedAnnualCostImpact: string;
  annualUsageOld: string | null;
  annualUsageNew: string | null;
  replacingItems: string | null;
  expectedRoi: string;
  recommendation: string;
  recommendationNotes: string | null;
  requestedByNameTitle: string;
};

const RECS = [
  { value: "APPROVE", label: "Approve" },
  { value: "TRIAL", label: "Trial" },
  { value: "TABLE", label: "Table" },
  { value: "DENY", label: "Deny" },
] as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 border-b border-slate-200 pb-2 mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  large,
}: {
  label: string;
  value?: string | null;
  large?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={cn("py-1.5", large && "py-2")}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-slate-900 whitespace-pre-wrap",
          large ? "text-lg leading-snug" : "text-base leading-snug"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function ProductRequestPresent({
  submission: initial,
}: {
  submission: ProductRequestSubmission;
}) {
  const router = useRouter();
  const [fs, setFs] = useState(false);
  const [rec, setRec] = useState(initial.recommendation || "PENDING");
  const [notes, setNotes] = useState(initial.recommendationNotes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleFs = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFs(true);
      } else {
        await document.exitFullscreen();
        setFs(false);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const saveRec = async (value: string) => {
    setRec(value);
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initial.id,
          recommendation: value,
          recommendationNotes: notes,
        }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const statusLabel =
    initial.status === "NEW"
      ? "Pending Review"
      : initial.status.replace("_", " ");

  const productTypeShort = initial.productType?.includes("Replacement")
    ? "Replacement"
    : initial.productType?.includes("New Service")
      ? "New Service"
      : initial.productType?.includes("New Product")
        ? "New Product"
        : initial.productType;

  return (
    <div
      className={cn(
        "min-h-screen bg-white text-slate-900",
        fs ? "p-8 md:p-12" : "p-4 md:p-8"
      )}
    >
      {/* Toolbar — hide-ish in print, keep minimal in fullscreen */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 mb-6 print:hidden",
          fs && "opacity-40 hover:opacity-100 transition-opacity"
        )}
      >
        <Link href={`/admin/submissions/${initial.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to detail
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Button variant="outline" size="sm" onClick={toggleFs}>
            {fs ? (
              <>
                <Minimize2 className="h-4 w-4 mr-1" /> Exit fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-1" /> Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header */}
      <header className="border-b-2 border-slate-800 pb-4 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
              Product Request
            </p>
            <h1
              className={cn(
                "font-bold tracking-tight text-slate-900",
                fs ? "text-4xl md:text-5xl" : "text-3xl"
              )}
            >
              {initial.productServiceName}
            </h1>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm">
              <span className="text-slate-500">Request #</span>{" "}
              <span className="font-semibold text-lg">
                {initial.requestNumber || "—"}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-slate-500">Status:</span>{" "}
              <span className="font-medium">{statusLabel}</span>
            </p>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "grid gap-10",
          fs ? "md:grid-cols-2 lg:gap-14" : "md:grid-cols-2 gap-8"
        )}
      >
        {/* OVERVIEW */}
        <Section title="Overview">
          <dl className="space-y-1">
            <Row label="Description" value={initial.productServiceName} large />
            <Row label="Vendor" value={initial.vendorManufacturer} />
            <Row label="Catalog #" value={initial.catalogNumber} />
            <Row label="Presenter(s)" value={initial.presenters} />
            <Row label="Team Lead(s)" value={initial.teamLeads} />
            <Row label="Purpose" value={initial.purpose} large />
            <Row label="Requested by" value={initial.requestedByNameTitle} />
            <Row label="Requesting department" value={initial.requestingDepartment} />
          </dl>
        </Section>

        {/* PRODUCT DETAILS */}
        <Section title="Product Details">
          <dl className="space-y-1">
            <Row label="Product Type" value={productTypeShort} />
            <Row label="Classification" value={initial.productClassification} />
            <Row label="Procedure(s)" value={initial.procedures} large />
            <Row label="Used with" value={initial.usedWith} />
            <Row label="Department(s)" value={initial.departmentsImpacted} />
            <Row label="Provider(s)" value={initial.providersImpacted} />
          </dl>
        </Section>

        {/* REASONS */}
        <Section title="Reasons for Request">
          <p
            className={cn(
              "whitespace-pre-wrap text-slate-800 leading-relaxed",
              fs ? "text-lg" : "text-base"
            )}
          >
            {initial.reasonsForRequest}
          </p>
        </Section>

        {/* FINANCIALS */}
        <Section title="Financials">
          <dl className="space-y-1">
            <Row
              label="Proposed annual cost increase (savings)"
              value={initial.proposedAnnualCostImpact}
              large
            />
            <Row
              label="Annual usage — old / new"
              value={
                initial.annualUsageOld || initial.annualUsageNew
                  ? `${initial.annualUsageOld || "—"} / ${initial.annualUsageNew || "—"}`
                  : null
              }
            />
            <Row label="Replacing" value={initial.replacingItems} />
            <Row label="Expected ROI" value={initial.expectedRoi} />
          </dl>
        </Section>
      </div>

      {/* RECOMMENDATION */}
      <section className="mt-12 pt-8 border-t-2 border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">
          Recommendation
        </h2>
        <div className="flex flex-wrap gap-3 md:gap-4">
          {RECS.map(({ value, label }) => {
            const active = rec === value;
            return (
              <button
                key={value}
                type="button"
                disabled={saving}
                onClick={() => saveRec(value)}
                className={cn(
                  "min-w-[120px] rounded-lg border-2 px-5 py-3 text-base font-semibold transition-all",
                  active
                    ? value === "APPROVE"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : value === "DENY"
                        ? "border-red-600 bg-red-50 text-red-800"
                        : value === "TRIAL"
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "border-amber-600 bg-amber-50 text-amber-900"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                )}
              >
                <span
                  className={cn(
                    "inline-block w-4 h-4 mr-2 rounded border align-middle",
                    active ? "bg-current border-current" : "border-slate-400"
                  )}
                />
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-4 max-w-2xl">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Notes
          </label>
          <textarea
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== (initial.recommendationNotes || "")) {
                saveRec(rec);
              }
            }}
            placeholder="Optional meeting notes…"
          />
        </div>
      </section>
    </div>
  );
}