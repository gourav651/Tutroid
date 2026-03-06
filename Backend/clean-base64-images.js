import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanBase64Images() {
  console.log('Starting cleanup of base64 data URLs in database...\n');

  try {
    // Find all users with base64 data URLs in profilePicture
    const usersWithBase64Profile = await prisma.user.findMany({
      where: {
        profilePicture: {
          startsWith: 'data:image'
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true
      }
    });

    console.log(`Found ${usersWithBase64Profile.length} users with base64 profile pictures`);

    if (usersWithBase64Profile.length > 0) {
      console.log('\nUsers affected:');
      usersWithBase64Profile.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
      });

      // Update all users with base64 profile pictures to null
      const profileResult = await prisma.user.updateMany({
        where: {
          profilePicture: {
            startsWith: 'data:image'
          }
        },
        data: {
          profilePicture: null
        }
      });

      console.log(`\n✓ Cleaned ${profileResult.count} profile pictures`);
    }

    // Find all users with base64 data URLs in coverImage
    const usersWithBase64Cover = await prisma.user.findMany({
      where: {
        coverImage: {
          startsWith: 'data:image'
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`\nFound ${usersWithBase64Cover.length} users with base64 cover images`);

    if (usersWithBase64Cover.length > 0) {
      // Update all users with base64 cover images to null
      const coverResult = await prisma.user.updateMany({
        where: {
          coverImage: {
            startsWith: 'data:image'
          }
        },
        data: {
          coverImage: null
        }
      });

      console.log(`✓ Cleaned ${coverResult.count} cover images`);
    }

    console.log('\n✅ Cleanup completed successfully!');
    console.log('Users will need to re-upload their profile pictures using the Edit Profile feature.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanBase64Images()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
