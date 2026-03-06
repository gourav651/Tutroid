import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function regeneratePrisma() {
  try {
    console.log('Regenerating Prisma Client...');
    
    // Try to generate
    const { stdout, stderr } = await execAsync('npx prisma generate');
    
    console.log('Success!');
    console.log(stdout);
    
    if (stderr) {
      console.error('Warnings:', stderr);
    }
  } catch (error) {
    console.error('Error regenerating Prisma client:', error.message);
    console.log('\nPlease manually run: npx prisma generate');
    console.log('Make sure to stop the backend server first!');
  }
}

regeneratePrisma();
