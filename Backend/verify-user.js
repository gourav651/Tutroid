import client from './src/db.js';

async function verifyUser(uniqueId) {
  try {
    // Find user by trainer or institution uniqueId
    const trainer = await client.trainerProfile.findFirst({
      where: { uniqueId },
      include: { user: true }
    });

    const institution = await client.institutionProfile.findFirst({
      where: { uniqueId },
      include: { user: true }
    });

    const profile = trainer || institution;

    if (!profile) {
      console.log(`❌ No user found with uniqueId: ${uniqueId}`);
      return;
    }

    // Update user isVerified status
    const updatedUser = await client.user.update({
      where: { id: profile.userId },
      data: { isVerified: true }
    });

    console.log(`✅ User verified successfully!`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`   Unique ID: ${uniqueId}`);
    console.log(`   Is Verified: ${updatedUser.isVerified}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.$disconnect();
  }
}

// Get uniqueId from command line argument
const uniqueId = process.argv[2];

if (!uniqueId) {
  console.log('Usage: node verify-user.js <UNIQUE_ID>');
  console.log('Example: node verify-user.js TRN0001');
  process.exit(1);
}

verifyUser(uniqueId);
