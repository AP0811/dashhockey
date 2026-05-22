-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('participant', 'coach', 'admin');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "groupName" TEXT,
    "participantCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participantId" TEXT NOT NULL,
    "coachId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_groupName_idx" ON "public"."User"("groupName");

-- CreateIndex
CREATE INDEX "Document_participantId_idx" ON "public"."Document"("participantId");

-- CreateIndex
CREATE INDEX "Document_updatedAt_idx" ON "public"."Document"("updatedAt");

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
