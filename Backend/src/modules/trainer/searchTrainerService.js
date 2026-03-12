import client from "../../db.js";

export const searchTrainersService = async (filters = {}) => {
  const { skill, location, minExp, maxExp, page = 1, limit = 10, sort = 'newest', search, minRating, verified } = filters;

  // Convert to numbers to ensure Prisma gets integers
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  const where = {
    isActive: true,
  };

  // General search - searches across name, uniqueId, skills, location
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      // Search by uniqueId (e.g., TRN0001)
      { uniqueId: { contains: searchTerm, mode: "insensitive" } },
      // Search by skills
      { skills: { has: searchTerm } },
      { skills: { hasSome: searchTerm.split(/[\s,]+/).filter(Boolean) } },
      // Search by location
      { location: { contains: searchTerm, mode: "insensitive" } },
      // Search by bio
      { bio: { contains: searchTerm, mode: "insensitive" } },
      // Search by user name
      {
        user: {
          OR: [
            { firstName: { contains: searchTerm, mode: "insensitive" } },
            { lastName: { contains: searchTerm, mode: "insensitive" } },
            { username: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  // Specific skill filter (only apply if not using general search)
  if (skill && skill.trim() && !search) {
    where.skills = { has: skill };
  }

  // Location filter (only apply if not using general search)
  if (location && location.trim() && !search) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  // Experience range filter
  if (minExp !== undefined || maxExp !== undefined) {
    where.experience = {};
    if (minExp !== undefined && minExp !== '') {
      where.experience.gte = parseInt(minExp);
    }
    if (maxExp !== undefined && maxExp !== '') {
      where.experience.lte = parseInt(maxExp);
    }
    // Remove empty experience filter
    if (Object.keys(where.experience).length === 0) {
      delete where.experience;
    }
  }

  // Minimum rating filter
  if (minRating !== undefined && minRating !== '') {
    where.rating = {
      gte: parseFloat(minRating),
    };
  }

  // Verified filter
  if (verified === true || verified === 'true') {
    where.verified = true;
  }

  const orderByMap = {
    experience_asc: { experience: "asc" },
    experience_desc: { experience: "desc" },
    newest: { createdAt: "desc" },
    rating: { rating: "desc" },
    rating_desc: { rating: "desc" },
  };

  console.log('Trainer search where clause:', JSON.stringify(where, null, 2));

  // Optimized: Parallel queries with minimal data selection
  const [trainers, total] = await Promise.all([
    client.trainerProfile.findMany({
      where,
      orderBy: orderByMap[sort] || { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      select: {
        id: true,
        uniqueId: true,
        bio: true,
        location: true,
        experience: true,
        skills: true,
        rating: true,
        verified: true,
        completedRequests: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            isVerified: true,
            headline: true,
          },
        },
      },
    }),
    client.trainerProfile.count({ where }),
  ]);

  console.log('Trainer search results:', trainers.length);

  return {
    data: trainers,
    meta: {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};
