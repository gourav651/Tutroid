export const getPublicTrainerProfileService = async (profileId) => {
  const profile = await client.trainerProfile.findFirst({
    where: {
      id: profileId,
      verified: true,
      isActive: true,
    },
    select: {
      id: true,
      bio: true,
      location: true,
      experience: true,
      skills: true,
      rating: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!profile) {
    throw new Error("Trainer not found");
  }

  return profile;
};
