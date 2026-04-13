# 🌐 1. API DESIGN (REST – Production Ready)

**Architecture:** Hybrid Supabase + NestJS
- **Supabase:** Handles authentication, user management, file storage, real-time subscriptions
- **NestJS:** Handles complex business logic, transactions, payments, external integrations

you can always improve the API design as you go, I AM open to suggestions
-----------------------------------------------------------------------------------------------------------
---------------------------------------------- 🔐 AUTH ---------------------------------------------------
-----------------------------------------------------------------------------------------------------------

**Handled by Supabase Auth** (JWT tokens stored in HttpOnly cookies)

http id="a1"
/auth/login           POST      (Supabase: email/password, OAuth providers)
/auth/register        POST      (Supabase: creates user in auth.users)
/auth/logout          POST      (Supabase: invalidates session)
/auth/me              GET       (NestJS: validates JWT, fetches user profile from DB)
/auth/refresh         POST      (Supabase: refreshes access token)


-----------------------------------------------------------------------------------------------------------
----------------------------------------- 👤 USERS (Admin) ------------------------------------------------
-----------------------------------------------------------------------------------------------------------

**Note:** User auth data lives in Supabase `auth.users`, profile data in public `users` table

http id="a2"
/users                GET       (NestJS: fetches from public.users, joins with auth metadata)
/users/:id            GET       (NestJS: fetches user profile)
/users/:id            PATCH     (NestJS: updates profile; Supabase handles email/password changes)
/users/:id            DELETE    (NestJS: soft deletes profile; Supabase handles auth deletion)


-----------------------------------------------------------------------------------------------------------
---------------------------------------------- 📦 PRODUCTS ------------------------------------------------
-----------------------------------------------------------------------------------------------------------

**Note:** Product images stored in Supabase Storage bucket `product-media`

http id="a3"
/products             GET       (NestJS: fetches with variants, categories, media URLs from Supabase)
/products/:id         GET       (NestJS: full product details with stock info)
/products             POST      (admin) (NestJS: creates product; uploads images to Supabase Storage)
/products/:id         PATCH     (admin) (NestJS: updates product; manages media in Supabase)
/products/:id         DELETE    (admin) (NestJS: soft deletes product)


-----------------------------------------------------------------------------------------------------------
---------------------------------------- 🧬 VARIANTS ------------------------------------------------------
-----------------------------------------------------------------------------------------------------------

http id="a4"
/products/:id/variants        GET
/products/:id/variants        POST
/products/variants/:id        PATCH
/products/variants/:id        DELETE


-----------------------------------------------------------------------------------------------------------
------------------------------------------------ 🛒 CART --------------------------------------------------
-----------------------------------------------------------------------------------------------------------

**Note:** Cart can be stored in PostgreSQL (authenticated users) or Redis/cookie (guests)

http id="a5"
/cart                 GET       (NestJS: fetches user cart from DB)
/cart/items           POST      (NestJS: adds item; validates product/variant exists)
/cart/items/:id       PATCH     (NestJS: updates quantity; validates stock)
/cart/items/:id       DELETE    (NestJS: removes item from cart)


-----------------------------------------------------------------------------------------------------------
--------------------------------------------- 📦 ORDERS --------------------------------------------------
-----------------------------------------------------------------------------------------------------------

**CRITICAL:** All order operations use `prisma.$transaction` with price snapshotting

