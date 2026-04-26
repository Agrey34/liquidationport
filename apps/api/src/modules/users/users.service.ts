import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findProfile(userId: string) {
    // Upsert the user to ensure they exist in our DB if they signed up via Supabase
    // But since the frontend uses Supabase Auth, they might not be in our DB yet until they perform an action
    // In a real app, you'd use a Supabase Auth Trigger to sync users to the public.users table.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        orders: { take: 5, orderBy: { createdAt: 'desc' } }, // last 5 orders
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found in database');
    }

    return user;
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
