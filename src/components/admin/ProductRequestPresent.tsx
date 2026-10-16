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

/** Shannon-inspired medical green */
const GREEN = {
  primary: "#0B6E4F",
  dark: "#08523B",
  soft: "#E6F4EF",
  border: "#0B6E4F",
};

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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid">
      <h2
        className="text-sm font-bold uppercase tracking-[0.12em] pb-2 mb-4 border-b-2"
        style={{ color: GREEN.primary, borderColor: GREEN.primary }}
      >
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
    <div className={cn("py-2", large && "py-2.5")}>
      <dt
        className="text-xs font-bold uppercase tracking-wide"
        style={{ color: GREEN.dark }}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-slate-900 whitespace-pre-wrap font-medium",
          large ? "text-xl leading-snug" : "text-lg leading-snug"
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

  const costImpactLabel = initial.costImpact
    ? initial.costImpact
    : initial.proposedAnnualCostImpact || null;

  const costAmount =
    initial.costImpact && initial.proposedAnnualCostImpact
      ? initial.proposedAnnualCostImpact
      : null;

  return (
    <div
      className={cn(
        "min-h-screen text-slate-900",
        fs ? "p-8 md:p-12" : "p-4 md:p-8"
      )}
      style={{ backgroundColor: "#F7FAF9" }}
    >
      {/* Toolbar */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 mb-6 print:hidden",
          fs && "opacity-50 hover:opacity-100 transition-opacity"
        )}
      >
        <Link href={`/admin/submissions/${initial.id}`}>
          <Button variant="ghost" size="sm" className="text-base font-semibold text-slate-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to detail
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm font-semibold flex items-center gap-1" style={{ color: GREEN.primary }}>
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFs}
            className="text-base font-semibold border-2"
            style={{ borderColor: GREEN.primary, color: GREEN.dark }}
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

      {/* Header */}
      <header
        className="rounded-xl px-6 py-5 mb-8 text-white shadow-md"
        style={{ backgroundColor: GREEN.primary }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90 mb-1">
              Product Request
            </p>
            <h1
              className={cn(
                "font-bold tracking-tight text-white",
                fs ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl"
              )}
            >
              {initial.productServiceName}
            </h1>
          </div>
          <div className="text-right space-y-1 text-white">
            <p className="text-base">
              <span className="text-white/80">Request #</span>{" "}
              <span className="font-bold text-xl">
                {initial.requestNumber || "—"}
              </span>
            </p>
            <p className="text-base">
              <span className="text-white/80">Status:</span>{" "}
              <span className="font-bold">{statusLabel}</span>
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

        <Section title="Reasons for Request">
          <p
            className={cn(
              "whitespace-pre-wrap text-slate-900 font-medium leading-relaxed",
              fs ? "text-xl" : "text-lg"
            )}
          >
            {initial.reasonsForRequest}
          </p>
        </Section>

        <Section title="Financials">
          <dl className="space-y-1">
            <Row label="Proposed monthly cost impact" value={costImpactLabel} large />
            <Row label="Monthly cost amount / range" value={costAmount} />
            <Row
              label="Monthly usage — old / new"
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

      {/* Recommendation */}
      <section
        className="mt-12 pt-8 border-t-4"
        style={{ borderColor: GREEN.primary }}
      >
        <h2
          className="text-sm font-bold uppercase tracking-[0.12em] mb-4"
          style={{ color: GREEN.primary }}
        >
          Recommendation
        </h2>
        <div className="flex flex-wrap gap-3 md:gap-4">
          {RECS.map(({ value, label }) => {
            const active = rec === value;
            const colors =
              value === "APPROVE"
                ? { border: GREEN.primary, bg: GREEN.soft, text: GREEN.dark }
                : value === "DENY"
                  ? { border: "#B91C1C", bg: "#FEF2F2", text: "#991B1B" }
                  : value === "TRIAL"
                    ? { border: "#1D4ED8", bg: "#EFF6FF", text: "#1E3A8A" }
                    : { border: "#B45309", bg: "#FFFBEB", text: "#92400E" };
            return (
              <button
                key={value}
                type="button"
                disabled={saving}
                onClick={() => saveRec(value)}
                className="min-w-[130px] rounded-lg border-2 px-5 py-3.5 text-lg font-bold transition-all"
                style={
                  active
                    ? {
                        borderColor: colors.border,
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }
                    : {
                        borderColor: "#94A3B8",
                        backgroundColor: "#fff",
                        color: "#0F172A",
                      }
                }
              >
                <span
                  className="inline-block w-4 h-4 mr-2 rounded border-2 align-middle"
                  style={{
                    borderColor: active ? colors.border : "#64748B",
                    backgroundColor: active ? colors.border : "transparent",
                  }}
                />
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-5 max-w-2xl">
          <label
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: GREEN.dark }}
          >
            Notes
          </label>
          <textarea
            className="mt-1 w-full rounded-md border-2 border-slate-300 px-3 py-2.5 text-base text-slate-900 font-medium"
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