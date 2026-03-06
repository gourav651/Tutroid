import client from "./src/db.js";

async function fixNullUsernames() {
  try {
    console.log("🔄 Fixing null usernames using raw SQL...\n");

    // Use raw SQL to find and fix users with null usernames
    const usersWithNullUsername = await client.$queryRaw`
      SELECT id, email, "firstName", "lastName"
      FROM "User"
      WHERE username IS NULL OR username = ''
    `;

    console.log(`📊 Found ${usersWithNullUsername.length} users with null/empty usernames\n`);

    if (usersWithNullUsername.length === 0) {
      console.log("✅ All users have valid usernames!");
      process.exit(0);
    }

    for (const user of usersWithNullUsername) {
      // Generate username from email
      const emailPrefix = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      
      let baseUsername;
      if (user.firstName && user.lastName) {
        baseUsername = `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, "");
      } else if (user.firstName) {
        baseUsername = user.firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
      } else {
        baseUsername = emailPrefix;
      }

      // Check if username exists and add number if needed
      let username = baseUsername;
      let counter = 1;
      
      while (true) {
        const existing = await client.$queryRaw`
          SELECT id FROM "User" WHERE username = ${username} LIMIT 1
        `;
        
        if (existing.length === 0) {
          break;
        }
        
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Update the user with raw SQL
      await client.$executeRaw`
        UPDATE "User"
        SET username = ${username}
        WHERE id = ${user.id}
      `;

      console.log(`✅ Updated user ${user.email} with username: ${username}`);
    }

    console.log("\n✨ All usernames fixed successfully!");
    console.log("🔄 Now you can run: npx prisma db push\n");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing usernames:", error.message);
    process.exit(1);
  } finally {
    await client.$disconnect();
  }
}

fixNullUsernames();
