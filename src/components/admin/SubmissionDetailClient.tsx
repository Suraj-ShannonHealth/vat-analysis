"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusActions } from "@/components/admin/StatusActions";
import {
  ArrowLeft,
  FileText,
  Download,
  Save,
  Loader2,
  Package,
  ClipboardList,
  Scale,
  FlaskConical,
  Warehouse,
  CheckCircle2,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FileRecord = {
  id: string;
  field: string;
  originalName: string;
  path: string;
  size: number;
};

export type AdminSubmission = {
  id: string;
  status: string;
  archived: boolean;
  createdAt: string;
  // form fields
  typeOfRequest: string;
  requestedBy: string;
  requestedByNameTitle: string;
  requesterEmail: string;
  requesterPhone: string;
  requestingDepartment: string;
  isNewProviderService: string;
  productServiceName: string;
  vendorManufacturer: string;
  catalogNumber: string;
  manufacturerRep: string;
  productType: string;
  productClassification: string;
  isMinorEquipment: string;
  capitalEquipmentInfo: string | null;
  presenters: string | null;
  teamLeads: string | null;
  purpose: string;
  procedures: string;
  usedWith: string | null;
  departmentsImpacted: string | null;
  providersImpacted: string | null;
  reasonsForRequest: string;
  currentProcedures: string;
  clinicalMetrics: string;
  governingBody: string | null;
  multiDepartmentUsage: string | null;
  anticipatedMonthlyUsage: string;
  specialHandling: string | null;
  usedWithOtherProduct: string | null;
  proposedAnnualCostImpact: string;
  annualUsageOld: string | null;
  annualUsageNew: string | null;
  replacingItems: string | null;
  expectedRoi: string;
  recommendation: string;
  recommendationNotes: string | null;
  // admin fields
  requestNumber: string | null;
  assignedEmployee: string | null;
  dateReceived: string | null;
  currentCatNumber: string | null;
  currentLawNumber: string | null;
  currentVendor: string | null;
  currentContract: string | null;
  currentPricing: string | null;
  currentUom: string | null;
  currentPkg: string | null;
  currentEachPricing: string | null;
  currentVolume: string | null;
  currentTotalSpend: string | null;
  proposedCatNumber: string | null;
  proposedLawNumber: string | null;
  proposedVendor: string | null;
  proposedContract: string | null;
  proposedPricing: string | null;
  proposedUom: string | null;
  proposedPkg: string | null;
  proposedEachPricing: string | null;
  proposedVolume: string | null;
  proposedTotalSpend: string | null;
  additionalCosts: string | null;
  rebatesIncentives: string | null;
  totalCostProposed: string | null;
  costSavings: string | null;
  deptsUsingExisting: string | null;
  mmComments: string | null;
  mmAction: string | null;
  mmActionDate: string | null;
  mmSpecialtyTeams: string | null;
  mmTargetDueDate: string | null;
  mmDeclineReason: string | null;
  vatReasonForReview: string | null;
  vatDeptsUsing: string | null;
  vatTotalCostSavings: string | null;
  vatAction: string | null;
  vatActionDate: string | null;
  vatTrialCoordinator: string | null;
  vatEducationCoordinator: string | null;
  vatDenyReason: string | null;
  vatNotes: string | null;
  evalTrialCoordinator: string | null;
  evalPhone: string | null;
  evalNotes: string | null;
  evalAction: string | null;
  evalActionDate: string | null;
  inventoryLocation: string | null;
  purchaseUom: string | null;
  issueUom: string | null;
  majorClass: string | null;
  minorClass: string | null;
  accountGlCat: string | null;
  reorderPoint: string | null;
  reorderQty: string | null;
  isReplacementProduct: string | null;
  sohTreatment: string | null;
  files: FileRecord[];
};

const TABS = [
  { id: "summary", label: "Overview", icon: ClipboardList },
  { id: "request", label: "Request Details", icon: Package },
  { id: "material", label: "Material Review", icon: Scale },
  { id: "vat", label: "VAT Review", icon: CheckCircle2 },
  { id: "evaluation", label: "Evaluation", icon: FlaskConical },
  { id: "inventory", label: "Inventory Setup", icon: Warehouse },
  { id: "files", label: "Files", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

const statusVariant: Record<string, "info" | "warning" | "success" | "destructive" | "secondary"> = {
  NEW: "info",
  REVIEWING: "warning",
  APPROVED: "success",
  NOT_APPROVED: "destructive",
};

function Field({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm whitespace-pre-wrap text-slate-800">{value}</dd>
    </div>
  );
}

function EditableField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  rows,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  type?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {rows ? (
        <Textarea
          id={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="text-sm"
        />
      ) : (
        <Input
          id={name}
          type={type}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className="text-sm h-9"
        />
      )}
    </div>
  );
}

export function SubmissionDetailClient({ submission: initial }: { submission: AdminSubmission }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("summary");
  const [form, setForm] = useState<Record<string, string>>(() => {
    const s = initial;
    return {
      requestNumber: s.requestNumber || "",
      assignedEmployee: s.assignedEmployee || "",
      dateReceived: s.dateReceived ? s.dateReceived.slice(0, 10) : "",
      currentCatNumber: s.currentCatNumber || "",
      currentLawNumber: s.currentLawNumber || "",
      currentVendor: s.currentVendor || "",
      currentContract: s.currentContract || "",
      currentPricing: s.currentPricing || "",
      currentUom: s.currentUom || "",
      currentPkg: s.currentPkg || "",
      currentEachPricing: s.currentEachPricing || "",
      currentVolume: s.currentVolume || "",
      currentTotalSpend: s.currentTotalSpend || "",
      proposedCatNumber: s.proposedCatNumber || s.catalogNumber || "",
      proposedLawNumber: s.proposedLawNumber || "",
      proposedVendor: s.proposedVendor || s.vendorManufacturer || "",
      proposedContract: s.proposedContract || "",
      proposedPricing: s.proposedPricing || "",
      proposedUom: s.proposedUom || "ea",
      proposedPkg: s.proposedPkg || "1",
      proposedEachPricing: s.proposedEachPricing || "",
      proposedVolume: s.proposedVolume || s.anticipatedMonthlyUsage || "",
      proposedTotalSpend: s.proposedTotalSpend || "",
      additionalCosts: s.additionalCosts || "",
      rebatesIncentives: s.rebatesIncentives || "",
      totalCostProposed: s.totalCostProposed || "",
      costSavings: s.costSavings || "",
      deptsUsingExisting: s.deptsUsingExisting || "",
      mmComments: s.mmComments || "",
      mmAction: s.mmAction || "",
      mmActionDate: s.mmActionDate ? s.mmActionDate.slice(0, 10) : "",
      mmSpecialtyTeams: s.mmSpecialtyTeams || "",
      mmTargetDueDate: s.mmTargetDueDate ? s.mmTargetDueDate.slice(0, 10) : "",
      mmDeclineReason: s.mmDeclineReason || "",
      vatReasonForReview: s.vatReasonForReview || s.purpose || "",
      vatDeptsUsing: s.vatDeptsUsing || "",
      vatTotalCostSavings: s.vatTotalCostSavings || "",
      vatAction: s.vatAction || "",
      vatActionDate: s.vatActionDate ? s.vatActionDate.slice(0, 10) : "",
      vatTrialCoordinator: s.vatTrialCoordinator || "",
      vatEducationCoordinator: s.vatEducationCoordinator || "",
      vatDenyReason: s.vatDenyReason || "",
      vatNotes: s.vatNotes || "",
      evalTrialCoordinator: s.evalTrialCoordinator || "",
      evalPhone: s.evalPhone || "",
      evalNotes: s.evalNotes || "",
      evalAction: s.evalAction || "",
      evalActionDate: s.evalActionDate ? s.evalActionDate.slice(0, 10) : "",
      inventoryLocation: s.inventoryLocation || "",
      purchaseUom: s.purchaseUom || "",
      issueUom: s.issueUom || "",
      majorClass: s.majorClass || "",
      minorClass: s.minorClass || "",
      accountGlCat: s.accountGlCat || "",
      reorderPoint: s.reorderPoint || "",
      reorderQty: s.reorderQty || "",
      isReplacementProduct: s.isReplacementProduct || "",
      sohTreatment: s.sohTreatment || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const onChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initial.id, ...form }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      router.refresh();
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const quotes = initial.files.filter((f) => f.field === "quote");
  const payor = initial.files.filter((f) => f.field === "payorMix");

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-slate-50/95 backdrop-blur border-b flex flex-wrap items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{initial.productServiceName}</h1>
          <p className="text-xs text-muted-foreground">
            {initial.requestedByNameTitle} · {initial.requestingDepartment} ·{" "}
            {new Date(initial.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={statusVariant[initial.status] || "secondary"}>
          {initial.status.replace("_", " ")}
        </Badge>
        <StatusActions
          id={initial.id}
          status={initial.status}
          archived={initial.archived}
        />
        <Link href={`/admin/submissions/${initial.id}/present`}>
          <Button size="sm" variant="outline">
            <Presentation className="h-4 w-4 mr-1" />
            Product Request
          </Button>
        </Link>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : saved ? "Saved" : "Save review"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md whitespace-nowrap transition-colors",
              tab === id
                ? "bg-white border border-b-white text-primary shadow-sm -mb-px"
                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── SUMMARY ── */}
      {tab === "summary" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6">
              <Field label="Product / Service" value={initial.productServiceName} />
              <Field label="Type of Request" value={initial.typeOfRequest} />
              <Field label="Vendor / Manufacturer" value={initial.vendorManufacturer} />
              <Field label="Catalog #" value={initial.catalogNumber} />
              <Field label="Product Type" value={initial.productType} />
              <Field label="Classification" value={initial.productClassification} />
              <Field label="Purpose" value={initial.purpose} />
              <Field label="Anticipated Monthly Usage" value={initial.anticipatedMonthlyUsage} />
              <Field label="Requested By" value={`${initial.requestedByNameTitle} (${initial.requestedBy})`} />
              <Field label="Department" value={initial.requestingDepartment} />
              <Field label="Email" value={initial.requesterEmail} />
              <Field label="Phone" value={initial.requesterPhone} />
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Product Request snapshot</CardTitle>
              <Link href={`/admin/submissions/${initial.id}/present`} className="text-sm text-primary hover:underline">
                Open meeting view →
              </Link>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6">
              <Field label="Presenter(s)" value={initial.presenters} />
              <Field label="Team Lead(s)" value={initial.teamLeads} />
              <Field label="Purpose" value={initial.purpose} />
              <Field label="Procedure(s)" value={initial.procedures} />
              <Field label="Used with" value={initial.usedWith} />
              <Field label="Department(s)" value={initial.departmentsImpacted} />
              <Field label="Provider(s)" value={initial.providersImpacted} />
              <Field label="Reasons for request" value={initial.reasonsForRequest} />
              <Field label="Current procedures" value={initial.currentProcedures} />
              <Field label="Clinical metrics" value={initial.clinicalMetrics} />
              <Field label="Proposed annual cost impact" value={initial.proposedAnnualCostImpact} />
              <Field label="Annual usage old / new" value={[ initial.annualUsageOld, initial.annualUsageNew ].filter(Boolean).join(" / ") || null} />
              <Field label="Replacing" value={initial.replacingItems} />
              <Field label="Expected ROI" value={initial.expectedRoi} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── REQUEST DETAILS (full form) ── */}
      {tab === "request" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requestor & Item</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <Field label="Type of Request" value={initial.typeOfRequest} />
                <Field label="Requested By" value={initial.requestedBy} />
                <Field label="Name & Title" value={initial.requestedByNameTitle} />
                <Field label="Email" value={initial.requesterEmail} />
                <Field label="Phone" value={initial.requesterPhone} />
                <Field label="Department" value={initial.requestingDepartment} />
                <Field label="New provider/service?" value={initial.isNewProviderService} />
                <Field label="Product/Service" value={initial.productServiceName} />
                <Field label="Vendor/Manufacturer" value={initial.vendorManufacturer} />
                <Field label="Catalog #" value={initial.catalogNumber} />
                <Field label="Rep (Name & Phone)" value={initial.manufacturerRep} />
                <Field label="Product Type" value={initial.productType} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classification & Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <Field label="Classification" value={initial.productClassification} />
                <Field label="Minor equipment?" value={initial.isMinorEquipment} />
                <Field label="Capital Equipment" value={initial.capitalEquipmentInfo} />
                <Field label="Governing body" value={initial.governingBody} />
                <Field label="Multi-department usage" value={initial.multiDepartmentUsage} />
                <Field label="Anticipated monthly usage" value={initial.anticipatedMonthlyUsage} />
                <Field label="Special handling" value={initial.specialHandling} />
                <Field label="Special handling" value={initial.specialHandling} />
                <Field label="Used with other product" value={initial.usedWithOtherProduct} />
                <Field label="Proposed annual cost impact" value={initial.proposedAnnualCostImpact} />
                <Field label="Annual usage new" value={initial.annualUsageNew} />
              </dl>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Operational & Financial Justification</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6">
              <Field label="Purpose" value={initial.purpose} />
              <Field label="Reasons for request" value={initial.reasonsForRequest} />
              <Field label="Used with" value={initial.usedWith} />
              <Field label="Current procedures" value={initial.currentProcedures} />
              <Field label="Procedure(s)" value={initial.procedures} />
              <Field label="Clinical metrics" value={initial.clinicalMetrics} />
              <Field label="Clinical metrics" value={initial.clinicalMetrics} />
              <Field label="Expected ROI" value={initial.expectedRoi} />
              <Field label="Replacing" value={initial.replacingItems} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── SECTION B: MATERIAL MANAGEMENT REVIEW ── */}
      {tab === "material" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Section B — Material Management Review</CardTitle>
              <CardDescription>
                Compare current product with the proposed product. Pre-filled from the submission where possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* CURRENT */}
                <div className="rounded-lg border bg-slate-50/50 p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wide flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Current Product
                  </h3>
                  <EditableField label="Catalog #" name="currentCatNumber" value={form.currentCatNumber} onChange={onChange} placeholder="N/A if new" />
                  <EditableField label="Lawson #" name="currentLawNumber" value={form.currentLawNumber} onChange={onChange} />
                  <EditableField label="Vendor" name="currentVendor" value={form.currentVendor} onChange={onChange} placeholder="N/A if new" />
                  <EditableField label="Contract" name="currentContract" value={form.currentContract} onChange={onChange} />
                  <div className="grid grid-cols-2 gap-3">
                    <EditableField label="Pricing (per UOM)" name="currentPricing" value={form.currentPricing} onChange={onChange} />
                    <EditableField label="UOM" name="currentUom" value={form.currentUom} onChange={onChange} placeholder="ea" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditableField label="Pkg (each per)" name="currentPkg" value={form.currentPkg} onChange={onChange} />
                    <EditableField label="Each Pricing" name="currentEachPricing" value={form.currentEachPricing} onChange={onChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditableField label="Volume" name="currentVolume" value={form.currentVolume} onChange={onChange} />
                    <EditableField label="Total Spend" name="currentTotalSpend" value={form.currentTotalSpend} onChange={onChange} />
                  </div>
                </div>

                {/* PROPOSED */}
                <div className="rounded-lg border border-primary/20 bg-blue-50/30 p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-primary uppercase tracking-wide flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Proposed Product
                  </h3>
                  <EditableField label="Catalog #" name="proposedCatNumber" value={form.proposedCatNumber} onChange={onChange} />
                  <EditableField label="Lawson #" name="proposedLawNumber" value={form.proposedLawNumber} onChange={onChange} />
                  <EditableField label="Vendor" name="proposedVendor" value={form.proposedVendor} onChange={onChange} />
                  <EditableField label="Contract" name="proposedContract" value={form.proposedContract} onChange={onChange} />
                  <div className="grid grid-cols-2 gap-3">
                    <EditableField label="Pricing (per UOM)" name="proposedPricing" value={form.proposedPricing} onChange={onChange} placeholder="e.g. 20700" />
                    <EditableField label="UOM" name="proposedUom" value={form.proposedUom} onChange={onChange} placeholder="ea" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditableField label="Pkg (each per)" name="proposedPkg" value={form.proposedPkg} onChange={onChange} />
                    <EditableField label="Each Pricing" name="proposedEachPricing" value={form.proposedEachPricing} onChange={onChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditableField label="Volume" name="proposedVolume" value={form.proposedVolume} onChange={onChange} />
                    <EditableField label="Total Spend" name="proposedTotalSpend" value={form.proposedTotalSpend} onChange={onChange} />
                  </div>
                </div>
              </div>

              {/* Cost summary strip */}
              <div className="mt-6 grid sm:grid-cols-4 gap-3">
                <EditableField label="Additional Cost(s)" name="additionalCosts" value={form.additionalCosts} onChange={onChange} />
                <EditableField label="Rebates / Incentives" name="rebatesIncentives" value={form.rebatesIncentives} onChange={onChange} />
                <EditableField label="TOTAL COST (Proposed)" name="totalCostProposed" value={form.totalCostProposed} onChange={onChange} />
                <EditableField label="Cost (Savings)" name="costSavings" value={form.costSavings} onChange={onChange} placeholder="+ savings / − increase" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Other Considerations & Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EditableField
                label="Departments using existing product"
                name="deptsUsingExisting"
                value={form.deptsUsingExisting}
                onChange={onChange}
                rows={2}
              />
              <EditableField
                label="Comments"
                name="mmComments"
                value={form.mmComments}
                onChange={onChange}
                rows={3}
                placeholder="e.g. Do not know what the volume will be — recent one came to $20,700 per patient."
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Action Taken</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={form.mmAction}
                    onChange={(e) => onChange("mmAction", e.target.value)}
                  >
                    <option value="">— Select —</option>
                    <option value="Implement for use">Implement for use</option>
                    <option value="Refer to Specialty Team">Refer to Specialty Team</option>
                    <option value="Contact Requestor for more information">Contact Requestor for more information</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
                <EditableField label="Action Date" name="mmActionDate" value={form.mmActionDate} onChange={onChange} type="date" />
              </div>
              {form.mmAction === "Refer to Specialty Team" && (
                <EditableField
                  label="Specialty Teams (comma-separated)"
                  name="mmSpecialtyTeams"
                  value={form.mmSpecialtyTeams}
                  onChange={onChange}
                  placeholder="Imaging, Lab, Surgical Services, Cath Lab…"
                />
              )}
              {form.mmAction === "Declined" && (
                <EditableField
                  label="Decline reason"
                  name="mmDeclineReason"
                  value={form.mmDeclineReason}
                  onChange={onChange}
                  rows={2}
                />
              )}
              <EditableField label="Target Due Date" name="mmTargetDueDate" value={form.mmTargetDueDate} onChange={onChange} type="date" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── SECTION C: VAT REVIEW ── */}
      {tab === "vat" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Section C — Value Analysis Team Review</CardTitle>
              <CardDescription>Committee review of the request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Product / Service" value={initial.productServiceName} />
                <Field label="Vendor" value={initial.vendorManufacturer} />
                <Field label="Catalog #" value={initial.catalogNumber} />
              </div>
              <EditableField
                label="Reason for committee review"
                name="vatReasonForReview"
                value={form.vatReasonForReview}
                onChange={onChange}
              />
              <EditableField
                label="Departments currently using product"
                name="vatDeptsUsing"
                value={form.vatDeptsUsing}
                onChange={onChange}
                rows={2}
              />
              <EditableField
                label="Total cost (savings) of proposed"
                name="vatTotalCostSavings"
                value={form.vatTotalCostSavings}
                onChange={onChange}
              />
              <EditableField
                label="Notes"
                name="vatNotes"
                value={form.vatNotes}
                onChange={onChange}
                rows={3}
              />
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Action(s) Taken</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={form.vatAction}
                    onChange={(e) => onChange("vatAction", e.target.value)}
                  >
                    <option value="">— Select —</option>
                    <option value="Accepted for conversion">Accepted for conversion</option>
                    <option value="Contact requestor for more information">Contact requestor for more information</option>
                    <option value="Evaluation/Trial Scheduled">Evaluation/Trial Scheduled</option>
                    <option value="Education/Inservice Scheduled">Education/Inservice Scheduled</option>
                    <option value="Denied for conversion">Denied for conversion</option>
                  </select>
                </div>
                <EditableField label="Action Date" name="vatActionDate" value={form.vatActionDate} onChange={onChange} type="date" />
              </div>
              {(form.vatAction === "Evaluation/Trial Scheduled" || form.vatAction.includes("Evaluation")) && (
                <EditableField label="Trial Coordinator" name="vatTrialCoordinator" value={form.vatTrialCoordinator} onChange={onChange} />
              )}
              {form.vatAction.includes("Education") && (
                <EditableField label="Education Coordinator" name="vatEducationCoordinator" value={form.vatEducationCoordinator} onChange={onChange} />
              )}
              {form.vatAction === "Denied for conversion" && (
                <EditableField label="Reason(s)" name="vatDenyReason" value={form.vatDenyReason} onChange={onChange} rows={2} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── SECTION D: EVALUATION ── */}
      {tab === "evaluation" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Section D — Evaluation Form</CardTitle>
            <CardDescription>Trial / evaluation results (when applicable)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <EditableField label="Trial Coordinator" name="evalTrialCoordinator" value={form.evalTrialCoordinator} onChange={onChange} />
              <EditableField label="Phone" name="evalPhone" value={form.evalPhone} onChange={onChange} />
            </div>
            <EditableField label="Evaluation notes / results" name="evalNotes" value={form.evalNotes} onChange={onChange} rows={4} />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Action</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={form.evalAction}
                  onChange={(e) => onChange("evalAction", e.target.value)}
                >
                  <option value="">— Select —</option>
                  <option value="Evaluation accepted for conversion">Evaluation accepted for conversion</option>
                  <option value="Evaluation NOT accepted for conversion">Evaluation NOT accepted for conversion</option>
                  <option value="Re-evaluate at a later date">Re-evaluate at a later date</option>
                  <option value="Decision referred to Executive Steering Committee">Decision referred to Executive Steering Committee</option>
                  <option value="Education/Inservice Scheduled">Education/Inservice Scheduled</option>
                </select>
              </div>
              <EditableField label="Action Date" name="evalActionDate" value={form.evalActionDate} onChange={onChange} type="date" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SECTION E: INVENTORY SETUP ── */}
      {tab === "inventory" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Section E — Material Management / Inventory Setup</CardTitle>
            <CardDescription>Post-approval item setup in Lawson / inventory system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Inventory Location</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm max-w-xs"
                value={form.inventoryLocation}
                onChange={(e) => onChange("inventoryLocation", e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Central Supply">Central Supply</option>
                <option value="Print & Postal">Print & Postal</option>
                <option value="Non-Inventory">Non-Inventory</option>
                <option value="Service">Service</option>
              </select>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <EditableField label="Purchase UOM" name="purchaseUom" value={form.purchaseUom} onChange={onChange} />
              <EditableField label="Issue UOM" name="issueUom" value={form.issueUom} onChange={onChange} />
              <EditableField label="Issue Qty/UOM" name="reorderQty" value={form.reorderQty} onChange={onChange} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <EditableField label="Major Class" name="majorClass" value={form.majorClass} onChange={onChange} />
              <EditableField label="Minor Class" name="minorClass" value={form.minorClass} onChange={onChange} />
              <EditableField label="Account / GL Cat" name="accountGlCat" value={form.accountGlCat} onChange={onChange} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <EditableField label="Reorder Point" name="reorderPoint" value={form.reorderPoint} onChange={onChange} />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Replacement Product?</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={form.isReplacementProduct}
                  onChange={(e) => onChange("isReplacementProduct", e.target.value)}
                >
                  <option value="">— Select —</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            {form.isReplacementProduct === "Yes" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Treatment of SOH (Stock on Hand)</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm max-w-xs"
                  value={form.sohTreatment}
                  onChange={(e) => onChange("sohTreatment", e.target.value)}
                >
                  <option value="">— Select —</option>
                  <option value="Phase-out">Phase-out</option>
                  <option value="Return for Credit">Return for Credit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── FILES ── */}
      {tab === "files" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Attached Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {quotes.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Quotes (mandatory)</p>
                <ul className="space-y-1">
                  {quotes.map((f) => (
                    <li key={f.id}>
                      <a
                        href={`/${f.path}`}
                        download={f.originalName}
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {f.originalName}{" "}
                        <span className="text-muted-foreground">
                          ({(f.size / 1024).toFixed(1)} KB)
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {payor.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Payor Mix / Reimbursement</p>
                <ul className="space-y-1">
                  {payor.map((f) => (
                    <li key={f.id}>
                      <a
                        href={`/${f.path}`}
                        download={f.originalName}
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {f.originalName}{" "}
                        <span className="text-muted-foreground">
                          ({(f.size / 1024).toFixed(1)} KB)
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {quotes.length === 0 && payor.length === 0 && (
              <p className="text-sm text-muted-foreground">No files attached.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
