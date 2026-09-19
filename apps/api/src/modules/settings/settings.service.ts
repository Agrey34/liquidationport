import { Injectable, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CACHE_SERVICE, ICacheService } from '../../common/cache/cache.interface';
import { UpdateSettingDto } from './dto/setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CACHE_SERVICE) private readonly cacheService?: ICacheService,
  ) {}

  async findAll() {
    const fetcher = () => this.prisma.setting.findMany();
    if (this.cacheService) {
      return this.cacheService.getOrSet('settings:all', fetcher, { ttlSeconds: 600 });
    }
    return fetcher();
  }

  async findOne(key: string) {
    const fetcher = async () => {
      const setting = await this.prisma.setting.findUnique({
        where: { key },
      });
      if (!setting) {
        return { key, value: null };
      }
      return setting;
    };

    if (this.cacheService) {
      return this.cacheService.getOrSet(`settings:${key}`, fetcher, { ttlSeconds: 600 });
    }
    return fetcher();
  }

  async update(key: string, updateSettingDto: UpdateSettingDto) {
    const result = await this.prisma.setting.upsert({
      where: { key },
      update: { value: updateSettingDto.value },
      create: { key, value: updateSettingDto.value },
    });

    if (this.cacheService) {
      await this.cacheService.del('settings:all');
      await this.cacheService.del(`settings:${key}`);
    }

    return result;
  }
}
