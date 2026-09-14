import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { CleanupTask } from './cleanup.task';
import { OutboxProcessorTask } from './outbox-processor.task';

/**
 * TasksModule
 *
 * Registers all recurring background tasks (cron jobs).
 * Uses @nestjs/schedule for cron management.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
  ],
  providers: [CleanupTask, OutboxProcessorTask],
})
export class TasksModule {}
