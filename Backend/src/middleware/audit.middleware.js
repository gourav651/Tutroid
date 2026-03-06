import prisma from "../db.js";

export const auditMiddleware = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    // Log successful operations (status codes < 400)
    if (res.statusCode < 400 && req.user) {
      prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: `${req.method} ${req.path}`,
          resource: req.path,
          details: {
            body: req.body,
            query: req.query,
            params: req.params,
            statusCode: res.statusCode
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      }).catch(error => {
        console.error('Failed to create audit log:', error);
      });
    }

    originalSend.call(this, data);
  };

  next();
};

export const logAction = async (userId, action, resource, details = {}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details,
        ipAddress: details.ipAddress,
        userAgent: details.userAgent
      }
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};

export const softDeleteMiddleware = (model) => {
  return async (req, res, next) => {
    const originalDelete = req.prisma[model].delete;

    req.prisma[model].delete = async function (args) {
      // Convert delete to soft delete by updating deletedAt
      return req.prisma[model].update({
        where: args.where,
        data: { deletedAt: new Date() }
      });
    };

    next();
  };
};

export const excludeDeletedMiddleware = (model) => {
  return (req, res, next) => {
    // Add deletedAt filter to all queries
    const originalFindMany = req.prisma[model].findMany;
    const originalFindUnique = req.prisma[model].findUnique;
    const originalFindFirst = req.prisma[model].findFirst;

    const addDeletedFilter = (args) => {
      if (!args.where) args.where = {};
      args.where.deletedAt = null;
      return args;
    };

    req.prisma[model].findMany = function (args) {
      return originalFindMany.call(this, addDeletedFilter(args || {}));
    };

    req.prisma[model].findUnique = function (args) {
      return originalFindUnique.call(this, addDeletedFilter(args || {}));
    };

    req.prisma[model].findFirst = function (args) {
      return originalFindFirst.call(this, addDeletedFilter(args || {}));
    };

    next();
  };
};
