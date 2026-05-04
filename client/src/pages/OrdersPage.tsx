import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { http } from '../api/http';
import { useAppSelector } from '../hooks';
import type { Order } from '../types/order';

type OrdersResponse = { data: Order[] };

export function OrdersPage() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await http.get<OrdersResponse>('/orders', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.data;
    },
    enabled: Boolean(accessToken),
  });

  if (!accessToken) {
    return (
      <section className='page'>
        <h1>Comenzile mele</h1>
        <p>Trebuie sa fii autentificat pentru istoric comenzi.</p>
        <Link className='button' to='/login'>
          Login
        </Link>
      </section>
    );
  }

  if (ordersQuery.isPending) return <p>Se incarca comenzile...</p>;
  if (ordersQuery.isError || !ordersQuery.data) return <p>Nu am putut incarca comenzile.</p>;

  return (
    <section className='page'>
      <h1>Istoric comenzi</h1>
      {ordersQuery.data.length === 0 ? (
        <p>Nu exista comenzi momentan.</p>
      ) : (
        <div className='orders-list'>
          {ordersQuery.data.map((order) => (
            <article className='order-card' key={order.id}>
              <h3>Comanda #{order.id}</h3>
              <p>Status: {order.status}</p>
              <p>Total: {Number(order.totalAmount).toFixed(2)} RON</p>
              <p>Adresa: {order.shippingAddress}</p>
              <p>Produse: {order.orderItems.length}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
