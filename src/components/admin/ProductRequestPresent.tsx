"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2, Minimize2, Check } from "lucide-react";
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
  costImpact?: string | null;
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

/** Compact label + value row (document style) */
function Row({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="grid grid-cols-[minmax(9.5rem,11rem)_1fr] gap-x-3 gap-y-0.5 py-[3px] text-[15px] leading-snug">
      <dt className="font-bold text-black shrink-0">{label}</dt>
      <dd className="text-black whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 first:mt-0">
      <h2 className="text-[13px] font-bold uppercase tracking-wide text-black border-b border-black pb-1 mb-2">
        {title}
      </h2>
      <dl>{children}</dl>
    </section>
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
      : initial.status.replace(/_/g, " ");

  const productTypeShort = initial.productType?.includes("Replacement")
    ? "Replacement"
    : initial.productType?.includes("New Service")
      ? "New Service"
      : initial.productType?.includes("New Product")
        ? "New Product"
        : initial.productType;

  const costImpactLine = [
    initial.costImpact,
    initial.proposedAnnualCostImpact,
  ]
    .filter(Boolean)
    .join(" — ");

  const usageLine =
    initial.annualUsageOld || initial.annualUsageNew
      ? `${initial.annualUsageOld || "—"} / ${initial.annualUsageNew || "—"}`
      : null;

  return (
    <div
      className={cn(
        "min-h-screen bg-white text-black",
        fs ? "px-10 py-8 md:px-16 md:py-10" : "px-6 py-5 md:px-10 md:py-6"
      )}
    >
      {/* Minimal toolbar — print hidden */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 mb-4 print:hidden",
          fs && "opacity-40 hover:opacity-100 transition-opacity"
        )}
      >
        <Link href={`/admin/submissions/${initial.id}`}>
          <Button variant="ghost" size="sm" className="text-sm text-black font-medium">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to detail
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm font-medium text-black flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFs}
            className="text-sm font-medium border-black text-black"
          >
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

      {/* Document body — compact print-like layout */}
      <article
        className={cn(
          "mx-auto max-w-3xl",
          fs && "max-w-4xl"
        )}
      >
        {/* Title */}
        <h1 className="text-center text-2xl md:text-[1.75rem] font-bold tracking-wide text-black border-b-2 border-black pb-2 mb-3">
          PRODUCT REQUEST
        </h1>

        {/* Meta line */}
        <div className="flex flex-wrap justify-between gap-2 text-[15px] text-black mb-4">
          <p>
            <span className="font-bold">Request #</span>{" "}
            {initial.requestNumber || "—"}
          </p>
          <p>
            <span className="font-bold">Status:</span> {statusLabel}
          </p>
        </div>

        <Section title="Overview">
          <Row label="Description:" value={initial.productServiceName} />
          <Row label="Vendor:" value={initial.vendorManufacturer} />
          <Row label="Catalog #:" value={initial.catalogNumber} />
          <Row label="Presenter(s):" value={initial.presenters} />
          <Row label="Team Lead(s):" value={initial.teamLeads} />
          <Row label="Purpose:" value={initial.purpose} />
          <Row label="Requested by:" value={initial.requestedByNameTitle} />
          <Row label="Department:" value={initial.requestingDepartment} />
        </Section>

        <Section title="Product Details">
          <Row label="Product Type:" value={productTypeShort} />
          <Row label="Classification:" value={initial.productClassification} />
          <Row label="Procedure(s):" value={initial.procedures} />
          <Row label="Used with:" value={initial.usedWith} />
          <Row label="Department(s):" value={initial.departmentsImpacted} />
          <Row label="Provider(s):" value={initial.providersImpacted} />
          {initial.reasonsForRequest ? (
            <div className="grid grid-cols-[minmax(9.5rem,11rem)_1fr] gap-x-3 py-[3px] text-[15px] leading-snug">
              <dt className="font-bold text-black shrink-0">Reasons for Request:</dt>
              <dd className="text-black whitespace-pre-wrap">
                {initial.reasonsForRequest}
              </dd>
            </div>
          ) : null}
        </Section>

        <Section title="Financials">
          <Row label="Monthly cost impact:" value={costImpactLine || null} />
          <Row label="Monthly usage old/new:" value={usageLine} />
          <Row label="Replacing:" value={initial.replacingItems} />
          <Row label="Expected ROI:" value={initial.expectedRoi} />
        </Section>

        {/* Recommendation */}
        <section className="mt-5">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-black border-b border-black pb-1 mb-3">
            Recommendation
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-black">
            {RECS.map(({ value, label }) => {
              const active = rec === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={saving}
                  onClick={() => saveRec(value)}
                  className="inline-flex items-center gap-2 font-medium hover:opacity-80"
                >
                  <span
                    className={cn(
                      "inline-flex h-[1.1rem] w-[1.1rem] items-center justify-center border border-black text-[11px] leading-none",
                      active && "bg-black text-white"
                    )}
                    aria-hidden
                  >
                    {active ? "✓" : ""}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 max-w-xl print:hidden">
            <label className="text-[13px] font-bold text-black">Notes</label>
            <textarea
              className="mt-1 w-full rounded border border-black/40 px-2 py-1.5 text-[15px] text-black"
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
      </article>
    </div>
  );
}
