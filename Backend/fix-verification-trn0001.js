import client from './src/db.js';

async function fixVerification() {
  try {
    console.log('🔍 Looking for user with unique ID: TRN0001...');
    
    // Find the trainer profile with TRN0001
    const trainer = await client.trainerProfile.findFirst({
      where: { uniqueId: 'TRN0001' },
      include: { 
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isVerified: true
          }
        }
      }
    });

    if (!trainer) {
      console.log('❌ No trainer found with unique ID: TRN0001');
      await client.$disconnect();
      return;
    }

    console.log('✅ Found trainer:');
    console.log(`   Email: ${trainer.user.email}`);
    console.log(`   Name: ${trainer.user.firstName} ${trainer.user.lastName}`);
    console.log(`   Current isVerified: ${trainer.user.isVerified}`);

    if (trainer.user.isVerified) {
      console.log('✅ User is already verified!');
      await client.$disconnect();
      return;
    }

    console.log('\n🔧 Updating isVerified to true...');
    
    // Update the user
    const updatedUser = await client.user.update({
      where: { id: trainer.user.id },
      data: { isVerified: true }
    });

    console.log('✅ Successfully updated!');
    console.log(`   isVerified is now: ${updatedUser.isVerified}`);
    console.log('\n✨ Done! Please refresh the profile page.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.$disconnect();
  }
}

fixVerification();