http id="a6"
/orders               POST      (NestJS: checkout; validates stock; snapshots prices; creates order)
/orders               GET       (NestJS: fetches user's order history)
/orders/:id           GET       (NestJS: fetches single order with items and status)

-----------------------------------------------------------------------------------------------------------
-------------------------------------- Admin: ------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------

http id="a7"
/admin/orders         GET       (NestJS: fetches all orders with filters)
/admin/orders/:id     PATCH     (NestJS: updates order status; triggers events)
/admin/products       POST      (NestJS: creates product with variants)
/admin/users          GET       (NestJS: fetches users with role filters)


-----------------------------------------------------------------------------------------------------------
----------------------------------------- 💳 PAYMENTS ----------------------------------------------------
-----------------------------------------------------------------------------------------------------------

**Note:** Stripe integration handled entirely by NestJS; webhooks verified with signature

http id="a8"
/payments/intent      POST      (NestJS: creates Stripe PaymentIntent with server-side price)
/payments/webhook     POST      (NestJS: Stripe webhook; verifies signature; updates order status)

Using:
- Stripe (Payment Intents API)
- Supabase Edge Functions (optional: can handle lightweight webhook forwarding)

-----------------------------------------------------------------------------------------------------------
------------------------------------------🔔 NOTIFICATIONS ------------------------------------------------
-----------------------------------------------------------------------------------------------------------

**Note:** Real-time notifications via Supabase Realtime subscriptions; storage in PostgreSQL

http id="a9"
/notifications        GET       (NestJS: fetches user notifications from DB)
/notifications/:id    PATCH     (NestJS: marks as read; emits realtime update via Supabase)

**Realtime:** Frontend subscribes to Supabase Realtime channel `notifications:user_id={uuid}`


-----------------------------------------------------------------------------------------------------------
----------------------------------------------------------🎟️ COUPONS
-----------------------------------------------------------------------------------------------------------

http id="a10"
/coupons              GET       (NestJS: validates coupon code; returns discount details)
/coupons/apply        POST      (NestJS: applies coupon to cart/order; validates rules)


========================== 🧠 2. ORDER SERVICE (THE HEART OF YOUR SYSTEM) ===================================

This is the "most important code you will write".

**Architecture Note:** Order service runs in NestJS with direct PostgreSQL connection via Prisma
to Supabase-hosted database. All operations use transactions.

-----------------------------------------------------------------------------------------------------------
-------------------------------------------- Key rules ----------------------------------------------------
-----------------------------------------------------------------------------------------------------------

- NEVER trust frontend
- ALWAYS use transactions
- ALWAYS snapshot price
- ALWAYS validate stock


==================================== Order Service Logic (NestJS style) ======================================

ts id="b1"
async createOrder(userId: string, items: CreateOrderDto[]) {
  return this.prisma.$transaction(async (tx) => {

    // 1. Fetch variants
    const variantIds = items.map(i => i.variantId);

    const variants = await tx.product_variants.findMany({
      where: { id: { in: variantIds } }
    });

    // 2. Validate stock
    for (const item of items) {
      const variant = variants.find(v => v.id === item.variantId);

      if (!variant) throw new Error('Variant not found');

      if (variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${variant.sku}`);
      }
    }

    // 3. Calculate total
    let total = 0;

    const orderItemsData = items.map(item => {
      const variant = variants.find(v => v.id === item.variantId);

      const price = variant.price;
      total += price * item.quantity;

      return {
        variant_id: variant.id,
        quantity: item.quantity,
        price,
        product_name: variant.sku,
        sku: variant.sku
      };
    });

    // 4. Create order
    const order = await tx.orders.create({
      data: {
        user_id: userId,
        total,
        status: 'pending',
        items: {
          create: orderItemsData
        }
      },
      include: { items: true }
    });

    // 5. Update stock
    for (const item of items) {
      await tx.product_variants.update({
        where: { id: item.variantId },
        data: {
          stock: { decrement: item.quantity }
        }
      });
    }

    return order;
  });
}



========================================== 3. PAYMENT FLOW (Stripe) ==========================================

-----------------------------------------------------------------------------------------------------------
-----------------------------------Step 1: Create payment intent
-----------------------------------------------------------------------------------------------------------

ts id="b2"
async createPaymentIntent(orderId: string) {
  const order = await this.ordersService.findById(orderId);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.total * 100,
    currency: 'usd',
    metadata: { orderId }
  });

  return paymentIntent;
}


-----------------------------------------------------------------------------------------------------------
-------------------------------------------Step 2: Webhook (CRITICAL)
-----------------------------------------------------------------------------------------------------------

ts id="b3"
async handleWebhook(event: any) {
  if (event.type === 'payment_intent.succeeded') {
    const orderId = event.data.object.metadata.orderId;

    await this.ordersService.updateStatus(orderId, 'paid');

    // trigger event
    this.eventEmitter.emit('order.paid', { orderId });
  }
}


=================================== 4. EVENT SYSTEM (CLEAN ARCHITECTURE) ===================================

-----------------------------------------------------------------------------------------------------------
----------------------------------------------------------Example: Order Paid Event
-----------------------------------------------------------------------------------------------------------

ts id="b4"
@OnEvent('order.paid')
async handleOrderPaid(event: { orderId: string }) {
  await this.notificationsService.create({
    type: 'order_paid',
    message: `Order ${event.orderId} has been paid`
  });

  await this.auditService.log({
    action: 'ORDER_PAID',
    entity: 'order',
    entityId: event.orderId
  });
}



================================= 5. Notification Trigger Example =======================================

ts id="b5"
async createNotification(userId: string, message: string) {
  return this.prisma.notifications.create({
    data: {
      user_id: userId,
      message,
      type: 'order_created'
    }
  });
}



================================= 6. How Everything Connects =======================================

text id="b6"
User → Checkout
   ↓
Order Service (transaction)
   ↓
Order Created
   ↓
Payment Intent (Stripe)
   ↓
Webhook
   ↓
Order Paid
   ↓
Event Triggered
   ↓
Notifications + Audit Logs



