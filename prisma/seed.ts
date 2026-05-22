import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function readEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

async function upsertUser(params: {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: Role;
  groupName?: string;
  participantCode?: string;
}) {
  const passwordHash = await bcrypt.hash(params.password, 12);

  return prisma.user.upsert({
    where: { email: params.email.toLowerCase() },
    update: {
      email: params.email.toLowerCase(),
      fullName: params.fullName,
      username: params.username.toLowerCase(),
      role: params.role,
      groupName: params.groupName,
      participantCode: params.participantCode,
      passwordHash,
    },
    create: {
      username: params.username.toLowerCase(),
      email: params.email.toLowerCase(),
      fullName: params.fullName,
      role: params.role,
      groupName: params.groupName,
      participantCode: params.participantCode,
      passwordHash,
    },
  });
}

async function main() {
  const adminCredentials = {
    username: readEnv("SEED_ADMIN_USERNAME", "admin"),
    email: readEnv("SEED_ADMIN_EMAIL", `${readEnv("SEED_ADMIN_USERNAME", "admin")}@apphockeygars.local`),
    password: readEnv("SEED_ADMIN_PASSWORD", "ChangeMe_Admin_2026!"),
  };

  const coachCredentials = {
    username: readEnv("SEED_COACH_USERNAME", "coach"),
    email: readEnv("SEED_COACH_EMAIL", `${readEnv("SEED_COACH_USERNAME", "coach")}@apphockeygars.local`),
    password: readEnv("SEED_COACH_PASSWORD", "ChangeMe_Coach_2026!"),
  };

  const admin = await upsertUser({
    username: adminCredentials.username,
    email: adminCredentials.email,
    fullName: "Administration",
    password: adminCredentials.password,
    role: Role.admin,
  });

  const coach = await upsertUser({
    username: coachCredentials.username,
    email: coachCredentials.email,
    fullName: "Coach Martin",
    password: coachCredentials.password,
    role: Role.coach,
    groupName: "Groupe A",
  });

  const participant = await upsertUser({
    username: "alex.tremblay",
    email: "alex.tremblay@apphockeygars.local",
    fullName: "Alex Tremblay",
    password: "ChangeMe_Participant_2026!",
    role: Role.participant,
    groupName: "Groupe A",
    participantCode: "P-1001",
  });

  await prisma.document.upsert({
    where: { id: "demo-doc-1" },
    update: {
      title: "Document de démarrage",
      description: "Exemple de métadonnées pour vérifier les flux réels.",
      fileName: "demarrage.pdf",
      storageKey: "documents/demarrage.pdf",
      participantId: participant.id,
      coachId: coach.id,
    },
    create: {
      id: "demo-doc-1",
      title: "Document de démarrage",
      description: "Exemple de métadonnées pour vérifier les flux réels.",
      fileName: "demarrage.pdf",
      storageKey: "documents/demarrage.pdf",
      participantId: participant.id,
      coachId: coach.id,
    },
  });

  console.log("Seed complete", {
    admin: admin.username,
    coach: coach.username,
    participant: participant.username,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
