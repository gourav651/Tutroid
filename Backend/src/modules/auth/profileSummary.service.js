import client from "../../db.js";
import { AppError } from "../../utils/AppError.js";

/**
 * Get comprehensive profile summary for the authenticated user
 * Includes user data, current education, current experience, and role-specific profile
 */
export const getProfileSummaryService = async (userId) => {
  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      profilePicture: true,
      coverImage: true,
      bio: true,
      headline: true,
      location: true,
      role: true,
      isVerified: true,
      createdAt: true,
      trainerProfile: {
        select: {
          skills: true,
          experience: true,
          verified: true,
          bio: true,
          location: true,
          rating: true,
        },
      },
      studentProfile: {
        select: {
          bio: true,
          location: true,
        },
      },
      institutionProfile: {
        select: {
          name: true,
          location: true,
          rating: true,
        },
      },
      education: {
        orderBy: {
          startDate: "desc",
        },
        take: 1,
        select: {
          school: true,
          degree: true,
          fieldOfStudy: true,
          startDate: true,
          endDate: true,
        },
      },
      experience: {
        where: {
          isCurrent: true,
        },
        orderBy: {
          startDate: "desc",
        },
        take: 1,
        select: {
          title: true,
          company: true,
          location: true,
          startDate: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Build response with current education and experience
  const currentEducation = user.education?.[0] || null;
  const currentExperience = user.experience?.[0] || null;

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      coverImage: user.coverImage,
      bio: user.bio,
      headline: user.headline,
      location: user.location,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    currentEducation,
    currentExperience,
    trainerProfile: user.trainerProfile,
    studentProfile: user.studentProfile,
    institutionProfile: user.institutionProfile,
  };
};
