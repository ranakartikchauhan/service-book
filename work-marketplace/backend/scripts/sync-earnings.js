const mongoose = require('mongoose');

const uri = 'mongodb+srv://kartikchauhan336:QoBJmjXCYqObFnsp@cluster0.umvdwqv.mongodb.net/jobgramApp?retryWrites=true&w=majority';

async function run() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas');

  const completedJobs = await mongoose.connection.collection('jobs').find({ status: 'completed' }).toArray();
  console.log(`Found ${completedJobs.length} completed jobs.`);

  for (const job of completedJobs) {
    if (!job.assignedWorkerId) continue;
    const app = await mongoose.connection.collection('applications').findOne({ jobId: job._id, status: 'accepted' });
    const payout = (app && app.proposedRate) ? app.proposedRate : (job.budget || 500);

    console.log(`Job: "${job.title}" | Worker: ${job.assignedWorkerId} | Payout: ₹${payout}`);

    const existingTx = await mongoose.connection.collection('transactions').findOne({ jobId: job._id });
    if (!existingTx) {
      await mongoose.connection.collection('transactions').insertOne({
        jobId: job._id,
        posterId: job.posterId,
        workerId: job.assignedWorkerId,
        amount: payout,
        platformCommission: 0,
        workerPayout: payout,
        status: 'released',
        releasedAt: job.updatedAt || new Date(),
        createdAt: job.createdAt || new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Created transaction for job: ${job._id}`);
    }
  }

  // Recalculate earningsTotal and completedJobs for all workers
  const workers = await mongoose.connection.collection('workerprofiles').find({}).toArray();
  for (const w of workers) {
    const txs = await mongoose.connection.collection('transactions').find({ workerId: w.userId, status: 'released' }).toArray();
    const total = txs.reduce((sum, t) => sum + (t.workerPayout || 0), 0);
    const completedCount = await mongoose.connection.collection('jobs').countDocuments({ assignedWorkerId: w.userId, status: 'completed' });

    await mongoose.connection.collection('workerprofiles').updateOne(
      { userId: w.userId },
      { $set: { earningsTotal: total, completedJobs: completedCount } }
    );
    console.log(`Updated worker: ${w.userId} -> earningsTotal: ₹${total}, completedJobs: ${completedCount}`);
  }

  console.log('All earnings and transactions synced successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Sync error:', err);
  process.exit(1);
});
