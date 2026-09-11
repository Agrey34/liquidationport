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
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        orders: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user && this.supabaseAdmin) {
      try {
        const { data: authData } = await this.supabaseAdmin.auth.admin.getUserById(userId);
        if (authData?.user) {
          const meta = authData.user.user_metadata || {};
          const fullNameParts = (meta.full_name || '').split(' ');
          user = await this.prisma.user.create({
            data: {
              id: userId,
              email: authData.user.email!,
              firstName: meta.first_name || fullNameParts[0] || 'Member',
              lastName: meta.last_name || fullNameParts.slice(1).join(' ') || '',
              buyerType: meta.buyer_type || 'Retail Buyer',
              role: 'customer',
            },
            include: {
              addresses: true,
              orders: { take: 5, orderBy: { createdAt: 'desc' } },
            },
          });
        }
      } catch (e) {
        // ignore error
      }
    }

    if (!user) {
      throw new NotFoundException('User profile not found in database');
    }

    return user;
  }

  async getDashboardOverview(userId: string) {
    // 1. Fetch user from DB or Supabase Auth fallback
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        buyerType: true,
        role: true,
      },
    });

    if (!user) {
      // Auto-provision if authenticated in Supabase but not yet in public.users
      if (this.supabaseAdmin) {
        try {
          const { data: authData } = await this.supabaseAdmin.auth.admin.getUserById(userId);
          if (authData?.user) {
            const meta = authData.user.user_metadata || {};
            const fullNameParts = (meta.full_name || '').split(' ');
            user = await this.prisma.user.create({
              data: {
                id: userId,
                email: authData.user.email!,
                firstName: meta.first_name || fullNameParts[0] || 'Member',
                lastName: meta.last_name || fullNameParts.slice(1).join(' ') || '',
                buyerType: meta.buyer_type || 'Retail Buyer',
                role: 'customer',
              },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                buyerType: true,
                role: true,
              },
            });
          }
        } catch (e) {
          // ignore error
        }
      }
      if (!user) {
        throw new NotFoundException('User profile not found');
      }
    }

    const firstName = user.firstName || user.email.split('@')[0] || 'Member';
    const lastName = user.lastName || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const firstInitial = firstName.trim()[0]?.toUpperCase() || 'U';
    const lastInitial = lastName.trim()[0]?.toUpperCase() || '';
    const initials = `${firstInitial}${lastInitial}` || firstInitial;

    // 2. Parallel Metrics Aggregation
    const [activeOrdersCount, spendAggregate, savedAddressesCount, recentOrder] = await Promise.all([
      // Count of orders where status is NOT delivered and NOT cancelled
      this.prisma.order.count({
        where: {
          userId,
          status: { notIn: ['delivered', 'cancelled'] },
        },
      }),

      // Lifetime spend sum over all completed/active orders
      this.prisma.order.aggregate({
        where: {
          userId,
          status: { in: ['paid', 'processing', 'shipped', 'delivered'] },
        },
        _sum: { total: true },
      }),

      // Saved addresses count
      this.prisma.address.count({
        where: { userId },
      }),

      // Single most recent order
      this.prisma.order.findFirst({
        where: {
          userId,
          status: { not: 'cancelled' },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          shipment: true,
          items: { take: 1 },
        },
      }),
    ]);

    const lifetimeSpendNumber = Number(spendAggregate._sum.total || 0);
    const formattedLifetimeSpend = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(lifetimeSpendNumber);

    // Format recent tracking record if available
    let recentTracking = null;
    if (recentOrder) {
      const orderShortId = recentOrder.id.slice(0, 5).toUpperCase();
      const statusLabels: Record<string, string> = {
        pending: 'Payment Pending',
        paid: 'Payment Confirmed',
        processing: 'Processing at Facility',
        shipped: 'In Transit with Carrier',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
      };

      const baseDate = recentOrder.shipment?.shippedAt || recentOrder.createdAt;
      const estDate = new Date(new Date(baseDate).getTime() + 5 * 24 * 60 * 60 * 1000);
      const formattedDelivery = estDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      recentTracking = {
        orderId: recentOrder.id,
        orderNumber: `#LP-${orderShortId}`,
        status: recentOrder.status,
        statusDisplay: statusLabels[recentOrder.status] || 'Processing at Facility',
        estimatedDelivery: formattedDelivery,
        carrier: recentOrder.shipment?.carrier || 'Freight Logistics',
        trackingNumber: recentOrder.shipment?.tracking || null,
        trackUrl: `/account/orders/${recentOrder.id}`,
      };
    }

    return {
      profile: {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        fullName,
        initials,
        buyerType: user.buyerType || 'Retail Buyer',
      },
      metrics: {
        activeOrdersCount,
        lifetimeSpend: lifetimeSpendNumber,
        formattedLifetimeSpend,
        savedAddressesCount,
      },
      recentTracking,
    };
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user && this.supabaseAdmin) {
      try {
        const { data: authData } = await this.supabaseAdmin.auth.admin.getUserById(userId);
        if (authData?.user) {
          user = await this.prisma.user.create({
            data: {
              id: userId,
              email: authData.user.email!,
              role: 'customer',
            },
          });
        }
      } catch (e) {
        // ignore error
      }
    }

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
