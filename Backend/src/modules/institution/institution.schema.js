import z from "zod";

export const createInstitutionProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(4).max(50),
    location: z.string().trim().min(2).max(100),
  }),
});
