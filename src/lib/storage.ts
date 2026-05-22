import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEFAULT_SIGNED_URL_TTL_SECONDS = 120;

const CLOUD_FLARE_R2_HOST = ".r2.cloudflarestorage.com";
const CLOUDFLARE_ACCOUNT_ID_RE = /^[a-f0-9]{32}$/i;

function readRequired(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} manquant.`);
  }
  return value;
}

function getR2Endpoint() {
  const explicitEndpoint = process.env.R2_ENDPOINT?.trim();
  if (explicitEndpoint) {
    const url = new URL(explicitEndpoint);
    if (url.protocol !== "https:") {
      throw new Error("R2_ENDPOINT doit utiliser https://.");
    }

    if (url.hostname.endsWith(CLOUD_FLARE_R2_HOST)) {
      const accountId = url.hostname.slice(0, -CLOUD_FLARE_R2_HOST.length);
      if (!CLOUDFLARE_ACCOUNT_ID_RE.test(accountId)) {
        throw new Error(
          "R2_ENDPOINT semble invalide: utilisez le vrai account ID Cloudflare R2 (32 caractères hexadécimaux), pas un nom lisible.",
        );
      }
    }

    return explicitEndpoint;
  }

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  if (accountId && CLOUDFLARE_ACCOUNT_ID_RE.test(accountId)) {
    return `https://${accountId}.r2.cloudflarestorage.com`;
  }

  throw new Error("R2_ENDPOINT ou R2_ACCOUNT_ID manquant ou invalide.");
}

function getS3Client() {
  const endpoint = getR2Endpoint();
  const accessKeyId = readRequired("R2_ACCESS_KEY_ID");
  const secretAccessKey = readRequired("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function uploadPrivateFile(params: {
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  const bucket = readRequired("STORAGE_BUCKET");
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
}

export async function createSignedFileUrl(params: {
  key: string;
  fileName: string;
  disposition: "inline" | "attachment";
}) {
  const bucket = readRequired("STORAGE_BUCKET");
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ResponseContentDisposition: `${params.disposition}; filename="${params.fileName}"`,
  });

  return getSignedUrl(client, command, {
    expiresIn: DEFAULT_SIGNED_URL_TTL_SECONDS,
  });
}

export async function deletePrivateFile(key: string) {
  const bucket = readRequired("STORAGE_BUCKET");
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
