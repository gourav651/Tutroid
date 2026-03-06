-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Create index
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_email_idx" ON "User"("email");

-- Make username unique (after populating existing users)
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
