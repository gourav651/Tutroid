import prisma from "../db.js";

/**
 * Generate a unique ID for trainer profiles
 * Format: TRN0001, TRN0002, etc.
 */
export const generateTrainerUniqueId = async () => {
  const lastTrainer = await prisma.trainerProfile.findFirst({
    where: { uniqueId: { startsWith: "TRN" } },
    orderBy: { uniqueId: "desc" },
    select: { uniqueId: true }
  });

  if (!lastTrainer) {
    return "TRN0001";
  }

  const lastNumber = parseInt(lastTrainer.uniqueId.substring(3));
  const nextNumber = lastNumber + 1;
  return `TRN${nextNumber.toString().padStart(4, "0")}`;
};

/**
 * Generate a unique ID for institution profiles
 * Format: INST0001, INST0002, etc.
 */
export const generateInstitutionUniqueId = async () => {
  const lastInstitution = await prisma.institutionProfile.findFirst({
    where: { uniqueId: { startsWith: "INST" } },
    orderBy: { uniqueId: "desc" },
    select: { uniqueId: true }
  });

  if (!lastInstitution) {
    return "INST0001";
  }

  const lastNumber = parseInt(lastInstitution.uniqueId.substring(4));
  const nextNumber = lastNumber + 1;
  return `INST${nextNumber.toString().padStart(4, "0")}`;
};
