import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

export const runtime = "nodejs";

/**
 * Authenticated file download for admin.
 * GET /api/admin/files/:id
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing file id" }, { status: 400 });
  }

  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "File record not found" }, { status: 404 });
  }

  // Stored path is relative under public/, e.g. files/<submissionId>/<name>
  const relative = file.path.replace(/^[/\\]+/, "").replace(/\\/g, "/");
  const absolute = path.join(process.cwd(), "public", relative);

  if (!existsSync(absolute)) {
    console.error("[files] Missing on disk:", absolute, "db path:", file.path);
    return NextResponse.json(
      {
        error: "File missing on server disk",
        path: relative,
      },
      { status: 404 }
    );
  }

  const info = await stat(absolute);
  const stream = createReadStream(absolute);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

  // ASCII fallback + UTF-8 filename for names with spaces
  const asciiName = file.originalName
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/"/g, "");
  const utf8Name = encodeURIComponent(file.originalName).replace(/['()]/g, escape);

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Length": String(info.size),
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
      "Cache-Control": "private, no-store",
    },
  });
}
