-- Add uniqueId to TrainerProfile and InstitutionProfile
ALTER TABLE "TrainerProfile" ADD COLUMN IF NOT EXISTS "uniqueId" TEXT;
ALTER TABLE "InstitutionProfile" ADD COLUMN IF NOT EXISTS "uniqueId" TEXT;

-- Generate unique IDs for existing records only if they don't have one
-- For trainers: TRN + sequential number
WITH numbered_trainers AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "TrainerProfile"
  WHERE "uniqueId" IS NULL
)
UPDATE "TrainerProfile" t
SET "uniqueId" = 'TRN' || LPAD(nt.rn::TEXT, 4, '0')
FROM numbered_trainers nt
WHERE t.id = nt.id;

-- For institutions: INST + sequential number
WITH numbered_institutions AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "InstitutionProfile"
  WHERE "uniqueId" IS NULL
)
UPDATE "InstitutionProfile" i
SET "uniqueId" = 'INST' || LPAD(ni.rn::TEXT, 4, '0')
FROM numbered_institutions ni
WHERE i.id = ni.id;

-- Create unique indexes if they don't exist
CREATE UNIQUE INDEX IF NOT EXISTS "TrainerProfile_uniqueId_key" ON "TrainerProfile"("uniqueId");
CREATE UNIQUE INDEX IF NOT EXISTS "InstitutionProfile_uniqueId_key" ON "InstitutionProfile"("uniqueId");

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS "TrainerProfile_uniqueId_idx" ON "TrainerProfile"("uniqueId");
CREATE INDEX IF NOT EXISTS "InstitutionProfile_uniqueId_idx" ON "InstitutionProfile"("uniqueId");
