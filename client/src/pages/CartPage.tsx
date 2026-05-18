import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { http } from '../api/http';
import { useAppSelector } from '../hooks';
import type { CartItem } from '../types/cart';

type CartResponse = { data: CartItem[] };

export function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await http.get<CartResponse>('/cart', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.data;
    },
    enabled: Boolean(accessToken),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      await http.put(
        `/cart/${productId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      await http.delete(`/cart/${productId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (!accessToken) {
    return (
      <section className='page'>
        <h1>Cosul tau</h1>
        <p>Trebuie sa fii autentificat pentru a vedea cosul.</p>
        <Link className='button' to='/login'>
          Login
        </Link>
      </section>
    );
  }

  if (cartQuery.isLoading) {
    return <p>Se incarca cosul...</p>;
  }
  if (cartQuery.isError || !cartQuery.data) {
    return <p>Nu am putut incarca cosul.</p>;
  }

  const total = cartQuery.data.reduce(
    (acc, item) => acc + Number(item.product.price) * item.quantity,
    0,
  );

  return (
    <section className='page'>
      <h1>Cosul tau</h1>
      {cartQuery.data.length === 0 ? (
        <p>Cosul este gol.</p>
      ) : (
        <>
          <div className='cart-list'>
            {cartQuery.data.map((item) => (
              <article key={item.id} className='cart-item'>
                <img src={item.product.imageUrl} alt={item.product.name} />
                <div>
                  <h3>{item.product.name}</h3>
                  <p>{Number(item.product.price).toFixed(2)} RON / buc</p>
                  <div className='cart-actions'>
                    <button
                      type='button'
                      onClick={() =>
                        updateMutation.mutate({
                          productId: item.product.id,
                          quantity: Math.max(item.quantity - 1, 0),
                        })
                      }
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type='button'
                      onClick={() =>
                        updateMutation.mutate({
                          productId: item.product.id,
                          quantity: item.quantity + 1,
                        })
                      }
                    >
                      +
                    </button>
                    <button type='button' onClick={() => deleteMutation.mutate(item.product.id)}>
                      Sterge
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <h2>Total: {total.toFixed(2)} RON</h2>
          <button className='button' type='button' onClick={() => navigate('/checkout')}>
            Continua la checkout
          </button>
        </>
      )}
    </section>
  );
}
