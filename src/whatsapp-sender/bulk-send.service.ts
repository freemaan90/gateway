import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { catchError, firstValueFrom } from 'rxjs';
import { WHATSAPP_SENDER } from 'src/service';
import { CampaignService } from 'src/campaign/campaign.service';

// Argentina is UTC-3, no DST
const ARG_OFFSET_MS = -3 * 3_600_000;
const SEND_START_HOUR = 8;
const SEND_END_HOUR = 20;
const DELAY_BETWEEN_MS = 40_000;
const JOB_TTL_MS = 2 * 60 * 60 * 1000; // clean up done jobs after 2 h

interface BulkMessage {
  phone: string;
  message: string;
}

export interface BulkJobStatus {
  jobId: string;
  status: 'processing' | 'waiting' | 'done';
  total: number;
  done: number;
  failed: { phone: string; error: string }[];
  waitUntil?: string; // ISO string, only when status === 'waiting'
}

interface BulkJob extends BulkJobStatus {
  sessionId: string;
  messages: BulkMessage[];
  userId: number;
  finishedAt?: number; // timestamp for TTL cleanup
}

@Injectable()
export class BulkSendService implements OnModuleInit {
  private readonly logger = new Logger(BulkSendService.name);
  private readonly jobs = new Map<string, BulkJob>();

  constructor(
    @Inject(WHATSAPP_SENDER)
    private readonly whatsappSenderClient: ClientProxy,
    private readonly campaignService: CampaignService,
  ) {}

  onModuleInit() {
    // Clean up finished jobs older than JOB_TTL_MS every 30 minutes
    setInterval(() => {
      const cutoff = Date.now() - JOB_TTL_MS;
      for (const [id, job] of this.jobs) {
        if (job.status === 'done' && job.finishedAt && job.finishedAt < cutoff) {
          this.jobs.delete(id);
        }
      }
    }, 30 * 60 * 1000);
  }

  createJob(sessionId: string, messages: BulkMessage[], userId: number): string {
    const jobId = randomUUID();
    const job: BulkJob = {
      jobId,
      sessionId,
      messages,
      userId,
      status: 'processing',
      total: messages.length,
      done: 0,
      failed: [],
    };
    this.jobs.set(jobId, job);
    this.processJob(job).catch((err) =>
      this.logger.error(`BulkJob ${jobId} crashed: ${err.message}`),
    );
    return jobId;
  }

  getJob(jobId: string): BulkJobStatus | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    const { jobId: id, status, total, done, failed, waitUntil } = job;
    return { jobId: id, status, total, done, failed, waitUntil };
  }

  private isInSendWindow(): boolean {
    const msSinceMidnight = (Date.now() + ARG_OFFSET_MS) % (24 * 3_600_000);
    return (
      msSinceMidnight >= SEND_START_HOUR * 3_600_000 &&
      msSinceMidnight < SEND_END_HOUR * 3_600_000
    );
  }

  private msUntilNextWindow(): number {
    const msSinceMidnight = (Date.now() + ARG_OFFSET_MS) % (24 * 3_600_000);
    const target = SEND_START_HOUR * 3_600_000;
    if (target > msSinceMidnight) return target - msSinceMidnight;
    return 24 * 3_600_000 - msSinceMidnight + target;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async processJob(job: BulkJob): Promise<void> {
    for (let i = 0; i < job.messages.length; i++) {
      // Wait if outside send window
      while (!this.isInSendWindow()) {
        const ms = this.msUntilNextWindow();
        job.status = 'waiting';
        job.waitUntil = new Date(Date.now() + ms).toISOString();
        this.logger.log(
          `BulkJob ${job.jobId} paused — outside send window. Resuming in ${Math.round(ms / 60_000)} min`,
        );
        await this.sleep(Math.min(30_000, ms));
      }
      job.status = 'processing';
      job.waitUntil = undefined;

      const { phone, message } = job.messages[i];

      try {
        await firstValueFrom(
          this.whatsappSenderClient
            .send(
              { cmd: 'whatsapp_sender_send_message' },
              { sessionId: job.sessionId, phone, message },
            )
            .pipe(catchError((err) => { throw err; })),
        );
        this.logger.log(`BulkJob ${job.jobId} [${i + 1}/${job.total}] sent to ${phone}`);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Error desconocido';
        job.failed.push({ phone, error });
        this.logger.warn(`BulkJob ${job.jobId} [${i + 1}/${job.total}] failed for ${phone}: ${error}`);
      }

      job.done = i + 1;

      // 40-second delay between messages (not after the last one)
      if (i < job.messages.length - 1) {
        await this.sleep(DELAY_BETWEEN_MS);
      }
    }

    job.status = 'done';
    job.finishedAt = Date.now();
    this.logger.log(
      `BulkJob ${job.jobId} complete — ${job.done - job.failed.length} sent, ${job.failed.length} failed`,
    );

    try {
      await this.campaignService.create({
        sessionId: job.sessionId,
        total: job.total,
        sent: job.done - job.failed.length,
        failed: job.failed.length,
        failedDetails: job.failed,
        userId: job.userId,
        finishedAt: new Date(),
      });
    } catch (err) {
      this.logger.error(`BulkJob ${job.jobId} — failed to persist campaign: ${(err as Error).message}`);
    }
  }
}
