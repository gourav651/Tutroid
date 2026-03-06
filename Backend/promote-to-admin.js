import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteToAdmin() {
  try {
    // Change this to your email
    const email = 'your-email@example.com'; // <-- REPLACE WITH YOUR EMAIL

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found with email:', email);
      console.log('Please update the email in this script');
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { 
        role: 'ADMIN',
        isVerified: true,
        isBanned: false 
      },
    });

    console.log('User promoted to ADMIN successfully!');
    console.log('Email:', updated.email);
    console.log('Role:', updated.role);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

promoteToAdmin();
