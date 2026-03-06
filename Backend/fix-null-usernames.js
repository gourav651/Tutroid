import client from "./src/db.js";

async function generateUsername(email, firstName, lastName) {
  const baseUsername = firstName && lastName
    ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
    : email.split("@")[0].toLowerCase();

  // Remove special characters
  const cleanUsername = baseUsername.replace(/[^a-z0-9.]/g, "");

  // Check if username exists
  let username = cleanUsername;
  let counter = 1;

  while (true) {
    const existing = await client.user.findUnique({
      where: { username },
    });

    if (!existing) {
      return username;
    }

    username = `${cleanUsername}${counter}`;
    counter++;
  }
}

async function fixNullUsernames() {
  try {
    console.log("🔄 Checking for users with null usernames...");

    // Get all users
    const allUsers = await client.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`📊 Total users in database: ${allUsers.length}`);

    // Find users with null or empty usernames
    const usersWithoutUsername = allUsers.filter(
      (user) => !user.username || user.username.trim() === ""
    );

    console.log(`❌ Found ${usersWithoutUsername.length} users without valid usernames`);

    if (usersWithoutUsername.length === 0) {
      console.log("✅ All users have valid usernames!");
      process.exit(0);
    }

    console.log("\n🔧 Fixing usernames...\n");

    for (const user of usersWithoutUsername) {
      const username = await generateUsername(
        user.email,
        user.firstName,
        user.lastName
      );

      await client.user.update({
        where: { id: user.id },
        data: { username },
      });

      console.log(`✅ Updated user ${user.email} with username: ${username}`);
    }

    console.log("\n✨ All usernames fixed successfully!");
    console.log("🔄 Please restart your application for changes to take effect.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing usernames:", error);
    process.exit(1);
  }
}

fixNullUsernames();
