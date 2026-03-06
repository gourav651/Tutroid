import { createReviewService } from "./review.services.js";

export const createReview = async (req, res, next) => {
  try {
    const review = await createReviewService(req.user, req.validated.body);

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
      meta: null,
    });
  } catch (error) {
    next(error);
  }
};
