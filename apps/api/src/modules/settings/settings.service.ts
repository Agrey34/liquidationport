import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateSettingDto } from './dto/setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.setting.findMany();
  }

  async findOne(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });
    if (!setting) {
      return { key, value: null };
    }
    return setting;
  }

  async update(key: string, updateSettingDto: UpdateSettingDto) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value: updateSettingDto.value },
      create: { key, value: updateSettingDto.value },
    });
  }
}
