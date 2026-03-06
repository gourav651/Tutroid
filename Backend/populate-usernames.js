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

async function populateUsernames() {
  try {
    console.log("🔄 Starting username population...");

    // Get all users without usernames
    const users = await client.user.findMany({
      where: {
        username: null,
      },
    });

    console.log(`📊 Found ${users.length} users without usernames`);

    for (const user of users) {
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

    console.log("✨ Username population complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error populating usernames:", error);
    process.exit(1);
  }
}

populateUsernames();
