import client from "../../db.js";

export const createReviewService = async (user, data) => {
  const { userId, role } = user;
  const { requestId, rating, comment } = data;

  /*  Fetch*/
  const request = await client.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      trainerId: true,
      institutionId: true,
      trainer: {
        select: { userId: true },
      },
      institution: {
        select: { userId: true },
      },
    },
  });

  if (!request) throw new Error("Request not found");

  if (request.status !== "COMPLETED") {
    throw new Error("Review allowed only after completion");
  }

  /*  Verify participation  */

  const isTrainerReviewer =
    role === "TRAINER" && request.trainer.userId === userId;
  const isInstitutionReviewer =
    role === "INSTITUTION" && request.institution.userId === userId;

  if (!isTrainerReviewer && !isInstitutionReviewer) {
    throw new Error("You are not part of this request");
  }

  /*  Prevent duplicate review  */

  const existingReview = await client.review.findUnique({
    where: {
      requestId_reviewerId: {
        requestId,
        reviewerId: userId,
      },
    },
  });

  if (existingReview) {
    throw new Error("You have already reviewed this request");
  }

  /*  Review Target  */

  let reviewData = {
    requestId,
    reviewerId: userId,
    rating,
    comment: comment || null,
  };

  if (isTrainerReviewer) {
    reviewData.institutionProfileId = request.institutionId;
  } else {
    reviewData.trainerProfileId = request.trainerId;
  }

  /* Create Review */

  const review = await client.review.create({
    data: reviewData,
  });

  /*Recalculate Rating  */

  if (reviewData.trainerProfileId) {
    const aggregation = await client.review.aggregate({
      where: { trainerProfileId: reviewData.trainerProfileId },
      _avg: { rating: true },
    });

    await client.trainerProfile.update({
      where: { id: reviewData.trainerProfileId },
      data: { rating: aggregation._avg.rating || 0 },
    });
  }

  if (reviewData.institutionProfileId) {
    const aggregation = await client.review.aggregate({
      where: { institutionProfileId: reviewData.institutionProfileId },
      _avg: { rating: true },
    });

    await client.institutionProfile.update({
      where: { id: reviewData.institutionProfileId },
      data: { rating: aggregation._avg.rating || 0 },
    });
  }

  return review;
};
