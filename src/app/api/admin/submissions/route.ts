import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Only allow known fields through
    const allowed = [
      "status", "archived",
      "requestNumber", "assignedEmployee", "dateReceived",
      // Section B
      "currentCatNumber", "currentLawNumber", "currentVendor", "currentContract",
      "currentPricing", "currentUom", "currentPkg", "currentEachPricing",
      "currentVolume", "currentTotalSpend",
      "proposedCatNumber", "proposedLawNumber", "proposedVendor", "proposedContract",
      "proposedPricing", "proposedUom", "proposedPkg", "proposedEachPricing",
      "proposedVolume", "proposedTotalSpend",
      "additionalCosts", "rebatesIncentives", "totalCostProposed", "costSavings",
      "deptsUsingExisting", "mmComments",
      "mmAction", "mmActionDate", "mmSpecialtyTeams", "mmTargetDueDate", "mmDeclineReason",
      // Section C
      "vatReasonForReview", "vatDeptsUsing", "vatTotalCostSavings",
      "vatAction", "vatActionDate", "vatTrialCoordinator", "vatEducationCoordinator",
      "vatDenyReason", "vatNotes",
      // Section D
      "evalTrialCoordinator", "evalPhone", "evalNotes", "evalAction", "evalActionDate",
      // Section E
      "inventoryLocation", "purchaseUom", "issueUom", "majorClass", "minorClass",
      "accountGlCat", "reorderPoint", "reorderQty", "isReplacementProduct", "sohTreatment",
    ];

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in rest) {
        // Convert empty strings to null for optional fields
        const val = rest[key];
        data[key] = val === "" ? null : val;
      }
    }

    const updated = await prisma.submission.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
