import client from "./src/db.js";

async function verifySetup() {
  try {
    console.log("🔍 Verifying setup...\n");

    // Check users with null usernames
    const usersWithNullUsername = await client.$queryRaw`
      SELECT COUNT(*) as count
      FROM "User"
      WHERE username IS NULL OR username = ''
    `;
    
    console.log(`✅ Users with null usernames: ${usersWithNullUsername[0].count}`);

    // Check trainers with unique IDs
    const trainersWithUniqueId = await client.$queryRaw`
      SELECT COUNT(*) as count
      FROM "TrainerProfile"
      WHERE "uniqueId" IS NOT NULL
    `;
    
    const totalTrainers = await client.$queryRaw`
      SELECT COUNT(*) as count
      FROM "TrainerProfile"
    `;
    
    console.log(`✅ Trainers with unique IDs: ${trainersWithUniqueId[0].count}/${totalTrainers[0].count}`);

    // Check institutions with unique IDs
    const institutionsWithUniqueId = await client.$queryRaw`
      SELECT COUNT(*) as count
      FROM "InstitutionProfile"
      WHERE "uniqueId" IS NOT NULL
    `;
    
    const totalInstitutions = await client.$queryRaw`
      SELECT COUNT(*) as count
      FROM "InstitutionProfile"
    `;
    
    console.log(`✅ Institutions with unique IDs: ${institutionsWithUniqueId[0].count}/${totalInstitutions[0].count}`);

    // Show some sample unique IDs
    console.log("\n📋 Sample Unique IDs:");
    
    const sampleTrainers = await client.$queryRaw`
      SELECT u."firstName", u."lastName", u.email, tp."uniqueId"
      FROM "TrainerProfile" tp
      JOIN "User" u ON tp."userId" = u.id
      WHERE tp."uniqueId" IS NOT NULL
      LIMIT 5
    `;
    
    sampleTrainers.forEach(t => {
      const name = t.firstName ? `${t.firstName} ${t.lastName || ''}`.trim() : t.email;
      console.log(`   ${t.uniqueId} - ${name}`);
    });

    const sampleInstitutions = await client.$queryRaw`
      SELECT u."firstName", u."lastName", u.email, ip."uniqueId", ip.name
      FROM "InstitutionProfile" ip
      JOIN "User" u ON ip."userId" = u.id
      WHERE ip."uniqueId" IS NOT NULL
      LIMIT 5
    `;
    
    if (sampleInstitutions.length > 0) {
      console.log("");
      sampleInstitutions.forEach(i => {
        console.log(`   ${i.uniqueId} - ${i.name}`);
      });
    }

    console.log("\n✨ Setup verification complete!");
    console.log("\n📝 Next steps:");
    console.log("   1. Restart your backend server");
    console.log("   2. Log in to your account");
    console.log("   3. Visit your profile page");
    console.log("   4. You should see your unique ID displayed!\n");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying setup:", error.message);
    process.exit(1);
  } finally {
    await client.$disconnect();
  }
}

verifySetup();
