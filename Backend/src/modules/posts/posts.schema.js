import { z } from "zod";

// ================= CREATE =================
export const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  type: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ================= UPDATE =================
export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Content must not exceed 2000 characters")
    .optional(),

  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

// ================= GET POSTS (QUERY) =================
export const getPostsSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  sortBy: z.enum(["createdAt", "rating", "likes"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  authorId: z.string().uuid().optional(),
  type: z.enum(["text", "image", "video", "article"]).optional(),
});
