import { Module, Global } from '@nestjs/common';
import { MemoryCacheService } from './memory-cache.service';
import { CACHE_SERVICE } from './cache.interface';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_SERVICE,
      useClass: MemoryCacheService,
    },
    MemoryCacheService,
  ],
  exports: [CACHE_SERVICE, MemoryCacheService],
})
export class CacheModule {}
