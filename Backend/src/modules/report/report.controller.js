import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createReport = async (req, res) => {
  try {
    const { targetId, targetType, reason, details } = req.body;
    const reporterId = req.user.id;

    // Validate target exists based on type
    let targetExists = false;
    switch (targetType) {
      case "TRAINER":
        targetExists = await prisma.trainerProfile.findUnique({
          where: { id: targetId, isActive: true, deletedAt: null },
        });
        break;
      case "MATERIAL":
        targetExists = await prisma.material.findUnique({
          where: { id: targetId, isActive: true, deletedAt: null },
        });
        break;
      case "REVIEW":
        targetExists = await prisma.review.findUnique({
          where: { id: targetId },
        });
        break;
    }

    if (!targetExists) {
      return res.status(404).json({
        success: false,
        message: `${targetType} not found`,
      });
    }

    // Check if user already reported this target
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        targetId,
        targetType,
        status: "PENDING",
      },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this item",
      });
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reporterId,
        targetId,
        targetType,
        reason,
        details,
      },
      include: {
        reporter: {
          select: {
            user: {
              select: {
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Auto-suspend if multiple reports on same target
    await checkForAutoSuspension(targetId, targetType);

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: report,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, resolutionNote } = req.body;
    const adminId = req.user.id;

    // Verify user is admin (you might want to add an admin role check)
    const user = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update reports",
      });
    }

    // Find and update the report
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedBy: adminId,
        details: resolutionNote
          ? `${report.details || ""}\n\nResolution: ${resolutionNote}`.trim()
          : report.details,
      },
      include: {
        reporter: {
          select: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Report updated successfully",
      data: updatedReport,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getReports = async (req, res) => {
  try {
    const { status, targetType, page = 1, limit = 20 } = req.query;
    const adminId = req.user.id;

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view reports",
      });
    }

    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (targetType) where.targetType = targetType;

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              user: {
                select: {
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting reports:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body;
    const adminId = req.user.id;

    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can suspend users",
      });
    }

    // Soft suspend by deactivating user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Also deactivate related profiles
    if (user.trainerProfile) {
      await prisma.trainerProfile.update({
        where: { userId },
        data: { isActive: false },
      });
    }

    if (user.institutionProfile) {
      await prisma.institutionProfile.update({
        where: { userId },
        data: { isActive: false },
      });
    }

    // Log the suspension
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "SUSPEND_USER",
        resource: "User",
        details: {
          suspendedUserId: userId,
          reason,
          duration,
        },
      },
    });

    res.json({
      success: true,
      message: "User suspended successfully",
    });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can unsuspend users",
      });
    }

    // Reactivate user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    // Also reactivate related profiles
    if (user.trainerProfile) {
      await prisma.trainerProfile.update({
        where: { userId },
        data: { isActive: true },
      });
    }

    if (user.institutionProfile) {
      await prisma.institutionProfile.update({
        where: { userId },
        data: { isActive: true },
      });
    }

    // Log the unsuspension
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "UNSUSPEND_USER",
        resource: "User",
        details: {
          unsuspendedUserId: userId,
        },
      },
    });

    res.json({
      success: false,
      message: "User unsuspended successfully",
    });
  } catch (error) {
    console.error("Error unsuspending user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const checkForAutoSuspension = async (targetId, targetType) => {
  try {
    const REPORT_THRESHOLD = 3; // Auto-suspend after 3 reports

    const reportCount = await prisma.report.count({
      where: {
        targetId,
        targetType,
        status: "PENDING",
      },
    });

    if (reportCount >= REPORT_THRESHOLD) {
      let userId = null;

      // Find the user associated with the target
      switch (targetType) {
        case "TRAINER":
          const trainer = await prisma.trainerProfile.findUnique({
            where: { id: targetId },
            select: { userId: true },
          });
          userId = trainer?.userId;
          break;
        case "MATERIAL":
          const material = await prisma.material.findUnique({
            where: { id: targetId },
            select: {
              trainer: {
                select: { userId: true },
              },
            },
          });
          userId = material?.trainer?.userId;
          break;
      }

      if (userId) {
        // Auto-suspend the user
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: false },
        });

        // Also deactivate trainer profile if exists
        await prisma.trainerProfile.updateMany({
          where: { userId },
          data: { isActive: false },
        });

        // Log auto-suspension
        await prisma.auditLog.create({
          data: {
            action: "AUTO_SUSPEND",
            resource: targetType,
            details: {
              targetId,
              reportCount,
              threshold: REPORT_THRESHOLD,
            },
          },
        });
      }
    }
  } catch (error) {
    console.error("Error checking auto-suspension:", error);
  }
};
