import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { promises as fs } from "fs";
import path from "path";

const R2_ENDPOINT_RAW = process.env.R2_ENDPOINT || "";
const R2_BUCKET_RAW = process.env.R2_BUCKET || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";

// Normalize: strip bucket path if user pasted full URL https://xxx.r2.cloudflarestorage.com/sadi-pro-doc
const R2_ENDPOINT = (() => {
  let ep = (R2_ENDPOINT_RAW || "").trim().replace(/\/+$/, "");
  if (R2_BUCKET_RAW && ep.endsWith(`/${R2_BUCKET_RAW}`)) ep = ep.slice(0, -(R2_BUCKET_RAW.length + 1));
  // Also strip generic bucket suffix for the default bucket sadi-pro-doc if raw contained it
  if (!R2_BUCKET_RAW && ep.endsWith("/sadi-pro-doc")) ep = ep.slice(0, -"/sadi-pro-doc".length);
  return ep;
})();
const R2_BUCKET = R2_BUCKET_RAW || "";

export const isR2Configured = Boolean(R2_ENDPOINT && R2_BUCKET && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

if (!isR2Configured) {
  console.warn("[R2] NOT configured — uploads will use ephemeral local filesystem and will NOT appear in Cloudflare bucket. Set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY on Render.");
} else {
  console.log(`[R2] Configured — endpoint=${R2_ENDPOINT} bucket=${R2_BUCKET}`);
}

const R2 = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

const BUCKET = R2_BUCKET;

// Fallback local storage root
const LOCAL_ROOT = path.join(process.cwd(), "uploads");

async function ensureLocalDir(key: string) {
  const full = path.join(LOCAL_ROOT, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  return full;
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  if (isR2Configured && R2 && BUCKET) {
    await R2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return;
  }
  // Fallback: local filesystem
  const full = await ensureLocalDir(key);
  await fs.writeFile(full, body);
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  if (isR2Configured && R2 && BUCKET) {
    try {
      const res = await R2.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: key })
      );
      const stream = res.Body;
      if (!stream) throw new Error("Empty R2 response");
      return Buffer.from(await stream.transformToByteArray());
    } catch (e) {
      // Fallback to local if R2 fails and file exists locally
      try {
        const full = path.join(LOCAL_ROOT, key);
        return await fs.readFile(full);
      } catch {
        throw e;
      }
    }
  }
  const full = path.join(LOCAL_ROOT, key);
  return await fs.readFile(full);
}

export async function deleteFromR2(key: string): Promise<void> {
  if (isR2Configured && R2 && BUCKET) {
    try {
      await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch {}
  }
  try {
    const full = path.join(LOCAL_ROOT, key);
    await fs.unlink(full);
  } catch {}
}

export async function headR2(key: string): Promise<{ size: number; contentType: string } | null> {
  if (isR2Configured && R2 && BUCKET) {
    try {
      const res = await R2.send(
        new HeadObjectCommand({ Bucket: BUCKET, Key: key })
      );
      return {
        size: res.ContentLength ?? 0,
        contentType: res.ContentType ?? "application/octet-stream",
      };
    } catch {}
  }
  try {
    const full = path.join(LOCAL_ROOT, key);
    const stat = await fs.stat(full);
    return { size: stat.size, contentType: "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  if (isR2Configured && R2 && BUCKET) {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return getSignedUrl(R2, cmd, { expiresIn });
  }
  // Fallback: return local preview URL (relative)
  return `/api/data/download/${encodeURIComponent(key)}`;
}
