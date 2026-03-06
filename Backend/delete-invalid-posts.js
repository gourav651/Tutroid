import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function deleteInvalidPosts() {
  console.log('\n🗑️  Deleting Posts with Invalid URLs...\n');

  try {
    // Delete posts with localhost URLs
    const result = await prisma.post.deleteMany({
      where: {
        OR: [
          { imageUrl: { startsWith: 'http://localhost' } },
          { imageUrl: { startsWith: 'data:' } },
          { imageUrl: { startsWith: '/' } },
          { imageUrl: { startsWith: './' } }
        ]
      }
    });

    console.log(`✅ Deleted ${result.count} posts with invalid URLs\n`);
    console.log('These posts had localhost URLs that don\'t work on other computers.');
    console.log('Users can re-upload their content using the new Cloudinary system.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteInvalidPosts();
