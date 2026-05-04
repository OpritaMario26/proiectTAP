import type { Product } from './product';

export type Order = {
  id: number;
  totalAmount: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';
  shippingAddress: string;
  createdAt: string;
  orderItems: Array<{
    id: number;
    quantity: number;
    unitPrice: string;
    product: Product;
  }>;
};
