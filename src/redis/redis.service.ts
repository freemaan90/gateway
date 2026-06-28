// redis/redis.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from 'src/config/env';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  onModuleDestroy() {
    this.client.quit();
  }
}
