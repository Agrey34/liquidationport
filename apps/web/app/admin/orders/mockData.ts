import { AppOrder } from './types';

export const MOCK_ORDERS: AppOrder[] = [
  {
    id: 'ORD-7652', customerName: 'Liam Johnson', customerEmail: 'liam.johnson@email.com', customerPhone: '+1 (555) 234-7890',
    shippingAddress: '123 Texas Ave, Houston, TX 77001', status: 'pending', paymentStatus: 'paid', paymentMethod: 'Credit Card (Stripe) ending in 4242',
    createdAt: 'Apr 16, 2025 10:30 AM', updatedAt: 'Apr 16, 2025 10:32 AM',
    items: [
      { id: 'ITM-1', name: 'Amazon Customer Returns Pallet – Mixed Electronics', sku: 'ELC-PAL-001', quantity: 1, unitPrice: 1250.00, imageColor: 'bg-blue-600' }
    ],
    subtotal: 1250.00, shipping: 150.00, tax: 115.50, total: 1515.50,
    activity: [
      { action: 'Order Placed', status: 'pending', timestamp: 'Apr 16, 2025 10:30 AM', actor: 'System' },
      { action: 'Payment Processed', status: 'payment', timestamp: 'Apr 16, 2025 10:32 AM', actor: 'Stripe webhook', note: 'pi_3PxxxSucceeded' }
    ],
  },
  {
    id: 'ORD-7651', customerName: 'Olivia Smith', customerEmail: 'olivia.smith@biz.com', customerPhone: '+1 (555) 876-4321',
    shippingAddress: '456 Business Blvd, New York, NY 10001', status: 'processing', paymentStatus: 'paid', paymentMethod: 'Wire Transfer',
    createdAt: 'Apr 15, 2025 2:15 PM', updatedAt: 'Apr 15, 2025 4:00 PM',
    items: [
      { id: 'ITM-2', name: 'Home & Garden Liquidation Lot', sku: 'HMG-LOT-002', quantity: 2, unitPrice: 480.00, imageColor: 'bg-emerald-600' },
      { id: 'ITM-3', name: 'Office Furniture Customer Returns', sku: 'OFC-RTN-009', quantity: 1, unitPrice: 1800.00, imageColor: 'bg-indigo-600' }
    ],
    subtotal: 2760.00, shipping: 300.00, tax: 252.98, total: 3312.98,
    activity: [
      { action: 'Order Placed', status: 'pending', timestamp: 'Apr 15, 2025 2:15 PM', actor: 'System' },
      { action: 'Wire Transfer Verified', status: 'payment', timestamp: 'Apr 15, 2025 3:30 PM', actor: 'Admin (Noah)' },
      { action: 'Order marked as processing', status: 'processing', timestamp: 'Apr 15, 2025 4:00 PM', actor: 'Admin (Noah)', note: 'Pallets reserved in NY warehouse.' }
    ],
  },
  {
    id: 'ORD-7650', customerName: 'Noah Williams', customerEmail: 'noah.w@example.net',
    shippingAddress: '789 Lake Pkwy, Chicago, IL 60601', status: 'shipped', paymentStatus: 'paid', paymentMethod: 'Credit Card', trackingNumber: '1Z9999999999999999',
    createdAt: 'Apr 14, 2025 9:00 AM', updatedAt: 'Apr 15, 2025 10:00 AM',
    items: [
      { id: 'ITM-4', name: 'Toy & Games Seasonal Clearance Lot', sku: 'TOY-LOT-005', quantity: 1, unitPrice: 210.00, imageColor: 'bg-orange-500' }
    ],
    subtotal: 210.00, shipping: 75.00, tax: 19.43, total: 304.43,
    activity: [
      { action: 'Order Placed', status: 'pending', timestamp: 'Apr 14, 2025 9:00 AM', actor: 'System' },
      { action: 'Payment Processed', status: 'payment', timestamp: 'Apr 14, 2025 9:01 AM', actor: 'Stripe webhook' },
      { action: 'Shipped via UPS Freight', status: 'shipped', timestamp: 'Apr 15, 2025 10:00 AM', actor: 'Warehouse API', note: 'Tracking: 1Z9999999999999999' }
    ],
  },
  {
    id: 'ORD-7649', customerName: 'Emma Brown', customerEmail: 'emma.b@liquidco.com',
    shippingAddress: '321 Palm Beach, Los Angeles, CA 90001', status: 'cancelled', paymentStatus: 'refunded', paymentMethod: 'PayPal',
    createdAt: 'Apr 13, 2025 11:30 AM', updatedAt: 'Apr 14, 2025 8:00 AM',
    items: [
      { id: 'ITM-5', name: 'Clothing & Apparel Overstock Bundle', sku: 'APP-BND-003', quantity: 5, unitPrice: 320.00, imageColor: 'bg-purple-600' }
    ],
    subtotal: 1600.00, shipping: 250.00, tax: 148.00, total: 1998.00,
    activity: [
      { action: 'Order Placed', status: 'pending', timestamp: 'Apr 13, 2025 11:30 AM', actor: 'System' },
      { action: 'Payment Processed', status: 'payment', timestamp: 'Apr 13, 2025 11:31 AM', actor: 'PayPal webhook' },
      { action: 'Order Cancelled', status: 'cancelled', timestamp: 'Apr 14, 2025 8:00 AM', actor: 'Customer', note: 'Customer requested cancellation.' },
      { action: 'Payment Refunded', status: 'payment', timestamp: 'Apr 14, 2025 8:05 AM', actor: 'Admin (Noah)' }
    ],
  },
  {
    id: 'ORD-7648', customerName: 'Isabella Anderson', customerEmail: 'isabella.a@resellers.net',
    shippingAddress: '555 Pine St, Seattle, WA 98101', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'Credit Card', trackingNumber: '9400100000000000000000',
    createdAt: 'Apr 10, 2025 3:45 PM', updatedAt: 'Apr 14, 2025 2:00 PM',
    items: [
      { id: 'ITM-6', name: 'Audio & Headphones Returns Pallet', sku: 'AUD-PAL-011', quantity: 1, unitPrice: 670.00, imageColor: 'bg-violet-600' }
    ],
    subtotal: 670.00, shipping: 90.00, tax: 61.98, total: 821.98,
    activity: [
      { action: 'Order Placed', status: 'pending', timestamp: 'Apr 10, 2025 3:45 PM', actor: 'System' },
      { action: 'Shipped via LTL', status: 'shipped', timestamp: 'Apr 11, 2025 10:00 AM', actor: 'Warehouse API' },
      { action: 'Delivered', status: 'delivered', timestamp: 'Apr 14, 2025 2:00 PM', actor: 'Carrier webhook' }
    ],
  },
  {
    id: 'ORD-7647', customerName: 'Ethan Garcia', customerEmail: 'ethan.g@stockport.us',
    shippingAddress: '999 Longhorn Blvd, Austin, TX 73301', status: 'pending', paymentStatus: 'failed', paymentMethod: 'Credit Card',
    createdAt: 'Apr 16, 2025 1:20 PM', updatedAt: 'Apr 16, 2025 1:20 PM',
    items: [
      { id: 'ITM-7', name: 'Tool & Hardware Contractor Returns', sku: 'HRD-RTN-006', quantity: 3, unitPrice: 760.00, imageColor: 'bg-stone-600' }
    ],
    subtotal: 2280.00, shipping: 400.00, tax: 210.90, total: 2890.90,
    activity: [
      { action: 'Order Placed', status: 'pending', timestamp: 'Apr 16, 2025 1:20 PM', actor: 'System' },
      { action: 'Payment Failed', status: 'payment', timestamp: 'Apr 16, 2025 1:21 PM', actor: 'Stripe webhook', note: 'Card declined. Insufficient funds.' }
    ],
  },
  {
    id: 'ORD-7646', customerName: 'Ava Jones', customerEmail: 'ava.jones@resale.io',
    shippingAddress: '777 Ocean Dr, Miami, FL 33101', status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'Wire Transfer',
    createdAt: 'Apr 16, 2025 2:00 PM', updatedAt: 'Apr 16, 2025 2:00 PM',
    items: [
      { id: 'ITM-8', name: 'Sports & Outdoors Bulk Lot', sku: 'SPT-BLK-007', quantity: 10, unitPrice: 540.00, imageColor: 'bg-green-600' }
    ],
    subtotal: 5400.00, shipping: 600.00, tax: 499.50, total: 6499.50,
    activity: [
      { action: 'Order Placed', status: 'pending', timestamp: 'Apr 16, 2025 2:00 PM', actor: 'System', note: 'Awaiting WT confirmation.' }
    ],
  }
];
