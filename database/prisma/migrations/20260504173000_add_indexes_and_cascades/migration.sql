-- CreateIndex
CREATE INDEX "idx_users_role" ON "public"."USERS"("role");

-- CreateIndex
CREATE INDEX "idx_categories_name" ON "public"."CATEGORIES"("name");

-- CreateIndex
CREATE INDEX "idx_products_category_id" ON "public"."PRODUCTS"("category_id");

-- CreateIndex
CREATE INDEX "idx_products_brand" ON "public"."PRODUCTS"("brand");

-- CreateIndex
CREATE INDEX "idx_products_price" ON "public"."PRODUCTS"("price");

-- CreateIndex
CREATE INDEX "idx_cart_user_id" ON "public"."CART"("user_id");

-- CreateIndex
CREATE INDEX "idx_cart_product_id" ON "public"."CART"("product_id");

-- CreateIndex
CREATE INDEX "idx_orders_user_id" ON "public"."ORDERS"("user_id");

-- CreateIndex
CREATE INDEX "idx_orders_status" ON "public"."ORDERS"("status");

-- CreateIndex
CREATE INDEX "idx_order_items_order_id" ON "public"."ORDER_ITEMS"("order_id");

-- CreateIndex
CREATE INDEX "idx_order_items_product_id" ON "public"."ORDER_ITEMS"("product_id");

-- Update cascades
ALTER TABLE "public"."CART" DROP CONSTRAINT "CART_user_id_fkey";
ALTER TABLE "public"."CART" DROP CONSTRAINT "CART_product_id_fkey";
ALTER TABLE "public"."ORDERS" DROP CONSTRAINT "ORDERS_user_id_fkey";

ALTER TABLE "public"."CART"
ADD CONSTRAINT "CART_user_id_fkey" FOREIGN KEY ("user_id")
REFERENCES "public"."USERS"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."CART"
ADD CONSTRAINT "CART_product_id_fkey" FOREIGN KEY ("product_id")
REFERENCES "public"."PRODUCTS"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ORDERS"
ADD CONSTRAINT "ORDERS_user_id_fkey" FOREIGN KEY ("user_id")
REFERENCES "public"."USERS"("id") ON DELETE CASCADE ON UPDATE CASCADE;
