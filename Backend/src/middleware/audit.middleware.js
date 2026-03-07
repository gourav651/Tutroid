import prisma from "../db.js";

// Async audit logging queue to prevent blocking requests
const auditQueue = [];
let isProcessingQueue = false;

const processAuditQueue = async () => {
  if (isProcessingQueue || auditQueue.length === 0) return;
  
  isProcessingQueue = true;
  const batch = auditQueue.splice(0, 10); // Process in batches of 10
  
  try {
    await prisma.auditLog.createMany({
      data: batch,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error('Failed to create audit logs:', error);
  }
  
  isProcessingQueue = false;
  
  // Process remaining items
  if (auditQueue.length > 0) {
    setTimeout(processAuditQueue, 100);
  }
};

export const auditMiddleware = (req, res, next) => {
  const originalSend = res.send;
  let responseSent = false;

  res.send = function (data) {
    // Prevent double-sending
    if (responseSent) return;
    responseSent = true;

    // Only log sensitive operations, not every request
    const sensitiveOperations = [
      'POST', 'PUT', 'PATCH', 'DELETE'
    ];
    
    const sensitivePaths = [
      '/auth/', '/admin/', '/users/', '/verification/'
    ];
    
    const shouldLog = (
      res.statusCode < 400 && 
      req.user && 
      (sensitiveOperations.includes(req.method) || 
       sensitivePaths.some(path => req.path.includes(path)))
    );

    if (shouldLog) {
      // Add to queue instead of blocking request
      auditQueue.push({
        userId: req.user.id,
        action: `${req.method} ${req.path}`,
        resource: req.path,
        details: {
          statusCode: res.statusCode,
          // Only log essential data to reduce payload
          ...(req.method !== 'GET' && { body: req.body }),
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
      });
      
      // Process queue asynchronously
      setImmediate(processAuditQueue);
    }

    originalSend.call(this, data);
  };

  next();
};

export const logAction = async (userId, action, resource, details = {}) => {
  try {
    // Add to queue instead of immediate database write
    auditQueue.push({
      userId,
      action,
      resource,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      createdAt: new Date(),
    });
    
    setImmediate(processAuditQueue);
  } catch (error) {
    console.error('Failed to queue audit log:', error);
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
