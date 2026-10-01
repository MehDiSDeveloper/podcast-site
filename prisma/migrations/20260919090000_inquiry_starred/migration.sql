-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "inquiries_starred_createdAt_idx" ON "inquiries"("starred", "createdAt");
