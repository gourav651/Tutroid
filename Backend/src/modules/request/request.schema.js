import { z } from "zod";

export const applyRequestSchema = z.object({
  targetId: z.string().uuid(),
});

export const respondRequestSchema = z.object({
  action: z.enum(["ACCEPTED", "REJECTED"]),
});
