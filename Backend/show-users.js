import client from './src/db.js';

async function showAllUsers() {
  try {
    console.log('📊 Fetching all users from database...\n');
    
    // Get all users with their profile information
    const users = await client.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        headline: true,
        isVerified: true,
        isActive: true,
        isBanned: true,
        createdAt: true,
        trainerProfile: {
          select: {
            id: true,
            uniqueId: true,
            experience: true,
            rating: true,
            verified: true
          }
        },
        institutionProfile: {
          select: {
            id: true,
            uniqueId: true,
            name: true,
            rating: true
          }
        },
        studentProfile: {
          select: {
            id: true,
            bio: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in the database.');
      return;
    }

    console.log(`✅ Found ${users.length} users:\n`);
    console.log('=' .repeat(100));

    users.forEach((user, index) => {
      console.log(`${index + 1}. USER DETAILS:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Headline: ${user.headline || 'N/A'}`);
      console.log(`   Verified: ${user.isVerified ? '✅' : '❌'}`);
      console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
      console.log(`   Banned: ${user.isBanned ? '🚫' : '✅'}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      
      // Show profile information based on role
      if (user.role === 'TRAINER' && user.trainerProfile) {
        console.log(`   TRAINER PROFILE:`);
        console.log(`     - Profile ID: ${user.trainerProfile.id}`);
        console.log(`     - Unique ID: ${user.trainerProfile.uniqueId || 'Not set'}`);
        console.log(`     - Experience: ${user.trainerProfile.experience} years`);
        console.log(`     - Rating: ${user.trainerProfile.rating}/5`);
        console.log(`     - Verified: ${user.trainerProfile.verified ? '✅' : '❌'}`);
      } else if (user.role === 'INSTITUTION' && user.institutionProfile) {
        console.log(`   INSTITUTION PROFILE:`);
        console.log(`     - Profile ID: ${user.institutionProfile.id}`);
        console.log(`     - Unique ID: ${user.institutionProfile.uniqueId || 'Not set'}`);
        console.log(`     - Name: ${user.institutionProfile.name}`);
        console.log(`     - Rating: ${user.institutionProfile.rating}/5`);
      } else if (user.role === 'STUDENT' && user.studentProfile) {
        console.log(`   STUDENT PROFILE:`);
        console.log(`     - Profile ID: ${user.studentProfile.id}`);
        console.log(`     - Bio: ${user.studentProfile.bio || 'No bio'}`);
      } else {
        console.log(`   ⚠️  Profile not created yet for ${user.role}`);
      }
      
      console.log('-'.repeat(100));
    });

    // Summary statistics
    const stats = {
      total: users.length,
      verified: users.filter(u => u.isVerified).length,
      active: users.filter(u => u.isActive).length,
      banned: users.filter(u => u.isBanned).length,
      trainers: users.filter(u => u.role === 'TRAINER').length,
      institutions: users.filter(u => u.role === 'INSTITUTION').length,
      students: users.filter(u => u.role === 'STUDENT').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
    };

    console.log('\n📈 SUMMARY STATISTICS:');
    console.log(`   Total Users: ${stats.total}`);
    console.log(`   Verified: ${stats.verified} (${Math.round(stats.verified/stats.total*100)}%)`);
    console.log(`   Active: ${stats.active} (${Math.round(stats.active/stats.total*100)}%)`);
    console.log(`   Banned: ${stats.banned} (${Math.round(stats.banned/stats.total*100)}%)`);
    console.log(`   Trainers: ${stats.trainers}`);
    console.log(`   Institutions: ${stats.institutions}`);
    console.log(`   Students: ${stats.students}`);
    console.log(`   Admins: ${stats.admins}`);

  } catch (error) {
    console.error('❌ Error fetching users:', error);
  } finally {
    await client.$disconnect();
  }
}

// Run the script
showAllUsers()
  .then(() => {
    console.log('\n🏁 User listing completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });