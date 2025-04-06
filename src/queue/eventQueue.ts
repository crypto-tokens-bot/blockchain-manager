import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const eventQueue = new Queue('event-queue', {
  connection: redisConnection
});
