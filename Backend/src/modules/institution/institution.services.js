import client from "../../db.js";
import xss from "xss";
import { generateInstitutionUniqueId } from "../../utils/uniqueIdGenerator.js";

export const createInstitutionProfileService = async (userId, data) => {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "INSTITUTION") {
    throw new Error("Only institutions can create institution profile");
  }

  const existing = await client.institutionProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new Error("Institution profile already exists");
  }

  // Generate unique ID
  const uniqueId = await generateInstitutionUniqueId();

  const profile = await client.institutionProfile.create({
    data: {
      userId,
      uniqueId,
      name: xss(data.name),
      location: xss(data.location),
    },
    select: {
      id: true,
      uniqueId: true,
      name: true,
      location: true,
      createdAt: true,
    },
  });

  return profile;
};

export const getMyInstitutionProfileService = async (userId) => {
  const profile = await client.institutionProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      uniqueId: true,
      name: true,
      location: true,
      createdAt: true,
    },
  });

  if (!profile) {
    throw new Error("Institution profile not found");
  }

  return profile;
};

export const searchInstitutionsService = async (filters = {}) => {
  const { location, page = 1, limit = 12, search, minRating, sort = 'newest' } = filters;
  
  // Convert to numbers to ensure Prisma gets integers
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 12;
  const skip = (pageNum - 1) * limitNum;

  const where = {
    user: {
      role: "INSTITUTION",
      isActive: true,
    },
  };

  // General search - searches across name, uniqueId, location
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      // Search by uniqueId (e.g., INST0001)
      { uniqueId: { contains: searchTerm, mode: "insensitive" } },
      // Search by institution name
      { name: { contains: searchTerm, mode: "insensitive" } },
      // Search by location
      { location: { contains: searchTerm, mode: "insensitive" } },
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

  // Location filter (in addition to general search)
  if (location && location.trim() && !search) {
    where.location = { contains: location, mode: "insensitive" };
  }

  // Minimum rating filter
  if (minRating !== undefined && minRating !== '') {
    where.rating = {
      gte: parseFloat(minRating),
    };
  }

  // Sort options
  const orderByMap = {
    rating_desc: { rating: "desc" },
    newest: { createdAt: "desc" },
  };

  // Optimized: Parallel queries with minimal data selection
  const [institutions, total] = await Promise.all([
    client.institutionProfile.findMany({
      where,
      select: {
        id: true,
        uniqueId: true,
        name: true,
        location: true,
        rating: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            isVerified: true,
            headline: true,
          },
        },
        _count: {
          select: {
            requests: true,
          },
        },
      },
      orderBy: orderByMap[sort] || { createdAt: "desc" },
      skip,
      take: limitNum,
    }),
    client.institutionProfile.count({ where }),
  ]);

  return {
    institutions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};
