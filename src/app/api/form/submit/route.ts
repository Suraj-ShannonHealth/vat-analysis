import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fullFormSchema } from "@/lib/validations/form";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const dataStr = formData.get("data") as string;
    if (!dataStr) {
      return NextResponse.json({ error: "Missing form data" }, { status: 400 });
    }

    const raw = JSON.parse(dataStr);
    const parsed = fullFormSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Create submission first
    const submission = await prisma.submission.create({
      data: {
        typeOfRequest: data.typeOfRequest,
        requestedBy: data.requestedBy,
        requestedByNameTitle: data.requestedByNameTitle,
        requesterEmail: data.requesterEmail,
        requesterPhone: data.requesterPhone,
        requestingDepartment: data.requestingDepartment,
        isNewProviderService: data.isNewProviderService,
        productServiceName: data.productServiceName,
        vendorManufacturer: data.vendorManufacturer,
        catalogNumber: data.catalogNumber,
        manufacturerRep: data.manufacturerRep,
        productType: data.productType,
        productClassification: data.productClassification,
        isMinorEquipment: data.isMinorEquipment,
        capitalEquipmentInfo: data.capitalEquipmentInfo || null,
        purposeOfRequest: data.purposeOfRequest,
        reasonForRequest: data.reasonForRequest,
        concernsWithExisting: data.concernsWithExisting || null,
        currentProcedures: data.currentProcedures,
        clinicalOutcome: data.clinicalOutcome,
        measureEffectiveness: data.measureEffectiveness,
        clinicalMetrics: data.clinicalMetrics,
        governingBody: data.governingBody || null,
        multiDepartmentUsage: data.multiDepartmentUsage || null,
        anticipatedMonthlyUsage: data.anticipatedMonthlyUsage,
        specialHandling: data.specialHandling || null,
        trainingRequired: data.trainingRequired || null,
        usedWithOtherProduct: data.usedWithOtherProduct || null,
        patientChargeable: data.patientChargeable,
        revenueHcpcsCode: data.revenueHcpcsCode || null,
        expectedRoi: data.expectedRoi,
        costJustification: data.costJustification,
      },
    });

    const uploadDir = path.join(process.cwd(), "public", "files", submission.id);
    await mkdir(uploadDir, { recursive: true });

    const quoteFiles = formData.getAll("quote") as File[];
    const payorFiles = formData.getAll("payorMix") as File[];

    if (quoteFiles.length === 0) {
      // cleanup and reject
      await prisma.submission.delete({ where: { id: submission.id } });
      return NextResponse.json(
        { error: "At least one quote file is required" },
        { status: 400 }
      );
    }

    const saveFiles = async (files: File[], field: string) => {
      for (const file of files) {
        if (!file || typeof file === "string") continue;
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const filePath = path.join(uploadDir, safeName);
        await writeFile(filePath, buffer);

        await prisma.file.create({
          data: {
            submissionId: submission.id,
            field,
            originalName: file.name,
            path: path.join("files", submission.id, safeName),
            mimeType: file.type || "application/octet-stream",
            size: file.size,
          },
        });
      }
    };

    await saveFiles(quoteFiles, "quote");
    await saveFiles(payorFiles, "payorMix");

    return NextResponse.json({ success: true, id: submission.id });
  } catch (err: any) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
