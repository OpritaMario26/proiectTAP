import { useQuery } from '@tanstack/react-query';

import { http } from '../api/http';
import type { Product } from '../types/product';

type ProductsResponse = {
  data: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

async function fetchProducts() {
  const response = await http.get<ProductsResponse>('/products');
  return response.data;
}

export function ProductsPage() {
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  if (productsQuery.isPending) {
    return <p>Se incarca produsele...</p>;
  }

  if (productsQuery.isError) {
    return <p>Nu am putut incarca produsele momentan.</p>;
  }

  return (
    <section className='page'>
      <h1>Produse</h1>
      <p className='lead'>
        Total produse: {productsQuery.data.pagination.total}
      </p>
      <div className='products-grid'>
        {productsQuery.data.data.map((product) => (
          <article className='card' key={product.id}>
            <img src={product.imageUrl} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.brand}</p>
            <p>{product.category.name}</p>
            <strong>{product.price} RON</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
