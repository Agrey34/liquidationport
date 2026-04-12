

# 🗄️ 2. PostgreSQL Schema (Production-ready)

Using **PostgreSQL**

## 🔹 users

```sql id="p3"
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔹 products

```sql id="p4"
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  stock INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔹 orders

```sql id="p5"
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔹 order_items

```sql id="p6"
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  price NUMERIC(10,2) NOT NULL
);
```

---

## 🔥 Important production upgrades

Add later:

* `updated_at`
* `deleted_at` (soft delete)
* indexes on:

  * `user_id`
  * `order_id`

---

# 🛒 3. Orders Flow (MOST IMPORTANT PART)

This is where your system becomes “real”.

---

## 🧠 Step-by-step Order Creation

### Step 1: User clicks checkout

Frontend (**Next.js**) sends:

```json id="p7"
{
  "items": [
    { "productId": "uuid", "quantity": 2 }
  ]
}
```

---

## Step 2: Backend (NestJS Orders Service)

### 🔥 Use a DB TRANSACTION

```sql id="p8"
BEGIN;
```

---

### Step 3: Validate products

* Check product exists
* Check stock available

---

### Step 4: Calculate total price

👉 NEVER trust frontend price

---

### Step 5: Create order

```sql id="p9"
INSERT INTO orders (...)
```

---

### Step 6: Create order items

```sql id="p10"
INSERT INTO order_items (...)
```

---

### Step 7: Update stock

```sql id="p11"
UPDATE products
SET stock = stock - quantity
```

---

### Step 8: Commit

```sql id="p12"
COMMIT;
```

---

## ❌ If anything fails:

```sql id="p13"
ROLLBACK;
```

---

# 💳 4. Payment Flow (Stripe later)

Using:

* Stripe

Flow:

1. Create order (status = `pending`)
2. Create Stripe payment intent
3. User pays
4. Stripe webhook → backend
5. Update order → `paid`

---

# 🔐 5. Auth Flow

* Login → returns JWT
* Protect routes:

  * `/admin/*` → admin only
  * `/orders` → logged-in users

---

# 🧑‍💼 6. Admin Panel (Next.js)

Routes:

```id="p14"
/admin/products
/admin/orders
/admin/users
```

Features:

* Create/edit product
* View orders
* Change order status

---

# ⚠️ Critical Production Rules

## 🔴 1. Never trust frontend

* price
* stock
* payment status

---

## 🔴 2. Always use transactions for orders

---

## 🔴 3. Snapshot product price

Store price in `order_items`

---

## 🔴 4. Keep modules isolated

Orders should NOT directly depend on Products logic

---

# 🚀 What to build FIRST (important)

## Phase 1

* Products API
* Products UI

## Phase 2

* Auth system

## Phase 3

* Admin panel

## Phase 4

* Orders system

## Phase 5

* Payments

---

# 💡 Final note

You are not just coding — you’re designing a **real backend system**.

If you do this right:
👉 You can scale it
👉 You can split into microservices later
👉 You can reuse this in future projects

---

# 👍 Next step (tell me)

I can now give you:

* 🔧 Full NestJS starter code (auth + products)
* 🧱 Prisma or TypeORM setup
* 🔄 Stripe integration code
* 🎯 API endpoints list

J