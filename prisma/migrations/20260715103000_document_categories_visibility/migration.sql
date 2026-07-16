-- CreateTable
CREATE TABLE "DocumentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCategory_name_key" ON "DocumentCategory"("name");

-- CreateIndex
CREATE INDEX "DocumentCategory_createdAt_idx" ON "DocumentCategory"("createdAt");

-- AlterTable
ALTER TABLE "Document"
ADD COLUMN "categoryId" TEXT,
ADD COLUMN "isVisibleToParticipant" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Document_categoryId_idx" ON "Document"("categoryId");

-- CreateIndex
CREATE INDEX "Document_isVisibleToParticipant_idx" ON "Document"("isVisibleToParticipant");

-- AddForeignKey
ALTER TABLE "Document"
ADD CONSTRAINT "Document_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "DocumentCategory"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
