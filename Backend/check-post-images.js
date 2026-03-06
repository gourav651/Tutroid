import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkPostImages() {
  console.log('\n🔍 Checking Post Images in Database...\n');

  try {
    // Get recent posts with images
    const posts = await prisma.post.findMany({
      where: {
        imageUrl: {
          not: null
        }
      },
      select: {
        id: true,
        imageUrl: true,
        type: true,
        createdAt: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`Found ${posts.length} posts with images/files:\n`);

    let cloudinaryCount = 0;
    let base64Count = 0;
    let relativePathCount = 0;
    let otherCount = 0;

    posts.forEach((post, index) => {
      const authorName = `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.email;
      console.log(`${index + 1}. Post by ${authorName}`);
      console.log(`   Type: ${post.type}`);
      console.log(`   URL: ${post.imageUrl.substring(0, 80)}${post.imageUrl.length > 80 ? '...' : ''}`);
      
      // Categorize URL type
      if (post.imageUrl.startsWith('https://res.cloudinary.com/')) {
        console.log(`   ✅ Valid Cloudinary URL`);
        cloudinaryCount++;
      } else if (post.imageUrl.startsWith('data:')) {
        console.log(`   ❌ Base64 data URL (INVALID)`);
        base64Count++;
      } else if (post.imageUrl.startsWith('/') || post.imageUrl.startsWith('./')) {
        console.log(`   ⚠️  Relative path (INVALID)`);
        relativePathCount++;
      } else if (post.imageUrl.startsWith('http://localhost')) {
        console.log(`   ⚠️  Localhost URL (won't work on other computers)`);
        otherCount++;
      } else {
        console.log(`   ⚠️  Unknown URL format`);
        otherCount++;
      }
      
      console.log(`   Created: ${post.createdAt.toLocaleString()}\n`);
    });

    // Summary
    console.log('═'.repeat(60));
    console.log('SUMMARY:');
    console.log(`✅ Valid Cloudinary URLs: ${cloudinaryCount}`);
    console.log(`❌ Base64 data URLs: ${base64Count}`);
    console.log(`⚠️  Relative paths: ${relativePathCount}`);
    console.log(`⚠️  Other invalid URLs: ${otherCount}`);
    console.log('═'.repeat(60));

    if (base64Count > 0 || relativePathCount > 0 || otherCount > 0) {
      console.log('\n⚠️  ISSUES FOUND!');
      console.log('\nTo fix invalid URLs, you can:');
      console.log('1. Delete posts with invalid URLs');
      console.log('2. Ask users to re-upload their files');
      console.log('3. Run a migration script to clean up\n');
      
      console.log('Would you like to see the SQL to delete invalid posts?');
      console.log('Run: node fix-invalid-post-urls.js\n');
    } else {
      console.log('\n✅ All post images are using valid Cloudinary URLs!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPostImages();
