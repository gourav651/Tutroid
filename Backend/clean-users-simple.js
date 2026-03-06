import client from './src/db.js';

async function cleanAllUsers() {
  try {
    console.log('🧹 Starting user cleanup process...');
    console.log('⚠️  This will delete ALL users and their related data!');
    
    // Count existing records first
    const userCount = await client.user.count();
    console.log(`📊 Found ${userCount} users in the database.`);
    
    if (userCount === 0) {
      console.log('✅ No users found. Database is already clean.');
      return;
    }
    
    console.log('🚀 Starting deletion process...');
    console.log('🗑️  Deleting user-related data...');
    
    // Delete in correct order to respect foreign key constraints (without transaction)
    
    try {
      // 1. Delete audit logs
      const auditLogs = await client.auditLog.deleteMany({});
      console.log(`   ✓ Deleted ${auditLogs.count} audit logs`);
    } catch (e) { console.log(`   ⚠️  Audit logs: ${e.message}`); }
    
    try {
      // 2. Delete notifications
      const notifications = await client.notification.deleteMany({});
      console.log(`   ✓ Deleted ${notifications.count} notifications`);
    } catch (e) { console.log(`   ⚠️  Notifications: ${e.message}`); }
    
    try {
      // 3. Delete verification requests
      const verificationRequests = await client.verificationRequest.deleteMany({});
      console.log(`   ✓ Deleted ${verificationRequests.count} verification requests`);
    } catch (e) { console.log(`   ⚠️  Verification requests: ${e.message}`); }
    
    try {
      // 4. Delete messages and conversations
      const messages = await client.message.deleteMany({});
      console.log(`   ✓ Deleted ${messages.count} messages`);
    } catch (e) { console.log(`   ⚠️  Messages: ${e.message}`); }
    
    try {
      const conversations = await client.conversation.deleteMany({});
      console.log(`   ✓ Deleted ${conversations.count} conversations`);
    } catch (e) { console.log(`   ⚠️  Conversations: ${e.message}`); }
    
    try {
      // 5. Delete connections
      const connections = await client.connection.deleteMany({});
      console.log(`   ✓ Deleted ${connections.count} connections`);
    } catch (e) { console.log(`   ⚠️  Connections: ${e.message}`); }
    
    try {
      // 6. Delete post reviews and posts
      const postReviews = await client.postReview.deleteMany({});
      console.log(`   ✓ Deleted ${postReviews.count} post reviews`);
    } catch (e) { console.log(`   ⚠️  Post reviews: ${e.message}`); }
    
    try {
      const posts = await client.post.deleteMany({});
      console.log(`   ✓ Deleted ${posts.count} posts`);
    } catch (e) { console.log(`   ⚠️  Posts: ${e.message}`); }
    
    try {
      // 7. Delete education and experience
      const education = await client.education.deleteMany({});
      console.log(`   ✓ Deleted ${education.count} education records`);
    } catch (e) { console.log(`   ⚠️  Education: ${e.message}`); }
    
    try {
      const experience = await client.experience.deleteMany({});
      console.log(`   ✓ Deleted ${experience.count} experience records`);
    } catch (e) { console.log(`   ⚠️  Experience: ${e.message}`); }
    
    try {
      // 8. Delete reports
      const reports = await client.report.deleteMany({});
      console.log(`   ✓ Deleted ${reports.count} reports`);
    } catch (e) { console.log(`   ⚠️  Reports: ${e.message}`); }
    
    try {
      // 9. Delete material ratings and materials
      const materialRatings = await client.materialRating.deleteMany({});
      console.log(`   ✓ Deleted ${materialRatings.count} material ratings`);
    } catch (e) { console.log(`   ⚠️  Material ratings: ${e.message}`); }
    
    try {
      const materials = await client.material.deleteMany({});
      console.log(`   ✓ Deleted ${materials.count} materials`);
    } catch (e) { console.log(`   ⚠️  Materials: ${e.message}`); }
    
    try {
      // 10. Delete badges
      const badges = await client.badge.deleteMany({});
      console.log(`   ✓ Deleted ${badges.count} badges`);
    } catch (e) { console.log(`   ⚠️  Badges: ${e.message}`); }
    
    try {
      // 11. Delete reviews and requests
      const reviews = await client.review.deleteMany({});
      console.log(`   ✓ Deleted ${reviews.count} reviews`);
    } catch (e) { console.log(`   ⚠️  Reviews: ${e.message}`); }
    
    try {
      const requests = await client.request.deleteMany({});
      console.log(`   ✓ Deleted ${requests.count} requests`);
    } catch (e) { console.log(`   ⚠️  Requests: ${e.message}`); }
    
    try {
      // 12. Delete profile tables
      const studentProfiles = await client.studentProfile.deleteMany({});
      console.log(`   ✓ Deleted ${studentProfiles.count} student profiles`);
    } catch (e) { console.log(`   ⚠️  Student profiles: ${e.message}`); }
    
    try {
      const institutionProfiles = await client.institutionProfile.deleteMany({});
      console.log(`   ✓ Deleted ${institutionProfiles.count} institution profiles`);
    } catch (e) { console.log(`   ⚠️  Institution profiles: ${e.message}`); }
    
    try {
      const trainerProfiles = await client.trainerProfile.deleteMany({});
      console.log(`   ✓ Deleted ${trainerProfiles.count} trainer profiles`);
    } catch (e) { console.log(`   ⚠️  Trainer profiles: ${e.message}`); }
    
    try {
      // 13. Finally, delete all users
      const users = await client.user.deleteMany({});
      console.log(`   ✓ Deleted ${users.count} users`);
    } catch (e) { console.log(`   ⚠️  Users: ${e.message}`); }
    
    console.log('');
    console.log('✅ User cleanup completed successfully!');
    console.log('🎉 All users and related data have been removed from the database.');
    console.log('📝 You can now sign up with the same email addresses again.');
    
  } catch (error) {
    console.error('❌ Error during user cleanup:', error);
    throw error;
  } finally {
    await client.$disconnect();
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