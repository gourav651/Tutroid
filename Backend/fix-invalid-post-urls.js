import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixInvalidPostURLs() {
  console.log('\n🔧 Fix Invalid Post URLs\n');

  try {
    // Find posts with invalid URLs
    const invalidPosts = await prisma.post.findMany({
      where: {
        OR: [
          { imageUrl: { startsWith: 'http://localhost' } },
          { imageUrl: { startsWith: 'data:' } },
          { imageUrl: { startsWith: '/' } },
          { imageUrl: { startsWith: './' } }
        ]
      },
      select: {
        id: true,
        imageUrl: true,
        type: true,
        content: true,
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
      }
    });

    if (invalidPosts.length === 0) {
      console.log('✅ No invalid post URLs found!\n');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    console.log(`Found ${invalidPosts.length} posts with invalid URLs:\n`);

    invalidPosts.forEach((post, index) => {
      const authorName = `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.email;
      console.log(`${index + 1}. Post by ${authorName}`);
      console.log(`   Content: ${post.content.substring(0, 50)}...`);
      console.log(`   URL: ${post.imageUrl.substring(0, 60)}...`);
      console.log(`   Created: ${post.createdAt.toLocaleString()}\n`);
    });

    console.log('═'.repeat(60));
    console.log('OPTIONS:');
    console.log('1. Delete all invalid posts (recommended)');
    console.log('2. Set imageUrl to NULL (keep posts, remove images)');
    console.log('3. Cancel (do nothing)');
    console.log('═'.repeat(60));

    const choice = await question('\nEnter your choice (1/2/3): ');

    if (choice === '1') {
      console.log('\n⚠️  This will permanently delete these posts!');
      const confirm = await question('Type "DELETE" to confirm: ');
      
      if (confirm === 'DELETE') {
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
        
        console.log(`\n✅ Deleted ${result.count} posts with invalid URLs\n`);
      } else {
        console.log('\n❌ Cancelled. No posts were deleted.\n');
      }
    } else if (choice === '2') {
      const result = await prisma.post.updateMany({
        where: {
          OR: [
            { imageUrl: { startsWith: 'http://localhost' } },
            { imageUrl: { startsWith: 'data:' } },
            { imageUrl: { startsWith: '/' } },
            { imageUrl: { startsWith: './' } }
          ]
        },
        data: {
          imageUrl: null
        }
      });
      
      console.log(`\n✅ Updated ${result.count} posts (removed invalid image URLs)\n`);
    } else {
      console.log('\n❌ Cancelled. No changes made.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

fixInvalidPostURLs();
