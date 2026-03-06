import client from './src/db.js';

async function checkStatus() {
  try {
    console.log('🔍 Checking TRN0001 verification status...\n');
    
    // Find the trainer
    const trainer = await client.trainerProfile.findFirst({
      where: { uniqueId: 'TRN0001' },
      include: { 
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            isVerified: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!trainer) {
      console.log('❌ No trainer found with unique ID: TRN0001');
      process.exit(0);
    }

    console.log('📋 USER DETAILS:');
    console.log('================');
    console.log(`ID: ${trainer.user.id}`);
    console.log(`Email: ${trainer.user.email}`);
    console.log(`Username: ${trainer.user.username}`);
    console.log(`Name: ${trainer.user.firstName} ${trainer.user.lastName}`);
    console.log(`Role: ${trainer.user.role}`);
    console.log(`Unique ID: ${trainer.uniqueId}`);
    console.log(`✅ isVerified: ${trainer.user.isVerified}`);
    console.log(`Created: ${trainer.user.createdAt}`);
    console.log(`Updated: ${trainer.user.updatedAt}`);

    // Check verification requests
    console.log('\n📋 VERIFICATION REQUESTS:');
    console.log('=========================');
    const requests = await client.verificationRequest.findMany({
      where: { userId: trainer.user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (requests.length === 0) {
      console.log('No verification requests found');
    } else {
      requests.forEach((req, index) => {
        console.log(`\nRequest ${index + 1}:`);
        console.log(`  Status: ${req.status}`);
        console.log(`  Created: ${req.createdAt}`);
        console.log(`  Reviewed: ${req.reviewedAt || 'Not reviewed'}`);
        console.log(`  Admin Note: ${req.adminNote || 'None'}`);
      });
    }

    console.log('\n✅ DIAGNOSIS:');
    console.log('=============');
    if (trainer.user.isVerified) {
      console.log('✅ User IS verified in database');
      console.log('✅ Has unique ID: ' + trainer.uniqueId);
      console.log('\n💡 If frontend shows "Request Verification" button:');
      console.log('   1. Clear browser cache and cookies');
      console.log('   2. Log out and log back in');
      console.log('   3. Restart the backend server');
      console.log('   4. Check browser console for API errors');
    } else {
      console.log('❌ User is NOT verified in database');
      console.log('   Run: node fix-verification-trn0001.js');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.$disconnect();
    process.exit(0);
  }
}

checkStatus();
