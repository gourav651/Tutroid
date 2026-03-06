import client from './src/db.js';

async function checkUsers() {
  try {
    const users = await client.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true
      },
      take: 5
    });

    console.log('📋 First 5 users:');
    users.forEach(user => {
      console.log(`   ${user.email} (${user.role}) - ${user.firstName} ${user.lastName || ''}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
