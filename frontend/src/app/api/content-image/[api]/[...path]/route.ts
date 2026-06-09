import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const CONTENT_ROOT = process.env.CONTENT_PATH ?? path.join(process.cwd(), "..", "content");

export async function GET(
  _req: NextRequest,
  { params }: { params: { api: string; path: string[] } }
) {
  const imagePath = path.join(
    CONTENT_ROOT,
    "apis",
    params.api,
    "images",
    ...params.path
  );

  // Prevent path traversal
  const resolved = path.resolve(imagePath);
  const base = path.resolve(path.join(CONTENT_ROOT, "apis", params.api, "images"));
  if (!resolved.startsWith(base)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(resolved)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };

  const mimeType = mimeTypes[ext] ?? "application/octet-stream";
  const buffer = fs.readFileSync(resolved);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
