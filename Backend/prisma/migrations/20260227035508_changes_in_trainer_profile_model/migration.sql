/*
  Warnings:

  - You are about to drop the column `name` on the `TrainerProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TrainerProfile_skills_idx";

-- AlterTable
ALTER TABLE "TrainerProfile" DROP COLUMN "name",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT;

-- CreateIndex
CREATE INDEX "TrainerProfile_location_idx" ON "TrainerProfile"("location");

-- CreateIndex
CREATE INDEX "TrainerProfile_experience_idx" ON "TrainerProfile"("experience");
