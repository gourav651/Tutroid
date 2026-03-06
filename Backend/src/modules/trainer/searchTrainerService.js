import client from "../../db.js";

export const searchTrainersService = async (filters = {}) => {
  const { skill, location, minExp, maxExp, page = 1, limit = 10, sort = 'newest' } = filters;

  // Convert to numbers to ensure Prisma gets integers
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  const where = {
    isActive: true,
  };

  if (skill) {
    where.skills = { has: skill };
  }

  if (location) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  if (minExp !== undefined || maxExp !== undefined) {
    where.experience = {
      gte: minExp ?? undefined,
      lte: maxExp ?? undefined,
    };
  }

  const orderByMap = {
    experience_asc: { experience: "asc" },
    experience_desc: { experience: "desc" },
    newest: { createdAt: "desc" },
    rating: { rating: "desc" },
  };

  const [trainers, total] = await Promise.all([
    client.trainerProfile.findMany({
      where,
      orderBy: orderByMap[sort] || { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            role: true,
            isVerified: true,
          },
        },
      },
    }),
    client.trainerProfile.count({ where }),
  ]);

  return {
    data: trainers,
    meta: {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};
