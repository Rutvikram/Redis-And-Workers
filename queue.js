import { Queue } from 'bullmq';
import { connection } from './redisConnection.js';

export const emailQueue = new Queue('emailQueue', { connection });
