import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envLocalPath = path.join(root, ".env.local");
const envPath = path.join(root, ".env");

if (!fs.existsSync(envLocalPath)) {
  console.log(".env.local absent, aucune synchro Prisma.");
  process.exit(0);
}

const content = fs.readFileSync(envLocalPath, "utf8");
fs.writeFileSync(envPath, content, "utf8");

console.log(".env synchronisé depuis .env.local pour Prisma CLI.");
