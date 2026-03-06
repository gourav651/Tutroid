import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAllEmails() {
  try {
    console.log('Fetching all emails from the database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        isBanned: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log(`Found ${users.length} users:\n`);
    console.log('ID\t\t\t\t\tEmail\t\t\t\tUsername\t\tName\t\t\tRole\t\tStatus');
    console.log('='.repeat(120));

    users.forEach(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
      const status = user.isBanned ? 'BANNED' : user.isVerified ? 'VERIFIED' : user.isActive ? 'ACTIVE' : 'INACTIVE';
      
      console.log(
        `${user.id}\t${user.email.padEnd(25)}\t${user.username.padEnd(15)}\t${fullName.padEnd(20)}\t${user.role}\t\t${status}`
      );
    });

    console.log('\n' + '='.repeat(120));
    console.log(`Total users: ${users.length}`);
    
    // Summary by role
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nUsers by role:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    // Summary by status
    const activeUsers = users.filter(u => u.isActive && !u.isBanned).length;
    const verifiedUsers = users.filter(u => u.isVerified).length;
    const bannedUsers = users.filter(u => u.isBanned).length;
    
    console.log('\nUser status summary:');
    console.log(`  Active: ${activeUsers}`);
    console.log(`  Verified: ${verifiedUsers}`);
    console.log(`  Banned: ${bannedUsers}`);

    // Just emails list
    console.log('\n' + '='.repeat(50));
    console.log('EMAIL LIST ONLY:');
    console.log('='.repeat(50));
    users.forEach(user => {
      console.log(user.email);
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllEmails();