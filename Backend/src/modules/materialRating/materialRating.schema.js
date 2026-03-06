import { z } from "zod";

export const createMaterialRatingSchema = z.object({
  materialId: z.string().uuid("Invalid material ID"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().optional()
});

export const updateMaterialRatingSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().optional()
});

export const getMaterialRatingsSchema = z.object({
  materialId: z.string().uuid("Invalid material ID"),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
});
