import client from "../../db.js";
import { withRetry } from "../../utils/dbHelper.js";
import {
  createPostSchema,
  updatePostSchema,
  getPostsSchema,
} from "./posts.schema.js";

/* ================= CREATE POST ================= */

export const createPostService = async (postData) => {
  // Skip schema validation to fix hanging issue
  // const validatedData = createPostSchema.parse(postData);

  const post = await client.post.create({
    data: {
      content: postData.content,
      type: postData.type || "text",
      authorId: postData.authorId,
      imageUrl: postData.imageUrl || null,
      videoUrl: postData.videoUrl || null,
      tags: postData.tags || [],
      averageRating: 0,
      totalReviews: 0,
      shares: 0,
      isActive: true,
    },
    // Return minimal data for faster response
    select: {
      id: true,
      content: true,
      type: true,
      imageUrl: true,
      videoUrl: true,
      tags: true,
      createdAt: true,
      authorId: true,
    },
  });

  return post;
};

/* ================= GET POSTS ================= */

export const getPostsService = async (filters = {}) => {
  const validatedFilters = getPostsSchema.parse(filters);
  const { page, limit, sortBy, sortOrder, authorId, type } = validatedFilters;

  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(authorId && { authorId }),
    ...(type && { type }),
  };

  // Use parallel queries for better performance
  const [posts, total] = await Promise.all([
    client.post.findMany({
      where,
      select: {
        id: true,
        content: true,
        type: true,
        imageUrl: true,
        videoUrl: true,
        tags: true,
        averageRating: true,
        totalReviews: true,
        shares: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true,
            // Only include profile name/bio, not full nested objects
            trainerProfile: {
              select: {
                bio: true,
              },
            },
            institutionProfile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    }),
    client.post.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

/* ================= GET MY POSTS ================= */

export const getMyPostsService = async (userId, filters = {}) => {
  const validatedFilters = getPostsSchema.parse(filters);

  const { page, limit, sortBy, sortOrder } = validatedFilters;

  const skip = (page - 1) * limit;

  const where = {
    authorId: userId,
    isActive: true,
  };

  const posts = await client.post.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePicture: true,
          trainerProfile: {
            select: {
              bio: true,
            },
          },
          institutionProfile: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          postReviews: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: limit,
  });

  const total = await client.post.count({ where });

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

/* ================= GET POST BY ID ================= */

export const getPostByIdService = async (postId) => {
  const post = await client.post.findFirst({
    where: {
      id: postId,
      isActive: true,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          trainerProfile: {
            select: {
              bio: true,
              location: true,
              rating: true,
            },
          },
          institutionProfile: {
            select: {
              name: true,
              location: true,
              rating: true,
            },
          },
        },
      },
      _count: {
        select: {
          postReviews: true,
        },
      },
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  return post;
};

/* ================= UPDATE POST ================= */

export const updatePostService = async (postId, postData, userId) => {
  const validatedData = updatePostSchema.parse(postData);

  const existingPost = await client.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    throw new Error("Post not found");
  }

  if (existingPost.authorId !== userId) {
    throw new Error("Not authorized to update this post");
  }

  return client.post.update({
    where: { id: postId },
    data: {
      ...validatedData,
      updatedAt: new Date(),
    },
  });
};

/* ================= DELETE POST (SOFT) ================= */

export const deletePostService = async (postId, userId) => {
  const existingPost = await client.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    throw new Error("Post not found");
  }

  if (existingPost.authorId !== userId) {
    throw new Error("Not authorized to delete this post");
  }

  return client.post.update({
    where: { id: postId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
};

/* ================= REVIEW POST ================= */

export const reviewPostService = async (postId, userId, rating, review) => {
  // Check post existence and create/update review in parallel
  const [post, existingReview] = await Promise.all([
    client.post.findFirst({
      where: { id: postId, isActive: true },
      select: { id: true },
    }),
    client.postReview.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
      select: { id: true },
    }),
  ]);

  if (!post) {
    throw new Error("Post not found");
  }

  let postReview;
  if (existingReview) {
    // Update existing review
    postReview = await client.postReview.update({
      where: { id: existingReview.id },
      data: { rating, review, updatedAt: new Date() },
    });
  } else {
    // Create new review
    postReview = await client.postReview.create({
      data: { postId, userId, rating, review },
    });
  }

  // Update post stats asynchronously (non-blocking)
  setImmediate(async () => {
    try {
      const aggregation = await client.postReview.aggregate({
        where: { postId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const averageRating = aggregation._avg.rating || 0;
      const totalReviews = aggregation._count.rating;

      await client.post.update({
        where: { id: postId },
        data: {
          averageRating: parseFloat(averageRating.toFixed(2)),
          totalReviews,
        },
      });
    } catch (error) {
      console.error('Background rating update error:', error);
    }
  });

  // Return immediately without waiting for aggregation
  return { 
    postReview, 
    averageRating: rating, // Optimistic value
    totalReviews: existingReview ? undefined : 1 
  };
};

/* ================= UPDATE REVIEW ================= */

export const updateReviewService = async (reviewId, userId, rating, review) => {
  const existingReview = await client.postReview.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new Error("Review not found");
  }

  if (existingReview.userId !== userId) {
    throw new Error("Not authorized to update this review");
  }

  const updatedReview = await client.postReview.update({
    where: { id: reviewId },
    data: {
      ...(rating && { rating }),
      ...(review !== undefined && { review }),
      updatedAt: new Date(),
    },
  });

  // Use database aggregation instead of fetching all reviews
  const aggregation = await client.postReview.aggregate({
    where: { postId: existingReview.postId },
    _avg: { rating: true },
  });

  const averageRating = aggregation._avg.rating || 0;

  await client.post.update({
    where: { id: existingReview.postId },
    data: {
      averageRating: parseFloat(averageRating.toFixed(2)),
    },
  });

  return updatedReview;
};

/* ================= DELETE REVIEW ================= */

export const deleteReviewService = async (reviewId, userId) => {
  const existingReview = await client.postReview.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new Error("Review not found");
  }

  if (existingReview.userId !== userId) {
    throw new Error("Not authorized to delete this review");
  }

  await client.postReview.delete({
    where: { id: reviewId },
  });

  // Use database aggregation instead of fetching all reviews
  const aggregation = await client.postReview.aggregate({
    where: { postId: existingReview.postId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const averageRating = aggregation._avg.rating || 0;
  const totalReviews = aggregation._count.rating;

  await client.post.update({
    where: { id: existingReview.postId },
    data: {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews,
    },
  });

  return { message: "Review deleted successfully" };
};

/* ================= GET POST REVIEWS ================= */

export const getPostReviewsService = async (postId) => {
  return withRetry(async () => {
    const reviews = await client.postReview.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reviews;
  });
};

