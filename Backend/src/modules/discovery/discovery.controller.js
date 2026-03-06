import prisma from "../../db.js";

export const advancedSearch = async (req, res, next) => {
    try {
        const {
            role,
            skill,
            location,
            minRating,
            minExperience,
            maxExperience,
            verified,
            page = 1,
            limit = 20,
            sort = "rating_desc",
            search // General search term for name, headline, bio
        } = req.query;

        const currentUserRole = req.user.role;

        // Role-based filtering with flexibility:
        // - role="TRAINER" - search trainers
        // - role="INSTITUTION" - search institutions  
        // - role="ALL" or no role - search based on current user's role (opposite by default)
        let targetRole = role;
        
        // If role is explicitly "ALL", don't filter by role
        if (role === "ALL") {
            targetRole = null; // Search both trainers and institutions
        } else if (!targetRole) {
            // Default behavior: show opposite role
            if (currentUserRole === "TRAINER") {
                targetRole = "INSTITUTION"; // Trainers see institutions by default
            } else if (currentUserRole === "INSTITUTION") {
                targetRole = "TRAINER"; // Institutions see trainers by default
            }
            // Students see both (no targetRole set)
        }

        // Sorting
        const sortMap = {
            rating_desc: { rating: "desc" },
            rating_asc: { rating: "asc" },
            experience_desc: { experience: "desc" },
            experience_asc: { experience: "asc" },
            newest: { createdAt: "desc" }
        };

        const orderBy = sortMap[sort] || sortMap.rating_desc;

        // Query based on target role
        let results = [];
        let total = 0;

        if (targetRole === "TRAINER" || (!targetRole && currentUserRole !== "TRAINER" && currentUserRole !== "INSTITUTION")) {
            // Search trainers (or both if no targetRole for students)
            // Build the where clause properly - profile filters AND user filters
            const combinedWhere = {
                isActive: true,
                user: {
                    isActive: true,
                    isBanned: false,
                    id: { not: req.user.id }
                }
            };

            // Add role filter if specified
            if (targetRole) {
                combinedWhere.user.role = targetRole;
            }

            // Add profile-specific filters (rating, experience, skills, verified)
            if (minRating) {
                combinedWhere.rating = { gte: parseFloat(minRating) };
            }
            if (minExperience !== undefined || maxExperience !== undefined) {
                combinedWhere.experience = {
                    ...(minExperience && { gte: parseInt(minExperience) }),
                    ...(maxExperience && { lte: parseInt(maxExperience) })
                };
            }
            if (skill && skill.trim()) {
                combinedWhere.skills = { has: skill.trim() };
            }
            if (verified === "true") {
                combinedWhere.verified = true;
            }

            // Add search term - use OR at the top level to search across both user and profile
            if (search && search.trim()) {
                const searchTerm = search.trim();
                const searchConditions = [];

                // User fields
                searchConditions.push(
                    { user: { firstName: { contains: searchTerm, mode: "insensitive" } } },
                    { user: { lastName: { contains: searchTerm, mode: "insensitive" } } },
                    { user: { headline: { contains: searchTerm, mode: "insensitive" } } },
                    { user: { bio: { contains: searchTerm, mode: "insensitive" } } },
                    { user: { location: { contains: searchTerm, mode: "insensitive" } } }
                );

                // Profile fields
                searchConditions.push(
                    { uniqueId: { contains: searchTerm, mode: "insensitive" } },
                    { bio: { contains: searchTerm, mode: "insensitive" } },
                    { location: { contains: searchTerm, mode: "insensitive" } },
                    { skills: { has: searchTerm } }
                );

                combinedWhere.OR = searchConditions;
            }

            // Add location filter if specified (and not already in search)
            if (location && location.trim() && (!search || !search.trim())) {
                combinedWhere.user.location = {
                    contains: location.trim(),
                    mode: "insensitive"
                };
            }

            const [trainers, trainerCount] = await Promise.all([
                    prisma.trainerProfile.findMany({
                        where: combinedWhere,
                        select: {
                            id: true,
                            uniqueId: true,
                            bio: true,
                            location: true,
                            experience: true,
                            skills: true,
                            rating: true,
                            verified: true,
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    profilePicture: true,
                                    bio: true,
                                    headline: true,
                                    location: true,
                                    role: true,
                                    isVerified: true
                                }
                            }
                        },
                        orderBy,
                        skip: (parseInt(page) - 1) * parseInt(limit),
                        take: parseInt(limit)
                    }),
                prisma.trainerProfile.count({ where: combinedWhere })
            ]);

            results = trainers
                .filter(t => t.user && t.user.firstName) // Filter out users with missing data
                .map(t => ({
                    ...t.user,
                    profile: {
                        id: t.id,
                        uniqueId: t.uniqueId,
                        bio: t.bio,
                        location: t.location,
                        experience: t.experience,
                        skills: t.skills,
                        rating: t.rating,
                        verified: t.verified
                    }
                }));
            total = trainerCount;
        } else if (targetRole === "INSTITUTION") {
            // Build the where clause for institutions
            const combinedWhere = {
                isActive: true,
                user: {
                    isActive: true,
                    isBanned: false,
                    id: { not: req.user.id }
                }
            };

            // Add role filter
            if (targetRole) {
                combinedWhere.user.role = targetRole;
            }

            // Add rating filter
            if (minRating) {
                combinedWhere.rating = { gte: parseFloat(minRating) };
            }

            // Add search term - use OR at the top level
            if (search && search.trim()) {
                const searchTerm = search.trim();
                const searchConditions = [];

                // User fields
                searchConditions.push(
                    { user: { firstName: { contains: searchTerm, mode: "insensitive" } } },
                    { user: { lastName: { contains: searchTerm, mode: "insensitive" } } },
                    { user: { headline: { contains: searchTerm, mode: "insensitive" } } },
                    { user: { bio: { contains: searchTerm, mode: "insensitive" } } },
                    { user: { location: { contains: searchTerm, mode: "insensitive" } } }
                );

                // Profile fields
                searchConditions.push(
                    { uniqueId: { contains: searchTerm, mode: "insensitive" } },
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { location: { contains: searchTerm, mode: "insensitive" } }
                );

                combinedWhere.OR = searchConditions;
            }

            // Add location filter if specified (and not already in search)
            if (location && location.trim() && (!search || !search.trim())) {
                combinedWhere.user.location = {
                    contains: location.trim(),
                    mode: "insensitive"
                };
            }

            const [institutions, institutionCount] = await Promise.all([
                    prisma.institutionProfile.findMany({
                        where: combinedWhere,
                        select: {
                            id: true,
                            uniqueId: true,
                            name: true,
                            location: true,
                            rating: true,
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    profilePicture: true,
                                    bio: true,
                                    headline: true,
                                    location: true,
                                    role: true,
                                    isVerified: true
                                }
                            }
                        },
                        orderBy: { rating: orderBy.rating || "desc" },
                        skip: (parseInt(page) - 1) * parseInt(limit),
                        take: parseInt(limit)
                    }),
                prisma.institutionProfile.count({ where: combinedWhere })
            ]);

            results = institutions
                .filter(i => i.user && i.user.firstName) // Filter out users with missing data
                .map(i => ({
                    ...i.user,
                    profile: {
                        id: i.id,
                        uniqueId: i.uniqueId,
                        name: i.name,
                        location: i.location,
                        rating: i.rating
                    }
                }));
            total = institutionCount;
        }

        res.json({
            success: true,
            data: results,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getAvailableSkills = async (req, res, next) => {
    try {
        const trainers = await prisma.trainerProfile.findMany({
            where: { isActive: true },
            select: { skills: true }
        });

        const allSkills = trainers.flatMap(t => t.skills);
        const uniqueSkills = [...new Set(allSkills)].sort();

        res.json({ success: true, data: uniqueSkills });
    } catch (error) {
        next(error);
    }
};
