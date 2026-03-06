import client from './src/db.js';
import { sendVerificationOTP } from './src/modules/auth/emailVerification.service.js';

async function testOTPFlow() {
  try {
    console.log('🧪 Testing OTP flow for existing users...\n');
    
    // Get all unverified users
    const unverifiedUsers = await client.user.findMany({
      where: {
        isVerified: false
      },
      select: {
        id: true,
        email: true,
        username: true,
        resetPasswordOTP: true,
        resetPasswordOTPExpires: true,
        createdAt: true
      }
    });

    if (unverifiedUsers.length === 0) {
      console.log('❌ No unverified users found.');
      return;
    }

    console.log(`📊 Found ${unverifiedUsers.length} unverified users:\n`);

    for (const user of unverifiedUsers) {
      console.log(`👤 User: ${user.email} (${user.username})`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log(`   Has OTP: ${user.resetPasswordOTP ? '✅' : '❌'}`);
      console.log(`   OTP Expires: ${user.resetPasswordOTPExpires ? user.resetPasswordOTPExpires.toLocaleString() : 'N/A'}`);
      
      // Check if OTP is expired
      if (user.resetPasswordOTPExpires) {
        const isExpired = new Date() > user.resetPasswordOTPExpires;
        console.log(`   OTP Status: ${isExpired ? '🔴 EXPIRED' : '🟢 VALID'}`);
      }

      // Test sending OTP to this user
      console.log(`   📧 Testing OTP send to ${user.email}...`);
      try {
        const result = await sendVerificationOTP(user.email);
        console.log(`   ✅ OTP send result: ${result.message}`);
        
        // Check if OTP was saved in database
        const updatedUser = await client.user.findUnique({
          where: { email: user.email },
          select: {
            resetPasswordOTP: true,
            resetPasswordOTPExpires: true
          }
        });
        
        console.log(`   💾 OTP saved in DB: ${updatedUser.resetPasswordOTP ? '✅' : '❌'}`);
        console.log(`   ⏰ New expiry: ${updatedUser.resetPasswordOTPExpires ? updatedUser.resetPasswordOTPExpires.toLocaleString() : 'N/A'}`);
        
      } catch (error) {
        console.log(`   ❌ OTP send failed: ${error.message}`);
      }
      
      console.log('   ' + '-'.repeat(50));
    }

    // Test sending to a specific email
    console.log('\n🎯 Testing OTP send to kumargg1113@gmail.com specifically...');
    try {
      const result = await sendVerificationOTP('kumargg1113@gmail.com');
      console.log(`✅ Result: ${result.message}`);
      
      // Check database
      const user = await client.user.findUnique({
        where: { email: 'kumargg1113@gmail.com' },
        select: {
          resetPasswordOTP: true,
          resetPasswordOTPExpires: true
        }
      });
      
      console.log(`💾 OTP in database: ${user?.resetPasswordOTP ? 'YES' : 'NO'}`);
      console.log(`⏰ Expires at: ${user?.resetPasswordOTPExpires?.toLocaleString() || 'N/A'}`);
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error testing OTP flow:', error);
  } finally {
    await client.$disconnect();
  }
}

// Run the test
testOTPFlow()
  .then(() => {
    console.log('\n🏁 OTP flow test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });