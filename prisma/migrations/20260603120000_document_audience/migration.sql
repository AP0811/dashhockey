-- CreateEnum
CREATE TYPE "public"."DocumentAudience" AS ENUM ('participant', 'coach');

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN "audience" "public"."DocumentAudience" NOT NULL DEFAULT 'participant';
ALTER TABLE "public"."Document" ALTER COLUMN "participantId" DROP NOT NULL;
ALTER TABLE "public"."Document" ALTER COLUMN "participantId" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Document_audience_idx" ON "public"."Document"("audience");
