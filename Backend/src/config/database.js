import { PrismaClient } from '@prisma/client';

// Optimized Prisma configuration for better performance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool optimization
prisma.$on('beforeExit', async () => {
  console.log('Disconnecting from database...');
  await prisma.$disconnect();
});

// Query optimization middleware
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  // Log slow queries in development
  if (process.env.NODE_ENV === 'development' && (after - before) > 1000) {
    console.log(`Slow Query: ${params.model}.${params.action} took ${after - before}ms`);
  }
  
  return result;
});

export default prisma;