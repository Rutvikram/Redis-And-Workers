import { Worker } from 'bullmq';
import { connection } from './redisConnection.js';

new Worker('emailQueue', async job => {
  console.log(`Processing job: ${job.id}`);
  console.log(`Sending welcome email to: ${job.data.email}`);
  await new Promise(res => setTimeout(res, 2000)); // simulate sending email
  console.log(`Email sent to ${job.data.email}`);
}, { connection });

console.log("Worker is running...");
