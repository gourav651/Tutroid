import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    requestId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional().or(z.literal("")),
  }),
});
