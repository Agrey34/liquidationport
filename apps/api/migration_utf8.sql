-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('order_created', 'order_paid', 'order_shipped', 'order_delivered', 'system', 'promotion');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "rating_avg" DECIMAL(3,2) DEFAULT 0,
    "rating_count" INTEGER DEFAULT 0,
    "category_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tags" (
    "product_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("product_id","tag_id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "position" INTEGER DEFAULT 0,

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "cart_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "currency" TEXT DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL,
    "variant_id" UUID,
    "product_name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "payment_id" UUID,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL,
    "carrier" TEXT,
    "tracking" TEXT,
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_methods" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "estimated_days" INTEGER,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postal_code" TEXT,
    "address_line" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL,
    "type" "CouponType" NOT NULL,
    "expires_at" TIMESTAMP(3),
    "usage_limit" INTEGER,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usage" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "coupon_id" UUID,
    "user_id" UUID,
    "used_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "wishlist_id" UUID,
    "product_id" UUID,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "notification_id" UUID,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sent_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "admin_id" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_slug_idx" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_media_product_id_idx" ON "product_media"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_product_id_user_id_key" ON "product_reviews"("product_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_variant_id_key" ON "cart_items"("cart_id", "variant_id");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_order_id_key" ON "shipments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_variant_id_key" ON "inventory"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usage_coupon_id_user_id_key" ON "coupon_usage"("coupon_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_key" ON "wishlists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_product_id_key" ON "wishlist_items"("wishlist_id", "product_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

