import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await R2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  const res = await R2.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );
  const stream = res.Body;
  if (!stream) throw new Error("Empty R2 response");
  return Buffer.from(await stream.transformToByteArray());
}

export async function deleteFromR2(key: string): Promise<void> {
  await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function headR2(key: string): Promise<{ size: number; contentType: string } | null> {
  try {
    const res = await R2.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key })
    );
    return {
      size: res.ContentLength ?? 0,
      contentType: res.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(R2, cmd, { expiresIn });
}
