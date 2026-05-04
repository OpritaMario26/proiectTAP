export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string;
  brand: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
};
