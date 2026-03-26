import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RankingService {
  static async searchTrainers(criteria = {}) {
    try {
      const {
        location,
        skills,
        minRating = 0,
        maxRating = 5,
        minExperience = 0,
        verified = false,
        page = 1,
        limit = 20
      } = criteria;

      const skip = (page - 1) * limit;

      const where = {
        isActive: true,
        deletedAt: null,
        reputationScore: {
          gte: minRating,
          lte: maxRating
        },
        experience: {
          gte: minExperience
        }
      };

      if (location) {
        where.location = {
          contains: location,
          mode: 'insensitive'
        };
      }

      if (skills) {
        const skillArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
        where.skills = {
          hasSome: skillArray
        };
      }

      if (verified) {
        where.verified = true;
      }

      const trainers = await prisma.trainerProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true
            }
          },
          badges: {
            select: {
              id: true,
              name: true,
              icon: true,
              criteria: true
            }
          },
          _count: {
            select: {
              requests: {
                where: { status: 'COMPLETED' }
              },
              materials: true,
              reviews: true,
              materialRatings: true
            }
          }
        },
        orderBy: [
          { reputationScore: 'desc' },
          { completedRequests: 'desc' },
          { completionRate: 'desc' },
          { responseTime: 'asc' },
          { experience: 'desc' }
        ],
        skip,
        take: limit
      });

      const totalCount = await prisma.trainerProfile.count({ where });

      return {
        trainers,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Error searching trainers:', error);
      throw error;
    }
  }

  static async getTrainerRanking(trainerId) {
    try {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { id: trainerId },
        include: {
          badges: true,
          _count: {
            select: {
              requests: {
                where: { status: 'COMPLETED' }
              },
              materials: true,
              reviews: true,
              materialRatings: true
            }
          }
        }
      });

      if (!trainer) {
        throw new Error('Trainer not found');
      }

      const rank = await prisma.trainerProfile.count({
        where: {
          isActive: true,
          deletedAt: null,
          reputationScore: {
            gt: trainer.reputationScore
          }
        }
      }) + 1;

      const totalTrainers = await prisma.trainerProfile.count({
        where: {
          isActive: true,
          deletedAt: null
        }
      });

      const percentile = ((totalTrainers - rank + 1) / totalTrainers) * 100;

      return {
        trainer: {
          ...trainer,
          rank,
          percentile: Math.round(percentile),
          totalTrainers
        }
      };
    } catch (error) {
      console.error('Error getting trainer ranking:', error);
      throw error;
    }
  }

  static async getTopTrainers(limit = 10) {
    try {
      const trainers = await prisma.trainerProfile.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          reputationScore: {
            gte: 4.0
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          },
          badges: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          },
          _count: {
            select: {
              requests: {
                where: { status: 'COMPLETED' }
              },
              materials: true,
              reviews: true,
              materialRatings: true
            }
          }
        },
        orderBy: [
          { reputationScore: 'desc' },
          { completedRequests: 'desc' },
          { completionRate: 'desc' }
        ],
        take: limit
      });

      return trainers;
    } catch (error) {
      console.error('Error getting top trainers:', error);
      throw error;
    }
  }

  static async getTrainersBySkill(skill, limit = 10) {
    try {
      const trainers = await prisma.trainerProfile.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          skills: {
            has: skill
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          },
          badges: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          },
          _count: {
            select: {
              requests: {
                where: { status: 'COMPLETED' }
              },
              materials: true,
              reviews: true,
              materialRatings: true
            }
          }
        },
        orderBy: [
          { reputationScore: 'desc' },
          { completedRequests: 'desc' }
        ],
        take: limit
      });

      return trainers;
    } catch (error) {
      console.error('Error getting trainers by skill:', error);
      throw error;
    }
  }

  static async getTrainersByLocation(location, limit = 10) {
    try {
      const trainers = await prisma.trainerProfile.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          location: {
            contains: location,
            mode: 'insensitive'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          },
          badges: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          },
          _count: {
            select: {
              requests: {
                where: { status: 'COMPLETED' }
              },
              materials: true,
              reviews: true,
              materialRatings: true
            }
          }
        },
        orderBy: [
          { reputationScore: 'desc' },
          { completedRequests: 'desc' }
        ],
        take: limit
      });

      return trainers;
    } catch (error) {
      console.error('Error getting trainers by location:', error);
      throw error;
    }
  }

  static async getPopularSkills(limit = 20) {
    try {
      const skills = await prisma.trainerProfile.groupBy({
        by: ['skills'],
        where: {
          isActive: true,
          deletedAt: null
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: limit
      });

      const skillCounts = {};
      skills.forEach(item => {
        item.skills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + item._count.id;
        });
      });

      return Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([skill, count]) => ({ skill, count }));
    } catch (error) {
      console.error('Error getting popular skills:', error);
      throw error;
    }
  }

  static async getPopularLocations(limit = 20) {
    try {
      const locations = await prisma.trainerProfile.groupBy({
        by: ['location'],
        where: {
          isActive: true,
          deletedAt: null,
          location: {
            not: null
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: limit
      });

      return locations.map(item => ({
        location: item.location,
        count: item._count.id
      }));
    } catch (error) {
      console.error('Error getting popular locations:', error);
      throw error;
    }
  }
}
