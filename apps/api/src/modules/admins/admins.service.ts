import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateAdminDto } from './dto/admin.dto';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto) {
    await this.findOne(id);
    return this.prisma.admin.update({
      where: { id },
      data: updateAdminDto,
    });
  }

  async getDashboardStats() {
    const [
      orders,
      activeProductsCount,
      totalUsersCount,
      recentOrdersRaw,
    ] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          payment: { select: { status: true } },
        }
      }),
      this.prisma.product.count({
        where: { deletedAt: null }
      }),
      this.prisma.user.count({
        where: { deletedAt: null }
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
          payment: { select: { status: true } },
        }
      }),
    ]);

    // Calculate Total Revenue
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled' && o.payment?.status !== 'failed')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Calculate Pending Orders
    const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

    // Format Recent Orders
    const recentOrders = recentOrdersRaw.map((order) => {
      const email = order.user?.email || 'Customer';
      const customer = email.includes('@') ? email.split('@')[0].replace(/[._-]/g, ' ') : 'Customer';
      
      const now = new Date();
      const orderDate = new Date(order.createdAt);
      const isToday = now.toDateString() === orderDate.toDateString();
      
      const dateStr = isToday
        ? `Today, ${orderDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
        : orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      // Capitalize status for badge display
      const statusCap = order.status.charAt(0).toUpperCase() + order.status.slice(1);

      return {
        id: order.id,
        customer,
        date: dateStr,
        amount: `$${Number(order.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status: statusCap === 'Paid' ? 'Completed' : statusCap,
      };
    });

    return {
      kpis: [
        {
          title: 'Total Revenue',
          value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          trend: '+20.1%',
          isPositive: true,
          icon: 'fi fi-rr-dollar',
        },
        {
          title: 'Active Pallets',
          value: activeProductsCount.toString(),
          trend: '+12.5%',
          isPositive: true,
          icon: 'fi fi-rr-box',
        },
        {
          title: 'Registered Users',
          value: totalUsersCount.toString(),
          trend: '+5.4%',
          isPositive: true,
          icon: 'fi fi-rr-users',
        },
        {
          title: 'Pending Orders',
          value: pendingOrdersCount.toString(),
          trend: pendingOrdersCount > 0 ? `+${pendingOrdersCount}` : '0',
          isPositive: pendingOrdersCount === 0,
          icon: 'fi fi-rr-shopping-bag',
        },
      ],
      recentOrders,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.admin.delete({
      where: { id },
    });
  }
}

