-- AlterTable
ALTER TABLE "episodes" ADD COLUMN "coverVideo" TEXT;

-- AlterTable
ALTER TABLE "shows" ADD COLUMN "coverVideo" TEXT;

-- The show's description and cover are now edited in the admin instead of
-- being synced from site config. Drop the old config copy (tagline and
-- description) and the generated artwork path, which is now the fallback.
UPDATE "shows" SET "subtitle" = NULL, "description" = 'پادکست درشان' WHERE "isDefault" = true;
UPDATE "shows" SET "coverImage" = NULL WHERE "coverImage" = '/podcast-artwork.png';
