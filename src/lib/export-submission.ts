import * as XLSX from "xlsx";

type AnyRec = Record<string, unknown>;

function sheetFromPairs(pairs: [string, unknown][]) {
  const rows = pairs
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([label, value]) => ({ Field: label, Value: String(value) }));
  return XLSX.utils.json_to_sheet(rows.length ? rows : [{ Field: "—", Value: "No data" }]);
}

function shortProductType(productType?: string) {
  if (!productType) return "";
  if (productType.includes("Replacement")) return "Replacement";
  if (productType.includes("New Service")) return "New Service";
  if (productType.includes("New Product")) return "New Product";
  return productType;
}

/** Build and download a multi-sheet workbook for one submission */
export function downloadSubmissionExcel(
  s: AnyRec,
  files: { field: string; originalName: string; path: string; size: number }[] = []
) {
  const wb = XLSX.utils.book_new();

  const requestDetails: [string, unknown][] = [
    ["Product / Service", s.productServiceName],
    ["Type of Request", s.typeOfRequest],
    ["Requested By", s.requestedBy],
    ["Name & Title", s.requestedByNameTitle],
    ["Email", s.requesterEmail],
    ["Phone", s.requesterPhone],
    ["Department", s.requestingDepartment],
    ["Department Number", s.oracleDepartmentNumber],
    ["New provider/service?", s.isNewProviderService],
    ["Vendor / Manufacturer", s.vendorManufacturer],
    ["Catalog #", s.catalogNumber],
    ["Manufacturer Rep", s.manufacturerRep],
    ["Product Type", shortProductType(String(s.productType || ""))],
    ["Classification", s.productClassification],
    ["Minor equipment?", s.isMinorEquipment],
    ["Capital equipment info", s.capitalEquipmentInfo],
    ["Presenter(s)", s.presenters],
    ["Team Lead(s)", s.teamLeads],
    ["Purpose", s.purpose],
    ["Procedure(s)", s.procedures],
    ["Used with", s.usedWith],
    ["Department(s) impacted", s.departmentsImpacted],
    ["Provider(s)", s.providersImpacted],
    ["Reasons for request", s.reasonsForRequest],
    ["Current procedures", s.currentProcedures],
    ["Clinical metrics", s.clinicalMetrics],
    ["Governing body", s.governingBody],
    ["Multi-department usage", s.multiDepartmentUsage],
    ["Anticipated monthly usage", s.anticipatedMonthlyUsage],
    ["Special handling", s.specialHandling],
    ["Used with other product", s.usedWithOtherProduct],
    ["Monthly cost impact", s.costImpact],
    ["Monthly cost amount / range", s.proposedAnnualCostImpact],
    ["Monthly usage — old", s.annualUsageOld],
    ["Monthly usage — new", s.annualUsageNew],
    ["Replacing", s.replacingItems],
    ["Expected ROI", s.expectedRoi],
    ["Status", s.status],
    ["Recommendation", s.recommendation],
    ["Recommendation notes", s.recommendationNotes],
    ["Submitted", s.createdAt ? new Date(String(s.createdAt)).toLocaleDateString() : ""],
  ];

  const material: [string, unknown][] = [
    ["Current Cat #", s.currentCatNumber],
    ["Current Law #", s.currentLawNumber],
    ["Current Vendor", s.currentVendor],
    ["Current Contract", s.currentContract],
    ["Current Pricing", s.currentPricing],
    ["Current UOM", s.currentUom],
    ["Current Pkg", s.currentPkg],
    ["Current Each Pricing", s.currentEachPricing],
    ["Current Volume", s.currentVolume],
    ["Current Total Spend", s.currentTotalSpend],
    ["Proposed Cat #", s.proposedCatNumber],
    ["Proposed Law #", s.proposedLawNumber],
    ["Proposed Vendor", s.proposedVendor],
    ["Proposed Contract", s.proposedContract],
    ["Proposed Pricing", s.proposedPricing],
    ["Proposed UOM", s.proposedUom],
    ["Proposed Pkg", s.proposedPkg],
    ["Proposed Each Pricing", s.proposedEachPricing],
    ["Proposed Volume", s.proposedVolume],
    ["Proposed Total Spend", s.proposedTotalSpend],
    ["Additional costs", s.additionalCosts],
    ["Rebates / incentives", s.rebatesIncentives],
    ["Total cost proposed", s.totalCostProposed],
    ["Cost savings", s.costSavings],
    ["Depts using existing", s.deptsUsingExisting],
    ["MM comments", s.mmComments],
    ["MM action", s.mmAction],
    ["MM action date", s.mmActionDate],
    ["MM specialty teams", s.mmSpecialtyTeams],
    ["MM target due date", s.mmTargetDueDate],
    ["MM decline reason", s.mmDeclineReason],
  ];

  const vat: [string, unknown][] = [
    ["Reason for review", s.vatReasonForReview],
    ["Depts using", s.vatDeptsUsing],
    ["Total cost savings", s.vatTotalCostSavings],
    ["Action", s.vatAction],
    ["Action date", s.vatActionDate],
    ["Trial coordinator", s.vatTrialCoordinator],
    ["Education coordinator", s.vatEducationCoordinator],
    ["Deny reason", s.vatDenyReason],
    ["Notes", s.vatNotes],
  ];

  const evaluation: [string, unknown][] = [
    ["Trial coordinator", s.evalTrialCoordinator],
    ["Phone", s.evalPhone],
    ["Notes", s.evalNotes],
    ["Action", s.evalAction],
    ["Action date", s.evalActionDate],
  ];

  const inventory: [string, unknown][] = [
    ["Inventory location", s.inventoryLocation],
    ["Purchase UOM", s.purchaseUom],
    ["Issue UOM", s.issueUom],
    ["Major class", s.majorClass],
    ["Minor class", s.minorClass],
    ["Account / GL cat", s.accountGlCat],
    ["Reorder point", s.reorderPoint],
    ["Reorder qty", s.reorderQty],
    ["Replacement product?", s.isReplacementProduct],
    ["SOH treatment", s.sohTreatment],
  ];

  const fileRows =
    files.length > 0
      ? files.map((f) => ({
          Field: f.field,
          Value: f.originalName,
          Path: f.path,
          Size: f.size,
        }))
      : [{ Field: "—", Value: "No files", Path: "", Size: "" }];

  XLSX.utils.book_append_sheet(wb, sheetFromPairs(requestDetails), "Request Details");
  XLSX.utils.book_append_sheet(wb, sheetFromPairs(material), "Material Review");
  XLSX.utils.book_append_sheet(wb, sheetFromPairs(vat), "VAT Review");
  XLSX.utils.book_append_sheet(wb, sheetFromPairs(evaluation), "Evaluation");
  XLSX.utils.book_append_sheet(wb, sheetFromPairs(inventory), "Inventory Setup");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fileRows), "Files");

  const safeName = String(s.productServiceName || "submission")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 40);
  XLSX.writeFile(wb, `VAT_${safeName}.xlsx`);
}
