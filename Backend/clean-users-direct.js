import pg from 'pg';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function cleanAllUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🧹 User Cleanup Script');
    console.log('=====================');
    console.log('⚠️  WARNING: This will delete ALL users and their related data!');
    console.log('📋 This includes:');
    console.log('   - All user accounts');
    console.log('   - All trainer, institution, and student profiles');
    console.log('   - All posts, reviews, and ratings');
    console.log('   - All messages and conversations');
    console.log('   - All connections and requests');
    console.log('   - All materials and badges');
    console.log('   - All audit logs and notifications');
    console.log('');
    
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database');
    
    // Count existing records first
    const userCountResult = await client.query('SELECT COUNT(*) FROM "User"');
    const userCount = parseInt(userCountResult.rows[0].count);
    console.log(`📊 Found ${userCount} users in the database.`);
    
    if (userCount === 0) {
      console.log('✅ No users found. Database is already clean.');
      rl.close();
      return;
    }
    
    console.log('');
    const confirmation1 = await askQuestion('❓ Are you sure you want to delete ALL users? (yes/no): ');
    
    if (confirmation1.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      rl.close();
      return;
    }
    
    const confirmation2 = await askQuestion('❓ This action cannot be undone. Type "DELETE ALL USERS" to confirm: ');
    
    if (confirmation2 !== 'DELETE ALL USERS') {
      console.log('❌ Operation cancelled. Confirmation text did not match.');
      rl.close();
      return;
    }
    
    rl.close();
    
    console.log('');
    console.log('🚀 Starting deletion process...');
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      console.log('🗑️  Deleting user-related data...');
      
      // Delete in correct order to respect foreign key constraints
      const deletions = [
        { table: 'AuditLog', name: 'audit logs' },
        { table: 'Notification', name: 'notifications' },
        { table: 'VerificationRequest', name: 'verification requests' },
        { table: 'Message', name: 'messages' },
        { table: 'Conversation', name: 'conversations' },
        { table: 'Connection', name: 'connections' },
        { table: 'PostReview', name: 'post reviews' },
        { table: 'Post', name: 'posts' },
        { table: 'Education', name: 'education records' },
        { table: 'Experience', name: 'experience records' },
        { table: 'Report', name: 'reports' },
        { table: 'MaterialRating', name: 'material ratings' },
        { table: 'Material', name: 'materials' },
        { table: 'Badge', name: 'badges' },
        { table: 'Review', name: 'reviews' },
        { table: 'Request', name: 'requests' },
        { table: 'StudentProfile', name: 'student profiles' },
        { table: 'InstitutionProfile', name: 'institution profiles' },
        { table: 'TrainerProfile', name: 'trainer profiles' },
        { table: 'User', name: 'users' }
      ];
      
      for (const deletion of deletions) {
        try {
          const result = await client.query(`DELETE FROM "${deletion.table}"`);
          console.log(`   ✓ Deleted ${result.rowCount} ${deletion.name}`);
        } catch (error) {
          // Some tables might not exist or be empty, that's okay
          console.log(`   ⚠️  ${deletion.table}: ${error.message}`);
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('');
      console.log('✅ User cleanup completed successfully!');
      console.log('🎉 All users and related data have been removed from the database.');
      console.log('📝 You can now sign up with the same email addresses again.');
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error during user cleanup:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the cleanup
cleanAllUsers()
  .then(() => {
    console.log('🏁 Cleanup script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error.message);
    process.exit(1);
  });