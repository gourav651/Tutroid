-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "institutionMarkedComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trainerMarkedComplete" BOOLEAN NOT NULL DEFAULT false;
