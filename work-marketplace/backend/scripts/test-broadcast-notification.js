const path = require('path');
const dotenv = require('dotenv');

// Load .env.production if passed or fallback to .env
const envFile = process.argv.includes('--production') ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(__dirname, '../', envFile) });

const mongoose = require('mongoose');
const User = require('../models/User');
const { sendPushNotification } = require('../services/fcmService');

async function testWithDb(uri, label) {
  console.log(`\n======================================================`);
  console.log(`🔍 Checking Database: [${label}]`);
  console.log(`URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`);
  console.log(`======================================================`);

  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    console.log(`✅ Connected successfully to [${label}]`);

    const UserModel = conn.model('User', User.schema);
    const totalUsers = await UserModel.countDocuments();
    console.log(`👥 Total users registered in database: ${totalUsers}`);

    const usersWithToken = await UserModel.find({
      fcmToken: { $ne: null, $exists: true },
    }).select('name phone email fcmToken currentMode');

    console.log(`📲 Users with active Push Notification Token: ${usersWithToken.length}`);

    if (usersWithToken.length > 0) {
      usersWithToken.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.name || 'User'} (${u.phone || u.email}) — Token: ${u.fcmToken}`);
      });

      console.log('\n🚀 Sending test notification to all registered tokens...');
      for (const u of usersWithToken) {
        console.log(`Sending to ${u.name}...`);
        await sendPushNotification({
          token: u.fcmToken,
          title: '🎉 Production Push Notification Test',
          body: `Hello ${u.name}! Your WorkMarket push notification system is working in production.`,
          data: { type: 'test_broadcast', timestamp: Date.now().toString() },
        });
      }
    } else {
      console.log('ℹ️  No devices have registered a push token in this database yet.');
    }

    await conn.close();
  } catch (err) {
    console.error(`❌ Error connecting to [${label}]:`, err.message);
  }
}

async function run() {
  const prodUri = 'mongodb+srv://kartikchauhan336:QoBJmjXCYqObFnsp@cluster0.umvdwqv.mongodb.net/jobgramApp?retryWrites=true&w=majority';
  const defaultUri = process.env.MONGO_URI || 'mongodb+srv://kartikchauhan336:QoBJmjXCYqObFnsp@cluster0.umvdwqv.mongodb.net/jobgram?retryWrites=true&w=majority';

  await testWithDb(prodUri, 'Production Database: jobgramApp');
  if (defaultUri !== prodUri) {
    await testWithDb(defaultUri, 'Database: jobgram');
  }

  process.exit(0);
}

run();
