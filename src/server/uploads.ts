import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, "..", "..", "uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

function mime(filename: string): string {
  return MIME[filename.split(".").pop()?.toLowerCase() || "png"] || "application/octet-stream";
}

function sanitize(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "");
}

export async function putUpload(filename: string, data: ArrayBuffer | Uint8Array, contentType: string): Promise<string> {
  writeFileSync(join(UPLOADS_DIR, filename), Buffer.from(data as ArrayBuffer));
  return `/api/uploads/${filename}`;
}

export async function getUpload(filename: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const safe = sanitize(filename);
  const filePath = join(UPLOADS_DIR, safe);
  if (!existsSync(filePath)) return null;
  const buf = readFileSync(filePath);
  return {
    data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    contentType: mime(safe),
  };
}

export async function deleteUpload(filename: string): Promise<void> {
  const safe = sanitize(filename);
  const filePath = join(UPLOADS_DIR, safe);
  if (existsSync(filePath)) unlinkSync(filePath);
}

export async function readUploadAsBase64DataUrl(filename: string): Promise<string | null> {
  const safe = sanitize(filename);
  const filePath = join(UPLOADS_DIR, safe);
  if (!existsSync(filePath)) return null;
  const buf = readFileSync(filePath);
  const contentType = mime(safe);
  return `data:${contentType};base64,${buf.toString("base64")}`;
}
