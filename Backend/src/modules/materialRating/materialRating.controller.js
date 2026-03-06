import { PrismaClient } from '@prisma/client';
import { ReputationService } from '../../services/reputation.service.js';

const prisma = new PrismaClient();

export const createMaterialRating = async (req, res) => {
  try {
    const { materialId, rating, comment } = req.body;
    const studentId = req.user.id;

    // Verify user is a student
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true }
    });

    if (!user || user.role !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: "Only students can rate materials"
      });
    }

    // Check if material exists and is active
    const material = await prisma.material.findUnique({
      where: { 
        id: materialId,
        isActive: true,
        deletedAt: null
      },
      include: {
        trainer: {
          select: { id: true }
        }
      }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }

    // Check if student has already rated this material
    const existingRating = await prisma.materialRating.findUnique({
      where: {
        materialId_studentId: {
          materialId,
          studentId
        }
      }
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: "You have already rated this material"
      });
    }

    // Create the rating
    const materialRating = await prisma.materialRating.create({
      data: {
        materialId,
        studentId,
        rating,
        comment
      },
      include: {
        material: {
          select: {
            id: true,
            title: true,
            trainer: {
              select: {
                id: true,
                user: {
                  select: {
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Update trainer's reputation score
    await ReputationService.calculateReputationScore(material.trainerId);

    res.status(201).json({
      success: true,
      message: "Material rated successfully",
      data: materialRating
    });
  } catch (error) {
    console.error('Error creating material rating:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const updateMaterialRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { rating, comment } = req.body;
    const studentId = req.user.id;

    // Find the rating and verify ownership
    const existingRating = await prisma.materialRating.findUnique({
      where: { id: ratingId },
      include: {
        material: {
          select: {
            trainerId: true
          }
        }
      }
    });

    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: "Rating not found"
      });
    }

    if (existingRating.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own ratings"
      });
    }

    // Update the rating
    const updatedRating = await prisma.materialRating.update({
      where: { id: ratingId },
      data: {
        rating,
        comment
      },
      include: {
        material: {
          select: {
            id: true,
            title: true,
            trainer: {
              select: {
                id: true,
                user: {
                  select: {
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Update trainer's reputation score
    await ReputationService.calculateReputationScore(existingRating.material.trainerId);

    res.json({
      success: true,
      message: "Rating updated successfully",
      data: updatedRating
    });
  } catch (error) {
    console.error('Error updating material rating:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const deleteMaterialRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const studentId = req.user.id;

    // Find the rating and verify ownership
    const existingRating = await prisma.materialRating.findUnique({
      where: { id: ratingId },
      include: {
        material: {
          select: {
            trainerId: true
          }
        }
      }
    });

    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: "Rating not found"
      });
    }

    if (existingRating.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own ratings"
      });
    }

    // Delete the rating
    await prisma.materialRating.delete({
      where: { id: ratingId }
    });

    // Update trainer's reputation score
    await ReputationService.calculateReputationScore(existingRating.material.trainerId);

    res.json({
      success: true,
      message: "Rating deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting material rating:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getMaterialRatings = async (req, res) => {
  try {
    const { materialId, page = 1, limit = 10 } = req.query;

    // Check if material exists
    const material = await prisma.material.findUnique({
      where: { 
        id: materialId,
        isActive: true,
        deletedAt: null
      },
      select: { id: true, title: true }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }

    const skip = (page - 1) * limit;

    const [ratings, totalCount] = await Promise.all([
      prisma.materialRating.findMany({
        where: { materialId },
        include: {
          student: {
            select: {
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.materialRating.count({
        where: { materialId }
      })
    ]);

    // Calculate average rating
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    res.json({
      success: true,
      data: {
        material,
        ratings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        stats: {
          averageRating: Math.round(averageRating * 100) / 100,
          totalRatings: totalCount
        }
      }
    });
  } catch (error) {
    console.error('Error getting material ratings:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getStudentRatings = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [ratings, totalCount] = await Promise.all([
      prisma.materialRating.findMany({
        where: { studentId },
        include: {
          material: {
            select: {
              id: true,
              title: true,
              trainer: {
                select: {
                  user: {
                    select: {
                      email: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.materialRating.count({
        where: { studentId }
      })
    ]);

    res.json({
      success: true,
      data: {
        ratings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting student ratings:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
