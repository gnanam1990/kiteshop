import { fileURLToPath } from "node:url";
import { basename, dirname, resolve, join } from "node:path";
import { promises as fs } from "node:fs";
import crypto from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = process.env.KITESHOP_UPLOADS ?? resolve(here, "../../uploads");

await fs.mkdir(UPLOADS_DIR, { recursive: true });

export interface StoredFile {
  key: string;
  size: number;
}

export async function storeUpload(buf: Buffer, originalName: string): Promise<StoredFile> {
  const ext = originalName.includes(".") ? originalName.slice(originalName.lastIndexOf(".")) : "";
  const key = crypto.randomBytes(16).toString("hex") + ext;
  await fs.writeFile(join(UPLOADS_DIR, key), buf);
  return { key, size: buf.byteLength };
}

export function pathForKey(key: string): string {
  if (!key || key !== basename(key) || key.includes("/") || key.includes("\\")) {
    throw new Error("invalid file key");
  }
  const path = resolve(UPLOADS_DIR, key);
  const root = resolve(UPLOADS_DIR);
  if (path !== root && !path.startsWith(`${root}/`)) {
    throw new Error("invalid file key");
  }
  return path;
}
