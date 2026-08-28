import { Controller, Get, HttpStatus, Res, ServiceUnavailableException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Liveness probe: Confirms the process is running.
   * Does NOT depend on external systems or database.
   */
  @Get('live')
  getLiveness() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe: Verifies critical internal dependencies (PostgreSQL via Prisma).
   */
  @Get('ready')
  async getReadiness(@Res({ passthrough: true }) res: Response) {
    try {
      // Bounded 3-second database ping
      const dbPingPromise = this.prisma.$queryRaw`SELECT 1`;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database ping timed out')), 3000)
      );

      await Promise.race([dbPingPromise, timeoutPromise]);

      return {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Database check failed';
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: errMsg,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
