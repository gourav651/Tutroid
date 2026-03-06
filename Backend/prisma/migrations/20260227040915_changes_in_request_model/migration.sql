/*
  Warnings:

  - Added the required column `initiatedBy` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestInitiator" AS ENUM ('TRAINER', 'INSTITUTION');

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "initiatedBy" "RequestInitiator" NOT NULL;

-- CreateIndex
CREATE INDEX "Request_trainerId_idx" ON "Request"("trainerId");

-- CreateIndex
CREATE INDEX "Request_institutionId_idx" ON "Request"("institutionId");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");
