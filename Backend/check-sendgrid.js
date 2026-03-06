import dotenv from 'dotenv';

dotenv.config();

async function checkSendGrid() {
  console.log('\n🔍 Checking SendGrid Configuration...\n');

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey) {
    console.log('❌ SENDGRID_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('✓ API Key found');
  console.log('✓ FROM_EMAIL:', fromEmail);

  try {
    // Check API key validity
    console.log('\n📡 Testing SendGrid API connection...');
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key is valid');
      console.log('   Account:', data.email || data.username);
    } else {
      console.log('❌ API Key is invalid or expired');
      console.log('   Status:', response.status);
      const error = await response.text();
      console.log('   Error:', error);
      process.exit(1);
    }

    // Check sender verification
    console.log('\n📧 Checking sender verification...');
    const sendersResponse = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (sendersResponse.ok) {
      const sendersData = await sendersResponse.json();
      const verifiedSenders = sendersData.results || [];
      
      console.log(`Found ${verifiedSenders.length} verified sender(s):`);
      verifiedSenders.forEach(sender => {
        console.log(`   - ${sender.from_email} (${sender.verified ? '✅ Verified' : '⚠️  Pending'})`);
      });

      const isFromEmailVerified = verifiedSenders.some(
        s => s.from_email === fromEmail && s.verified
      );

      if (isFromEmailVerified) {
        console.log(`\n✅ ${fromEmail} is verified and ready to send emails!`);
      } else {
        console.log(`\n⚠️  ${fromEmail} is NOT verified!`);
        console.log('\n📝 To verify your sender email:');
        console.log('   1. Go to: https://app.sendgrid.com/settings/sender_auth/senders');
        console.log('   2. Click "Create New Sender" or "Verify a Single Sender"');
        console.log(`   3. Add: ${fromEmail}`);
        console.log('   4. Check your email inbox for verification link');
        console.log('   5. Click the link to verify');
      }
    } else {
      console.log('⚠️  Could not check sender verification');
    }

    // Check recent email activity
    console.log('\n📊 Checking recent email activity...');
    const statsResponse = await fetch('https://api.sendgrid.com/v3/stats?limit=1', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      if (stats.length > 0) {
        const latest = stats[0].stats[0]?.metrics || {};
        console.log('   Requests:', latest.requests || 0);
        console.log('   Delivered:', latest.delivered || 0);
        console.log('   Bounces:', latest.bounces || 0);
      } else {
        console.log('   No email activity yet');
      }
    }

    console.log('\n✅ SendGrid check complete!');

  } catch (error) {
    console.error('\n❌ Error checking SendGrid:', error.message);
    process.exit(1);
  }
}

checkSendGrid();
