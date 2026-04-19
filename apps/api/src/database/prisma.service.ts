import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Pass robust pool configurations securely via the constructor block if not natively bounded in the URL
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Note: Due to Prisma 5.x lifecycle deprecations this requires casting or native NestJS shutdown overrides
    // For Vercel/Serverless we map safe disconnects.
    process.on('beforeExit', () => {
      app.close();
    });
  }
}
