/**
 * Script to apply the uniqueId migration
 * Run this with: node apply-unique-ids.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyUniqueIds() {
  console.log('🚀 Starting uniqueId migration...\n');

  try {
    // Check if columns exist
    const trainers = await prisma.trainerProfile.findFirst();
    const institutions = await prisma.institutionProfile.findFirst();
    
    console.log('✅ Database connection successful\n');

    // Generate unique IDs for trainers without one
    const trainersWithoutId = await prisma.trainerProfile.findMany({
      where: { uniqueId: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });

    console.log(`📊 Found ${trainersWithoutId.length} trainers without uniqueId`);

    for (let i = 0; i < trainersWithoutId.length; i++) {
      const uniqueId = `TRN${String(i + 1).padStart(4, '0')}`;
      await prisma.trainerProfile.update({
        where: { id: trainersWithoutId[i].id },
        data: { uniqueId }
      });
      console.log(`   ✓ Assigned ${uniqueId} to trainer ${i + 1}/${trainersWithoutId.length}`);
    }

    // Generate unique IDs for institutions without one
    const institutionsWithoutId = await prisma.institutionProfile.findMany({
      where: { uniqueId: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });

    console.log(`\n📊 Found ${institutionsWithoutId.length} institutions without uniqueId`);

    for (let i = 0; i < institutionsWithoutId.length; i++) {
      const uniqueId = `INST${String(i + 1).padStart(4, '0')}`;
      await prisma.institutionProfile.update({
        where: { id: institutionsWithoutId[i].id },
        data: { uniqueId }
      });
      console.log(`   ✓ Assigned ${uniqueId} to institution ${i + 1}/${institutionsWithoutId.length}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Trainers updated: ${trainersWithoutId.length}`);
    console.log(`   - Institutions updated: ${institutionsWithoutId.length}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease run: npx prisma db push');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyUniqueIds();
