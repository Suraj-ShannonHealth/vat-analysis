import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const ALLOWED_EXT = new Set([".pdf", ".docx", ".xlsx", ".doc", ".xls"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
  "application/octet-stream",
]);
const MAX_BYTES = 25 * 1024 * 1024; // 25MB

export async function POST(req: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const submissionId = String(formData.get("submissionId") || "").trim();
    const documentName = String(formData.get("documentName") || "").trim();
    const file = formData.get("file");

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submission id" }, { status: 400 });
    }
    if (!documentName) {
      return NextResponse.json({ error: "Document name is required" }, { status: 400 });
    }
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const upload = file as File;
    if (upload.size <= 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    if (upload.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be 25MB or smaller" }, { status: 400 });
    }

    const originalExt = path.extname(upload.name || "").toLowerCase();
    if (!ALLOWED_EXT.has(originalExt)) {
      return NextResponse.json(
        { error: "Only PDF, Word (.doc/.docx), and Excel (.xls/.xlsx) files are allowed" },
        { status: 400 }
      );
    }

    if (upload.type && !ALLOWED_MIME.has(upload.type)) {
      // still allow if extension is valid (some browsers send odd mime)
      if (!ALLOWED_EXT.has(originalExt)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
      }
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true },
    });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Display name: admin label + ensure extension for clarity
    let displayName = documentName;
    if (!path.extname(displayName)) {
      displayName = `${displayName}${originalExt}`;
    }

    const uploadDir = path.join(process.cwd(), "public", "files", submissionId);
    await mkdir(uploadDir, { recursive: true });

    const safeName = `${randomUUID()}-${upload.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);
    const buffer = Buffer.from(await upload.arrayBuffer());
    await writeFile(filePath, buffer);

    const record = await prisma.file.create({
      data: {
        submissionId,
        field: "additional",
        originalName: displayName,
        path: ["files", submissionId, safeName].join("/"),
        mimeType: upload.type || "application/octet-stream",
        size: upload.size,
      },
    });

    return NextResponse.json({ success: true, file: record });
  } catch (err: unknown) {
    console.error("Admin file upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
