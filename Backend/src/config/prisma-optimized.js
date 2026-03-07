import { PrismaClient } from '@prisma/client';

// Optimized Prisma configuration for Neon serverless database
const globalForPrisma = global;

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Optimize for serverless/Neon
    connectionLimit: 10, // Limit concurrent connections
  });
};

// Singleton pattern to reuse connection
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Add query timeout
prisma.$use(async (params, next) => {
  const timeout = 5000; // 5 second timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeout);
  });
  
  try {
    return await Promise.race([next(params), timeoutPromise]);
  } catch (error) {
    console.error(`Query failed: ${params.model}.${params.action}`, error.message);
    throw error;
  }
});

export default prisma;
