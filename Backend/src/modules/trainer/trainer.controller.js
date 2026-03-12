import { searchTrainersService } from "./searchTrainerService.js";
import {
  createTrainerProfileService,
  getMyTrainerProfileService,
  updateTrainerProfileService,
  updateUserProfileService,
  getTrainerReviewsService,
} from "./trainer.services.js";

export const createTrainerProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const profile = await createTrainerProfileService(
      userId,
      req.validated.body,
    );

    return res.status(201).json({
      success: true,
      message: "Trainer profile created successfully",
      data: profile,
      meta: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const profile = await getMyTrainerProfileService(userId);

    return res.status(200).json({
      success: true,
      message: "Trainer profile fetched successfully",
      data: profile,
      meta: null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name, headline, location, bio, experience, skills, avatar, profilePicture, coverImage, firstName, lastName } = req.body;

    // Update user table (name, avatar, coverImage)
    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (name) {
      // Parse name into firstName and lastName
      const nameParts = name.trim().split(" ");
      if (nameParts.length >= 2) {
        userUpdate.firstName = nameParts[0];
        userUpdate.lastName = nameParts.slice(1).join(" ");
      } else {
        userUpdate.firstName = name;
        userUpdate.lastName = "";
      }
    }
    // Handle both avatar and profilePicture (frontend might send either)
    if (avatar !== undefined) userUpdate.avatar = avatar;
    if (profilePicture !== undefined) userUpdate.profilePicture = profilePicture;
    if (coverImage !== undefined) userUpdate.coverImage = coverImage;
    if (headline !== undefined) userUpdate.headline = headline;
    if (location !== undefined) userUpdate.location = location;
    if (bio !== undefined) userUpdate.bio = bio;

    let updatedUser = null;
    if (Object.keys(userUpdate).length > 0) {
      updatedUser = await updateUserProfileService(userId, userUpdate);
    }

    // Update trainer profile (bio, skills, experience)
    // Note: experience is stored as Int (years), skills as String[]
    const profileUpdate = {};
    if (bio !== undefined) profileUpdate.bio = bio;
    if (Array.isArray(skills)) profileUpdate.skills = skills;
    // Only update experience if it's a number (years)
    if (typeof experience === "number") profileUpdate.experience = experience;

    let updatedProfile = null;
    if (Object.keys(profileUpdate).length > 0) {
      updatedProfile = await updateTrainerProfileService(userId, profileUpdate);
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
        profile: updatedProfile,
      },
      meta: null,
    });
  } catch (error) {
    next(error);
  }
};

export const searchTrainers = async (req, res, next) => {
  try {
    const result = await searchTrainersService(req.validated?.query || req.query || {});

    return res.status(200).json({
      success: true,
      message: "Trainers fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};


export const getMyReviews = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const result = await getTrainerReviewsService(userId);

    return res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: result.reviews,
      meta: {
        averageRating: result.averageRating,
        totalReviews: result.totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};
