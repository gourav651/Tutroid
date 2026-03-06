import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAllUsers() {
  try {
    console.log('🧹 Starting user cleanup process...');
    
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      console.log('📊 Counting existing records...');
      
      // Count existing records
      const userCount = await tx.user.count();
      const trainerCount = await tx.trainerProfile.count();
      const institutionCount = await tx.institutionProfile.count();
      const studentCount = await tx.studentProfile.count();
      
      console.log(`Found ${userCount} users, ${trainerCount} trainers, ${institutionCount} institutions, ${studentCount} students`);
      
      if (userCount === 0) {
        console.log('✅ No users found. Database is already clean.');
        return;
      }
      
      // Delete in correct order to respect foreign key constraints
      console.log('🗑️  Deleting user-related data...');
      
      // 1. Delete audit logs
      const auditLogs = await tx.auditLog.deleteMany({});
      console.log(`   Deleted ${auditLogs.count} audit logs`);
      
      // 2. Delete notifications
      const notifications = await tx.notification.deleteMany({});
      console.log(`   Deleted ${notifications.count} notifications`);
      
      // 3. Delete verification requests
      const verificationRequests = await tx.verificationRequest.deleteMany({});
      console.log(`   Deleted ${verificationRequests.count} verification requests`);
      
      // 4. Delete messages and conversations
      const messages = await tx.message.deleteMany({});
      console.log(`   Deleted ${messages.count} messages`);
      
      const conversations = await tx.conversation.deleteMany({});
      console.log(`   Deleted ${conversations.count} conversations`);
      
      // 5. Delete connections
      const connections = await tx.connection.deleteMany({});
      console.log(`   Deleted ${connections.count} connections`);
      
      // 6. Delete post reviews and posts
      const postReviews = await tx.postReview.deleteMany({});
      console.log(`   Deleted ${postReviews.count} post reviews`);
      
      const posts = await tx.post.deleteMany({});
      console.log(`   Deleted ${posts.count} posts`);
      
      // 7. Delete education and experience
      const education = await tx.education.deleteMany({});
      console.log(`   Deleted ${education.count} education records`);
      
      const experience = await tx.experience.deleteMany({});
      console.log(`   Deleted ${experience.count} experience records`);
      
      // 8. Delete reports
      const reports = await tx.report.deleteMany({});
      console.log(`   Deleted ${reports.count} reports`);
      
      // 9. Delete material ratings and materials
      const materialRatings = await tx.materialRating.deleteMany({});
      console.log(`   Deleted ${materialRatings.count} material ratings`);
      
      const materials = await tx.material.deleteMany({});
      console.log(`   Deleted ${materials.count} materials`);
      
      // 10. Delete badges
      const badges = await tx.badge.deleteMany({});
      console.log(`   Deleted ${badges.count} badges`);
      
      // 11. Delete reviews and requests
      const reviews = await tx.review.deleteMany({});
      console.log(`   Deleted ${reviews.count} reviews`);
      
      const requests = await tx.request.deleteMany({});
      console.log(`   Deleted ${requests.count} requests`);
      
      // 12. Delete profile tables
      const studentProfiles = await tx.studentProfile.deleteMany({});
      console.log(`   Deleted ${studentProfiles.count} student profiles`);
      
      const institutionProfiles = await tx.institutionProfile.deleteMany({});
      console.log(`   Deleted ${institutionProfiles.count} institution profiles`);
      
      const trainerProfiles = await tx.trainerProfile.deleteMany({});
      console.log(`   Deleted ${trainerProfiles.count} trainer profiles`);
      
      // 13. Finally, delete all users
      const users = await tx.user.deleteMany({});
      console.log(`   Deleted ${users.count} users`);
      
      console.log('✅ User cleanup completed successfully!');
    });
    
    console.log('🎉 All users and related data have been removed from the database.');
    console.log('📝 You can now sign up with the same email addresses again.');
    
  } catch (error) {
    console.error('❌ Error during user cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanAllUsers()
  .then(() => {
    console.log('🏁 Cleanup script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });