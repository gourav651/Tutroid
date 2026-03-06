import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReputationService {
  static async calculateReputationScore(trainerId) {
    try {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { id: trainerId },
        include: {
          reviews: {
            include: {
              reviewer: {
                select: { role: true }
              }
            }
          },
          materialRatings: true,
          _count: {
            select: {
              requests: {
                where: { status: 'COMPLETED' }
              }
            }
          }
        }
      });

      if (!trainer) {
        throw new Error('Trainer not found');
      }

      // Calculate institution rating (60% weight)
      const institutionReviews = trainer.reviews.filter(r => r.reviewer.role === 'INSTITUTION');
      const institutionRating = institutionReviews.length > 0
        ? institutionReviews.reduce((acc, r) => acc + r.rating, 0) / institutionReviews.length
        : 0;

      // Calculate material rating (40% weight)
      const materialRating = trainer.materialRatings.length > 0
        ? trainer.materialRatings.reduce((acc, r) => acc + r.rating, 0) / trainer.materialRatings.length
        : 0;

      // Apply reputation formula
      const rawScore = (0.6 * institutionRating) + (0.4 * materialRating);

      // Apply Bayesian weighting to prevent manipulation
      const totalReviews = institutionReviews.length + trainer.materialRatings.length;
      const bayesianScore = this.applyBayesianWeighting(rawScore, totalReviews);

      // Update trainer's reputation score
      await prisma.trainerProfile.update({
        where: { id: trainerId },
        data: { 
          reputationScore: bayesianScore,
          completedRequests: trainer._count.requests
        }
      });

      // Update completion rate
      await this.updateCompletionRate(trainerId);

      // Check for new badges
      await this.checkAndAwardBadges(trainerId, bayesianScore, trainer._count.requests);

      return bayesianScore;
    } catch (error) {
      console.error('Error calculating reputation score:', error);
      throw error;
    }
  }

  static applyBayesianWeighting(rawScore, totalReviews) {
    // Bayesian average with minimum reviews threshold
    const MIN_REVIEWS = 3;
    const AVERAGE_RATING = 3.5; // Global average rating
    
    if (totalReviews >= MIN_REVIEWS) {
      return rawScore;
    }
    
    // Apply Bayesian smoothing for new trainers
    const weight = totalReviews / (totalReviews + MIN_REVIEWS);
    return (weight * rawScore) + ((1 - weight) * AVERAGE_RATING);
  }

  static async updateCompletionRate(trainerId) {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      include: {
        _count: {
          select: {
            requests: {
              where: { status: 'COMPLETED' }
            }
          }
        },
        requests: {
          select: { status: true }
        }
      }
    });

    if (!trainer.requests.length) {
      return;
    }

    const completedRequests = trainer._count.requests;
    const totalRequests = trainer.requests.length;
    const completionRate = (completedRequests / totalRequests) * 100;

    await prisma.trainerProfile.update({
      where: { id: trainerId },
      data: { completionRate }
    });
  }

  static async checkAndAwardBadges(trainerId, reputationScore, completedRequests) {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      select: {
        responseTime: true,
        badges: {
          select: { name: true }
        }
      }
    });

    const existingBadgeNames = trainer.badges.map(b => b.name);
    const newBadges = [];

    // Top Rated Badge
    if (reputationScore >= 4.5 && !existingBadgeNames.includes('Top Rated')) {
      newBadges.push({
        name: 'Top Rated',
        icon: '⭐',
        criteria: 'reputation >= 4.5'
      });
    }

    // Rising Trainer Badge
    if (reputationScore >= 4.0 && completedRequests >= 5 && !existingBadgeNames.includes('Rising Trainer')) {
      newBadges.push({
        name: 'Rising Trainer',
        icon: '🚀',
        criteria: 'reputation >= 4.0 and 5+ requests'
      });
    }

    // Fast Responder Badge
    if (trainer.responseTime <= 24 && !existingBadgeNames.includes('Fast Responder')) {
      newBadges.push({
        name: 'Fast Responder',
        icon: '⚡',
        criteria: 'response time <= 24h'
      });
    }

    // 10+ Successful Contracts Badge
    if (completedRequests >= 10 && !existingBadgeNames.includes('10+ Successful Contracts')) {
      newBadges.push({
        name: '10+ Successful Contracts',
        icon: '🏆',
        criteria: '10+ completed requests'
      });
    }

    // Award new badges
    for (const badge of newBadges) {
      await prisma.badge.create({
        data: {
          ...badge,
          trainerId
        }
      });
    }
  }

  static async updateResponseTime(trainerId, responseHours) {
    await prisma.trainerProfile.update({
      where: { id: trainerId },
      data: { responseTime: responseHours }
    });
  }
}
