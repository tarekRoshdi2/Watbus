import { boss } from './messageQueue.js';

export async function initializeWorkers(processWebhook: (payload: any) => Promise<void>) {
  if (!boss) return;

  // Create queues before working on them to prevent "Queue does not exist" error
  await boss.createQueue('incoming-messages');
  await boss.createQueue('outgoing-messages');

  await boss.work('incoming-messages', async (jobs: any) => {
    // pg-boss 9+ passes an array of jobs
    const jobList = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobList) {
      const payload = job.data;
      console.log(`[Queue Worker] Processing incoming webhook from Meta (Job ID: ${job.id})`);
      // Process webhook
      await processWebhook(payload);
    }
  });

  await boss.work('outgoing-messages', async (jobs: any) => {
    const jobList = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobList) {
      const payload = job.data;
      console.log(`[Queue Worker] Processing outgoing message (Job ID: ${job.id})`);
      // Process outgoing message...
    }
  });

  console.log('[Workers] pg-boss Workers initialized successfully.');
}
