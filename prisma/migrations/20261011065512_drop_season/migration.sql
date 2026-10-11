/*
  Warnings:

  - You are about to drop the column `seasonNumber` on the `episodes` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_episodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL,
    "showNotes" TEXT,
    "transcript" TEXT,
    "episodeNumber" INTEGER,
    "episodeType" TEXT NOT NULL DEFAULT 'full',
    "audioUrl" TEXT NOT NULL,
    "audioSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "audioMimeType" TEXT NOT NULL DEFAULT 'audio/mpeg',
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT,
    CONSTRAINT "episodes_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "episodes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_episodes" ("audioMimeType", "audioSizeBytes", "audioUrl", "categoryId", "coverImage", "createdAt", "description", "durationSeconds", "episodeNumber", "episodeType", "explicit", "featured", "id", "playCount", "publishedAt", "seoDescription", "seoTitle", "showId", "showNotes", "slug", "status", "subtitle", "title", "transcript", "updatedAt") SELECT "audioMimeType", "audioSizeBytes", "audioUrl", "categoryId", "coverImage", "createdAt", "description", "durationSeconds", "episodeNumber", "episodeType", "explicit", "featured", "id", "playCount", "publishedAt", "seoDescription", "seoTitle", "showId", "showNotes", "slug", "status", "subtitle", "title", "transcript", "updatedAt" FROM "episodes";
DROP TABLE "episodes";
ALTER TABLE "new_episodes" RENAME TO "episodes";
CREATE UNIQUE INDEX "episodes_slug_key" ON "episodes"("slug");
CREATE INDEX "episodes_showId_idx" ON "episodes"("showId");
CREATE INDEX "episodes_categoryId_idx" ON "episodes"("categoryId");
CREATE INDEX "episodes_status_publishedAt_idx" ON "episodes"("status", "publishedAt");
CREATE INDEX "episodes_featured_idx" ON "episodes"("featured");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
