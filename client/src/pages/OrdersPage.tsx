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

  if (ordersQuery.isLoading) return <p>Se incarca comenzile...</p>;
  if (ordersQuery.isError || !ordersQuery.data) return <p>Nu am putut incarca comenzile.</p>;

  return (
    <section className='page'>
      <div className='admin-header'>
        <div>
          <h1>Istoric comenzi</h1>
          <p className='lead'>Vezi detaliile comenzilor tale si produsele comandate.</p>
        </div>
      </div>
      {ordersQuery.data.length === 0 ? (
        <p>Nu exista comenzi momentan.</p>
      ) : (
        <div className='order-history'>
          {ordersQuery.data.map((order) => (
            <article className='order-card order-card-large' key={order.id}>
              <header className='order-card-header'>
                <div>
                  <span className='order-label'>Comanda</span>
                  <h2>#{order.id}</h2>
                </div>
                <div className='order-card-meta'>
                  <span className='order-status'>{order.status}</span>
                  <span className='order-date'>
                    {new Date(order.createdAt).toLocaleDateString('ro-RO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </header>

              <section className='order-summary'>
                <div>
                  <strong>Total comandă</strong>
                  <p>{Number(order.totalAmount).toFixed(2)} RON</p>
                </div>
                <div>
                  <strong>Produse</strong>
                  <p>{order.orderItems.length}</p>
                </div>
                <div>
                  <strong>Adresa livrare</strong>
                  <p>{order.shippingAddress}</p>
                </div>
              </section>

              <section className='order-items'>
                <h3>Produse comandate</h3>
                {order.orderItems.map((item) => (
                  <article className='order-item' key={item.id}>
                    <img src={item.product.imageUrl} alt={item.product.name} />
                    <div className='order-item-details'>
                      <strong>{item.product.name}</strong>
                      <span>Cantitate: {item.quantity}</span>
                      <span>Pret unitar: {Number(item.unitPrice).toFixed(2)} RON</span>
                    </div>
                    <div className='order-item-total'>
                      {(Number(item.unitPrice) * item.quantity).toFixed(2)} RON
                    </div>
                  </article>
                ))}
              </section>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
