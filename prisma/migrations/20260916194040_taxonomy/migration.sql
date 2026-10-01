/*
  Warnings:

  - You are about to drop the `episode_topics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `topics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "episode_topics_topicId_idx";

-- DropIndex
DROP INDEX "topics_slug_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "episode_topics";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "topics";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT,
    "accentColor" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "episode_lenses" (
    "episodeId" TEXT NOT NULL,
    "lensId" TEXT NOT NULL,

    PRIMARY KEY ("episodeId", "lensId"),
    CONSTRAINT "episode_lenses_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "episode_lenses_lensId_fkey" FOREIGN KEY ("lensId") REFERENCES "lenses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "episode_tags" (
    "episodeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("episodeId", "tagId"),
    CONSTRAINT "episode_tags_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "episode_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "seasonNumber" INTEGER,
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
INSERT INTO "new_episodes" ("audioMimeType", "audioSizeBytes", "audioUrl", "coverImage", "createdAt", "description", "durationSeconds", "episodeNumber", "episodeType", "explicit", "featured", "id", "playCount", "publishedAt", "seasonNumber", "seoDescription", "seoTitle", "showId", "showNotes", "slug", "status", "subtitle", "title", "transcript", "updatedAt") SELECT "audioMimeType", "audioSizeBytes", "audioUrl", "coverImage", "createdAt", "description", "durationSeconds", "episodeNumber", "episodeType", "explicit", "featured", "id", "playCount", "publishedAt", "seasonNumber", "seoDescription", "seoTitle", "showId", "showNotes", "slug", "status", "subtitle", "title", "transcript", "updatedAt" FROM "episodes";
DROP TABLE "episodes";
ALTER TABLE "new_episodes" RENAME TO "episodes";
CREATE UNIQUE INDEX "episodes_slug_key" ON "episodes"("slug");
CREATE INDEX "episodes_showId_idx" ON "episodes"("showId");
CREATE INDEX "episodes_categoryId_idx" ON "episodes"("categoryId");
CREATE INDEX "episodes_status_publishedAt_idx" ON "episodes"("status", "publishedAt");
CREATE INDEX "episodes_featured_idx" ON "episodes"("featured");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "lenses_slug_key" ON "lenses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "episode_lenses_lensId_idx" ON "episode_lenses"("lensId");

-- CreateIndex
CREATE INDEX "episode_tags_tagId_idx" ON "episode_tags"("tagId");
