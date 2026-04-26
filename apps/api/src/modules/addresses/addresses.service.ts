import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createAddressDto: CreateAddressDto) {
    return this.prisma.address.create({
      data: {
        ...createAddressDto,
        userId,
      },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You can only access your own addresses');
    }

    return address;
  }

  async update(id: string, userId: string, updateAddressDto: UpdateAddressDto) {
    await this.findOne(id, userId); // verify ownership

    return this.prisma.address.update({
      where: { id },
      data: updateAddressDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // verify ownership

    return this.prisma.address.delete({
      where: { id },
    });
  }
}
