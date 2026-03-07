import { performance } from 'perf_hooks';
import client from './src/db.js';

// Performance testing script to measure optimization improvements
async function testDatabasePerformance() {
  console.log('🚀 Running Performance Tests...\n');

  // Test 1: Posts query performance
  console.log('📊 Testing Posts Query Performance...');
  const start1 = performance.now();
  
  const posts = await client.post.findMany({
    where: { isActive: true },
    select: {
      id: true,
      content: true,
      type: true,
      averageRating: true,
      totalReviews: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePicture: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  
  const end1 = performance.now();
  console.log(`✅ Posts query: ${(end1 - start1).toFixed(2)}ms (${posts.length} results)`);

  // Test 2: Skills aggregation performance
  console.log('\n🔍 Testing Skills Aggregation Performance...');
  const start2 = performance.now();
  
  const skillsResult = await client.$queryRaw`
    SELECT DISTINCT unnest(skills) as skill 
    FROM "TrainerProfile" 
    WHERE "isActive" = true 
    AND skills IS NOT NULL 
    AND array_length(skills, 1) > 0
    ORDER BY skill ASC
    LIMIT 100
  `;
  
  const end2 = performance.now();
  console.log(`✅ Skills query: ${(end2 - start2).toFixed(2)}ms (${skillsResult.length} results)`);

  // Test 3: Review aggregation performance
  console.log('\n⭐ Testing Review Aggregation Performance...');
  const start3 = performance.now();
  
  const reviewAgg = await client.postReview.aggregate({
    where: { 
      post: { isActive: true }
    },
    _avg: { rating: true },
    _count: { rating: true },
  });
  
  const end3 = performance.now();
  console.log(`✅ Review aggregation: ${(end3 - start3).toFixed(2)}ms`);
  console.log(`   Average rating: ${reviewAgg._avg.rating?.toFixed(2) || 0}`);
  console.log(`   Total reviews: ${reviewAgg._count.rating}`);

  // Test 4: Connection count performance
  console.log('\n🔗 Testing Connection Count Performance...');
  const start4 = performance.now();
  
  const connectionCount = await client.connection.count({
    where: { status: 'ACCEPTED' }
  });
  
  const end4 = performance.now();
  console.log(`✅ Connection count: ${(end4 - start4).toFixed(2)}ms (${connectionCount} connections)`);

  // Test 5: Message query with pagination
  console.log('\n💬 Testing Message Query Performance...');
  const start5 = performance.now();
  
  const messages = await client.message.findMany({
    select: {
      id: true,
      content: true,
      createdAt: true,
      isRead: true,
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  
  const end5 = performance.now();
  console.log(`✅ Messages query: ${(end5 - start5).toFixed(2)}ms (${messages.length} results)`);

  const totalTime = end5 - start1;
  console.log(`\n🎯 Total test time: ${totalTime.toFixed(2)}ms`);
  
  // Performance recommendations
  console.log('\n📈 Performance Analysis:');
  if (end1 - start1 > 100) {
    console.log('⚠️  Posts query is slow - consider adding more indexes');
  } else {
    console.log('✅ Posts query performance is good');
  }
  
  if (end2 - start2 > 50) {
    console.log('⚠️  Skills query is slow - raw SQL optimization needed');
  } else {
    console.log('✅ Skills query performance is good');
  }
  
  if (totalTime > 500) {
    console.log('⚠️  Overall performance needs improvement');
  } else {
    console.log('✅ Overall performance is acceptable');
  }
}

// Run the performance test
testDatabasePerformance()
  .catch(console.error)
  .finally(() => client.$disconnect());