import { z } from "zod";

export const createReportSchema = z.object({
  targetId: z.string().uuid("Invalid target ID"),
  targetType: z.enum(["TRAINER", "MATERIAL", "REVIEW"], {
    errorMap: () => ({ message: "Target type must be TRAINER, MATERIAL, or REVIEW" })
  }),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must not exceed 500 characters"),
  details: z.string().max(1000, "Details must not exceed 1000 characters").optional()
});

export const updateReportSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"], {
    errorMap: () => ({ message: "Status must be RESOLVED or DISMISSED" })
  }),
  resolutionNote: z.string().max(1000, "Resolution note must not exceed 1000 characters").optional()
});

export const getReportsSchema = z.object({
  status: z.enum(["PENDING", "RESOLVED", "DISMISSED"]).optional(),
  targetType: z.enum(["TRAINER", "MATERIAL", "REVIEW"]).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});
