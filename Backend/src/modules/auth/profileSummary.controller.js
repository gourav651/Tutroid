import { getProfileSummaryService } from "./profileSummary.service.js";

/**
 * Get profile summary for authenticated user
 * GET /api/users/me/profile-summary
 */
export const getProfileSummary = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const profileSummary = await getProfileSummaryService(userId);

    res.status(200).json({
      success: true,
      data: profileSummary,
    });
  } catch (error) {
    next(error);
  }
};
