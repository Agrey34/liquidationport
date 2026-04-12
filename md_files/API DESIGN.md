# 🌐 1. API DESIGN (REST – Production Ready)

you can always improve the API design as you go, I AM open to suggestions
-----------------------------------------------------------------------------------------------------------
---------------------------------------------- 🔐 AUTH ---------------------------------------------------
-----------------------------------------------------------------------------------------------------------

http id="a1"
/auth/register        POST
/auth/login           POST
/auth/refresh         POST
/auth/me              GET


-----------------------------------------------------------------------------------------------------------
----------------------------------------- 👤 USERS (Admin) ------------------------------------------------
-----------------------------------------------------------------------------------------------------------

http id="a2"
/users                GET
/users/:id            GET
/users/:id            PATCH
/users/:id            DELETE


-----------------------------------------------------------------------------------------------------------
---------------------------------------------- 📦 PRODUCTS ------------------------------------------------
-----------------------------------------------------------------------------------------------------------

http id="a3"
/products             GET
/products/:id         GET
/products             POST      (admin)
/products/:id         PATCH     (admin)
/products/:id         DELETE    (admin)


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

http id="a5"
/cart                 GET
/cart/items           POST      (add item)
/cart/items/:id       PATCH     (update qty)
/cart/items/:id       DELETE


-----------------------------------------------------------------------------------------------------------
--------------------------------------------- 📦 ORDERS --------------------------------------------------
-----------------------------------------------------------------------------------------------------------

http id="a6"
/orders               POST      (checkout)
/orders               GET       (user orders)
/orders/:id           GET

-----------------------------------------------------------------------------------------------------------
-------------------------------------- Admin: ------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------

http id="a7"
/admin/orders         GET
/admin/orders/:id     PATCH     (update status)


-----------------------------------------------------------------------------------------------------------
----------------------------------------- 💳 PAYMENTS ----------------------------------------------------
-----------------------------------------------------------------------------------------------------------

http id="a8"
/payments/intent      POST
/payments/webhook     POST   (Stripe webhook)


Using:

- Stripe

-----------------------------------------------------------------------------------------------------------
------------------------------------------🔔 NOTIFICATIONS ------------------------------------------------
-----------------------------------------------------------------------------------------------------------

http id="a9"
/notifications        GET
/notifications/:id    PATCH   (mark as read)


-----------------------------------------------------------------------------------------------------------
----------------------------------------------------------🎟️ COUPONS
-----------------------------------------------------------------------------------------------------------

http id="a10"
/coupons              GET
/coupons/apply        POST


========================== 🧠 2. ORDER SERVICE (THE HEART OF YOUR SYSTEM) ===================================

This is the "most important code you will write".

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



