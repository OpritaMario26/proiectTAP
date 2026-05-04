import type { Product } from './product';

export type CartItem = {
  id: number;
  quantity: number;
  product: Product;
};
