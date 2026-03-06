import {
  createPostService,
  getPostsService,
  getPostByIdService,
  updatePostService,
  deletePostService,
  reviewPostService,
  updateReviewService,
  deleteReviewService,
  getPostReviewsService,
  getMyPostsService,
} from "./posts.service.js";

// Create Post
export const createPost = async (req, res) => {
  try {
    const postData = {
      content: req.body.content,
      type: req.body.type || "text",
      authorId: req.user.userId,
      imageUrl: req.body.imageUrl || null,
      videoUrl: req.body.videoUrl || null,
      tags: req.body.tags || [],
    };

    const post = await createPostService(postData);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.error("Create post error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create post",
    });
  }
};

// Get Posts
export const getPosts = async (req, res) => {
  try {
    const result = await getPostsService(req.query);

    res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get posts error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve posts",
    });
  }
};

// Get My Posts
export const getMyPosts = async (req, res) => {
  try {
    const filters = { ...req.query };
    const result = await getMyPostsService(req.user.userId, filters);

    res.status(200).json({
      success: true,
      message: "My posts retrieved successfully",
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get my posts error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve my posts",
    });
  }
};

// Get By ID
export const getPostById = async (req, res) => {
  try {
    const post = await getPostByIdService(req.params.postId);

    res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      data: post,
    });
  } catch (error) {
    console.error("Get post by ID error:", error);

    if (error.message === "Post not found") {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve post",
    });
  }
};

// Update
export const updatePost = async (req, res) => {
  try {
    const updatedPost = await updatePostService(
      req.params.postId,
      req.body,
      req.user.userId,
    );

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    console.error("Update post error:", error);

    if (error.message === "Post not found") {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (error.message === "Not authorized to update this post") {
      return res.status(403).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update post",
    });
  }
};

// Delete
export const deletePost = async (req, res) => {
  try {
    await deletePostService(req.params.postId, req.user.userId);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    if (error.message === "Post not found") {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (error.message === "Not authorized to delete this post") {
      return res.status(403).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete post",
    });
  }
};

// Review Post (Create or Update)
export const reviewPost = async (req, res) => {
  try {
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const result = await reviewPostService(
      req.params.postId,
      req.user.userId,
      rating,
      review
    );

    res.status(200).json({
      success: true,
      message: "Post reviewed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Review post error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Review
export const updateReview = async (req, res) => {
  try {
    const { rating, review } = req.body;
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const result = await updateReviewService(
      req.params.reviewId,
      req.user.userId,
      rating,
      review
    );

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update review error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Review
export const deleteReview = async (req, res) => {
  try {
    await deleteReviewService(req.params.reviewId, req.user.userId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Post Reviews
export const getPostReviews = async (req, res) => {
  try {
    const reviews = await getPostReviewsService(req.params.postId);

    res.status(200).json({
      success: true,
      message: "Reviews retrieved successfully",
      data: reviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve reviews",
    });
  }
};
