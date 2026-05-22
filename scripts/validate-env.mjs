import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = fs.existsSync(path.join(root, ".env.local"))
  ? path.join(root, ".env.local")
  : path.join(root, ".env");

if (!fs.existsSync(envPath)) {
  console.error("Aucun fichier .env.local ou .env trouvé.");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf-8");
const pairs = Object.fromEntries(
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim().replace(/^"|"$/g, "");
      return [key, value];
    }),
);

const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "SESSION_MAX_AGE_SECONDS",
  "STORAGE_PROVIDER",
  "STORAGE_BUCKET",
];

const cloudflareAccountIdRegex = /^[a-f0-9]{32}$/i;

const missing = required.filter((key) => !pairs[key]);

if (missing.length) {
  console.error("Variables manquantes:", missing.join(", "));
  process.exit(1);
}

if (!pairs.DATABASE_URL.startsWith("postgresql://")) {
  console.error("DATABASE_URL doit commencer par postgresql://");
  process.exit(1);
}

if (!pairs.DATABASE_URL.includes("sslmode=require")) {
  console.warn("Attention: DATABASE_URL devrait inclure sslmode=require pour Neon.");
}

if (pairs.STORAGE_PROVIDER === "r2") {
  const endpoint = pairs.R2_ENDPOINT;
  const accountId = pairs.R2_ACCOUNT_ID;
  const hasValidEndpoint =
    endpoint &&
    endpoint.startsWith("https://") &&
    (!endpoint.includes(".r2.cloudflarestorage.com") ||
      cloudflareAccountIdRegex.test(endpoint.split(".")[0].replace("https://", "")));

  if (!hasValidEndpoint && !cloudflareAccountIdRegex.test(accountId ?? "")) {
    console.error(
      "R2 invalide: R2_ENDPOINT doit pointer vers un vrai account ID Cloudflare R2 ou R2_ACCOUNT_ID doit contenir un ID hexadécimal de 32 caractères.",
    );
    process.exit(1);
  }
}

console.log("Variables d'environnement valides.");
