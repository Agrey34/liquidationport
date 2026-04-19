export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid' | 'refunded' | 'failed';

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  imageColor: string;
}

export interface OrderActivity {
  action: string;
  status: OrderStatus | 'payment';
  timestamp: string;
  actor: string;
  note?: string;
}

export interface AppOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  trackingNumber?: string;
  activity: OrderActivity[];
}

export type SortKey = 'id' | 'createdAt' | 'customerName' | 'total' | 'status' | 'paymentStatus';
export type SortDir = 'asc' | 'desc';
export type TabFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'attention';
