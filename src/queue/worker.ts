import { Worker } from 'bullmq';
import { redisConnection } from './redis';
import { handleDepositEvent } from '../strategies/stakingStrategy';

export const eventWorker = new Worker(
  'event-queue',
  async (job) => {
    const { event, contract } = job.data;

    if (event === 'Deposited' && contract === 'MMM') {
      await handleDepositEvent(job.data);
    }

  },
  {
    connection: redisConnection
  }
);
