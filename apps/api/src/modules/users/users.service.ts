import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/user.dto';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-600',
    'bg-purple-600',
    'bg-emerald-600',
    'bg-rose-500',
    'bg-orange-500',
    'bg-sky-600',
    'bg-stone-500',
    'bg-teal-600',
    'bg-indigo-600',
    'bg-violet-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

@Injectable()
export class UsersService {
  private supabaseAdmin: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (url && key) {
      this.supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
    }
  }

  async findProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        orders: { take: 5, orderBy: { createdAt: 'desc' } },
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
    // 1. Fetch users from local DB with order totals
    const dbUsers = await this.prisma.user.findMany({
      include: {
        orders: {
          select: {
            total: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch all users from Supabase Auth
    let authUsersMap = new Map<string, any>();
    if (this.supabaseAdmin) {
      try {
        const { data, error } = await this.supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        if (data && data.users) {
          for (const user of data.users) {
            authUsersMap.set(user.id, user);
          }
        }
      } catch (err: any) {
        console.error('Failed to list users from Supabase Auth:', err.message);
      }
    }

    // 3. Fetch recent audit logs for activity mapping
    let auditLogsMap = new Map<string, any[]>();
    try {
      const logs = await this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
      });
      for (const log of logs) {
        if (log.userId) {
          if (!auditLogsMap.has(log.userId)) {
            auditLogsMap.set(log.userId, []);
          }
          const userLogs = auditLogsMap.get(log.userId);
          if (userLogs && userLogs.length < 5) {
            userLogs.push({
              action: `${log.action} ${log.entity}`,
              timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
              ip: log.ipAddress || 'Unknown',
              device: log.userAgent || 'Unknown',
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err.message);
    }

    // 4. Merge data
    return dbUsers.map(dbUser => {
      const authUser = authUsersMap.get(dbUser.id);
      const name = authUser?.user_metadata?.name || authUser?.user_metadata?.full_name || dbUser.email.split('@')[0];
      const verifiedEmail = !!authUser?.email_confirmed_at;
      const lastSeen = authUser?.last_sign_in_at || dbUser.updatedAt.toISOString();
      const phone = authUser?.phone || '';
      
      const orders = dbUser.orders || [];
      const orderCount = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + Number(order.total), 0);

      const activity = auditLogsMap.get(dbUser.id) || [];

      return {
        id: dbUser.id,
        name,
        email: dbUser.email,
        phone,
        location: authUser?.user_metadata?.location || 'Unknown',
        role: dbUser.role,
        status: dbUser.status,
        joinedAt: dbUser.createdAt.toISOString(),
        lastSeen,
        orderCount,
        totalSpent,
        avatarColor: getAvatarColor(name),
        initials: getInitials(name),
        flagged: dbUser.status === 'suspended' || dbUser.status === 'banned',
        verifiedEmail,
        activity,
      };
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async changeStatus(id: string, status: string) {
    await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    if (this.supabaseAdmin) {
      try {
        if (status === 'banned') {
          await this.supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '87600h' });
        } else if (status === 'active') {
          await this.supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: 'none' });
        }
      } catch (err: any) {
        console.error(`Failed to sync ban status to Supabase Auth for ${id}:`, err.message);
      }
    }

    return updated;
  }

  async changeRole(id: string, role: string) {
    await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    if (this.supabaseAdmin) {
      try {
        await this.supabaseAdmin.auth.admin.updateUserById(id, {
          app_metadata: { role },
        });
      } catch (err: any) {
        console.error(`Failed to sync role to Supabase Auth for ${id}:`, err.message);
      }
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'banned' },
    });

    if (this.supabaseAdmin) {
      try {
        await this.supabaseAdmin.auth.admin.deleteUser(id);
      } catch (err: any) {
        console.error(`Failed to delete user in Supabase Auth for ${id}:`, err.message);
      }
    }
  }
}
