import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { DatabaseModule } from '../../database/database.module';
import { GuestSessionsModule } from '../guest-sessions/guest-sessions.module';

@Module({
  imports: [DatabaseModule, GuestSessionsModule],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
