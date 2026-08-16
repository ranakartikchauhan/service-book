require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendPushNotification } = require('../services/fcmService');

async function broadcastTestNotification() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Find all users who have registered a push token
    const usersWithToken = await User.find({
      fcmToken: { $ne: null, $exists: true },
    }).select('name phone email fcmToken currentMode');

    console.log(`Found ${usersWithToken.length} user(s) with active push notification tokens:`);
    usersWithToken.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.name || 'User'} (${u.phone || u.email}) — Token: ${u.fcmToken.slice(0, 25)}...`);
    });

    if (usersWithToken.length === 0) {
      console.log('\n⚠️  No users currently have an fcmToken registered in the database.');
      console.log('👉 To register your phone: Install the updated APK, log in, and your device will automatically sync its push token!');
      process.exit(0);
    }

    console.log('\n🚀 Dispatching test push notifications...');

    let sentCount = 0;
    for (const user of usersWithToken) {
      console.log(`Sending to ${user.name}...`);
      const res = await sendPushNotification({
        token: user.fcmToken,
        title: '🎉 WorkMarket Test Notification',
        body: `Hello ${user.name || 'there'}! Your push notifications are configured and working properly.`,
        data: { type: 'test_broadcast', timestamp: Date.now().toString() },
      });
      sentCount++;
    }

    console.log(`\n✅ Broadcast finished. Sent test notifications to ${sentCount} user(s).`);
  } catch (error) {
    console.error('❌ Broadcast failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

broadcastTestNotification();
