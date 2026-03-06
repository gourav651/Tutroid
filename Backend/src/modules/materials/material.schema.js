import { z } from "zod";

export const uploadMaterialSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title too long"),
});