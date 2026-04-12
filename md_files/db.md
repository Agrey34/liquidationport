CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


# 👤 USERS


CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);



# 📦 PRODUCTS


CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),

  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_products_slug ON products(slug);



# 🗂️ CATEGORIES


CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  created_at TIMESTAMP DEFAULT now()
);



# 🔗 PRODUCT → CATEGORY


ALTER TABLE products
ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX idx_products_category ON products(category_id);



# 🧬 PRODUCT VARIANTS


CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  sku TEXT UNIQUE NOT NULL,

  price NUMERIC(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,

  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);



# 🖼️ PRODUCT MEDIA


CREATE TABLE product_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  alt_text TEXT,
  position INT DEFAULT 0
);

CREATE INDEX idx_media_product ON product_media(product_id);



# ⭐ PRODUCT REVIEWS


CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,

  created_at TIMESTAMP DEFAULT now(),

  UNIQUE(product_id, user_id)
);



# 🛒 CARTS


CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMP DEFAULT now()
);



# 🛒 CART ITEMS


CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id),

  quantity INT NOT NULL CHECK (quantity > 0),

  UNIQUE(cart_id, variant_id)
);



# 📦 ORDERS


CREATE TYPE order_status AS ENUM (
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id),

  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status order_status DEFAULT 'pending',

  currency TEXT DEFAULT 'USD',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);



# 🧾 ORDER ITEMS (CRITICAL DESIGN)


CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  variant_id UUID REFERENCES product_variants(id),

  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,

  quantity INT NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0)
);



# 💳 PAYMENTS


CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  provider TEXT NOT NULL,
  provider_id TEXT, -- Stripe payment_intent id

  amount NUMERIC(10,2) NOT NULL,
  status payment_status DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT now()
);



# 🚚 SHIPMENTS


CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  carrier TEXT,
  tracking TEXT,

  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP
);



# 🏠 ADDRESSES


CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  country TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  address_line TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT now()
);



# 🎟️ COUPONS


CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  code TEXT UNIQUE NOT NULL,
  discount NUMERIC(10,2) NOT NULL,

  type coupon_type NOT NULL,

  expires_at TIMESTAMP,
  usage_limit INT,

  created_at TIMESTAMP DEFAULT now()
);



# 🎟️ COUPON USAGE


CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  used_at TIMESTAMP DEFAULT now(),

  UNIQUE(coupon_id, user_id)
);



# ❤️ WISHLIST


CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE
);



# ❤️ WISHLIST ITEMS


CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  UNIQUE(wishlist_id, product_id)
);


## 🔹 notifications


CREATE TYPE notification_type AS ENUM (
  'order_created',
  'order_paid',
  'order_shipped',
  'order_delivered',
  'system',
  'promotion'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  is_read BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);




## 🔹 notification_logs (for email/SMS tracking)


CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,

  channel TEXT NOT NULL, -- email, sms, push
  status TEXT NOT NULL,  -- sent, failed

  error TEXT,

  sent_at TIMESTAMP DEFAULT now()
);


👉 This helps you debug failed emails (VERY useful in production)



# 📦 2. INVENTORY (IMPROVED VERSION)


CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  variant_id UUID UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,

  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),

  updated_at TIMESTAMP DEFAULT now()
);


👉 Logic in backend:

text
available = quantity - reserved




# 🧾 3. ORDER STATUS HISTORY (VERY IMPORTANT)


CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  status order_status NOT NULL,
  note TEXT,

  created_at TIMESTAMP DEFAULT now()

);


# 💳 4. PAYMENT EVENTS (Stripe/Webhooks tracking)


CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL, -- payment_intent.succeeded
  payload JSONB NOT NULL,

  created_at TIMESTAMP DEFAULT now()
);


👉 Critical for:

* debugging webhook issues
* replaying events



# 🧑‍💼 5. ADMIN USERS (separate from customers)

CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,

  role TEXT DEFAULT 'admin',

  created_at TIMESTAMP DEFAULT now()
);


# 🧠 6. AUDIT LOGS (VERY PROFESSIONAL FEATURE)


CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  admin_id UUID REFERENCES admins(id),

  action TEXT NOT NULL,
  entity TEXT NOT NULL, -- product, order, user
  entity_id UUID,

  metadata JSONB,

  created_at TIMESTAMP DEFAULT now()
);


# 🚚 7. SHIPPING METHODS (optional but useful)


CREATE TABLE shipping_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,

  estimated_days INT
);




# 🌍 8. SETTINGS TABLE (for flexibility)


CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);


# ⭐ 9. PRODUCT TAGS (for better filtering)

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE product_tags (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (product_id, tag_id)
);



