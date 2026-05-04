-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELED');

-- CreateTable
CREATE TABLE "public"."USERS" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "refresh_token_hash" TEXT,
    "reset_token_hash" TEXT,
    "reset_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "USERS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CATEGORIES" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CATEGORIES_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PRODUCTS" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PRODUCTS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CART" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CART_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ORDERS" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "shipping_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ORDERS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ORDER_ITEMS" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ORDER_ITEMS_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "USERS_email_key" ON "public"."USERS"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CATEGORIES_slug_key" ON "public"."CATEGORIES"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PRODUCTS_slug_key" ON "public"."PRODUCTS"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CART_user_id_product_id_key" ON "public"."CART"("user_id", "product_id");

-- AddForeignKey
ALTER TABLE "public"."PRODUCTS" ADD CONSTRAINT "PRODUCTS_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."CATEGORIES"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CART" ADD CONSTRAINT "CART_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."USERS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CART" ADD CONSTRAINT "CART_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."PRODUCTS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ORDERS" ADD CONSTRAINT "ORDERS_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."USERS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ORDER_ITEMS" ADD CONSTRAINT "ORDER_ITEMS_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."ORDERS"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ORDER_ITEMS" ADD CONSTRAINT "ORDER_ITEMS_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."PRODUCTS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
