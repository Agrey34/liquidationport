import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// We make this module @Global() because almost every service in our monorepo 
// (orders, auth, products) will need direct access to the database.
// This prevents us from having to import DatabaseModule into every single Feature Module array.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
