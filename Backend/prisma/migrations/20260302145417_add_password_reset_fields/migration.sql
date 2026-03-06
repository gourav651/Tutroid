-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordOTP" TEXT,
ADD COLUMN     "resetPasswordOTPExpires" TIMESTAMP(3);
