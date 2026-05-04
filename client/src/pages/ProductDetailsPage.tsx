import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { http } from '../api/http';
import { useAppSelector } from '../hooks';
import type { Product } from '../types/product';

type ProductResponse = {
  data: Product;
};

export function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const productQuery = useQuery({
    queryKey: ['product-details', slug],
    queryFn: async () => {
      const response = await http.get<ProductResponse>(`/products/${slug}`);
      return response.data.data;
    },
    enabled: Boolean(slug),
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) {
        navigate('/login');
        return;
      }

      await http.post(
        '/cart',
        { productId: productQuery.data!.id, quantity: 1 },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      navigate('/cart');
    },
  });

  if (productQuery.isPending) {
    return <p>Se incarca produsul...</p>;
  }
  if (productQuery.isError || !productQuery.data) {
    return <p>Produsul nu a fost gasit.</p>;
  }

  const product = productQuery.data;

  return (
    <section className='page product-details'>
      <img src={product.imageUrl} alt={product.name} />
      <div>
        <h1>{product.name}</h1>
        <p className='lead'>{product.description}</p>
        <p>Brand: {product.brand}</p>
        <p>Categorie: {product.category.name}</p>
        <p className='stock'>Stoc disponibil: {product.stock}</p>
        <h2>{Number(product.price).toFixed(2)} RON</h2>
        <button
          className='button'
          type='button'
          onClick={() => addToCartMutation.mutate()}
        >
          Adauga in cos
        </button>
      </div>
    </section>
  );
}
