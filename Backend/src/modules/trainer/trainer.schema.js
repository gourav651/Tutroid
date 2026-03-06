import { z } from "zod";

export const createTrainerProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name too long"),

    bio: z
      .string()
      .trim()
      .max(500, "Bio too long")
      .optional()
      .or(z.literal("")),

    experience: z
      .number({
        required_error: "Experience is required",
        invalid_type_error: "Experience must be a number",
      })
      .int()
      .min(0)
      .max(50),

    skills: z
      .array(z.string().trim().min(1).max(50))
      .min(1, "At least one skill required")
      .max(20, "Too many skills"),
  }),
});
export const trainerSearchSchema = z.object({
  skill: z.string().trim().min(1).max(50).optional(),
  location: z.string().trim().min(1).max(100).optional(),
  minExp: z.coerce.number().int().min(0).max(50).optional(),
  maxExp: z.coerce.number().int().min(0).max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z
    .enum(["experience_asc", "experience_desc", "newest"])
    .default("newest"),
});
