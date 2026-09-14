import { Module } from '@nestjs/common';
import { GuestSessionsService } from './guest-sessions.service';
import { GuestSessionsController } from './guest-sessions.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestSessionsController],
  providers: [GuestSessionsService],
  exports: [GuestSessionsService],
})
export class GuestSessionsModule {}
