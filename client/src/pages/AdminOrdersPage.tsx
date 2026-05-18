import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { http } from '../api/http';
import { useAppSelector } from '../hooks';
import type { Order as BaseOrder } from '../types/order';

type AdminOrder = BaseOrder & {
  user: {
    fullName: string;
    email: string;
  };
};

type OrdersResponse = { data: AdminOrder[] };

type StatusForm = {
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';
};

const statusOptions: StatusForm['status'][] = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
];

export function AdminOrdersPage() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<StatusForm>({
    defaultValues: { status: 'PENDING' },
  });

  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const response = await http.get<OrdersResponse>('/orders', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.data;
    },
    enabled: Boolean(accessToken),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: StatusForm['status'] }) => {
      const response = await http.put(`/orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.order as AdminOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      reset({ status: 'PENDING' });
      setSelectedOrderId(null);
      window.alert('Statusul comenzii a fost actualizat cu succes.');
    },
  });

  const handleStatusUpdate = async (data: StatusForm) => {
    if (!selectedOrderId) return;
    await updateStatusMutation.mutateAsync({ orderId: selectedOrderId, status: data.status });
  };

  const renderOrderItems = (order: AdminOrder) => (
    <div className='order-items'>
      {order.orderItems.map((item) => (
        <article className='order-item' key={item.id}>
          <img src={item.product.imageUrl} alt={item.product.name} />
          <div className='order-item-details'>
            <strong>{item.product.name}</strong>
            <span>Cantitate: {item.quantity}</span>
            <span>Pret unitar: {Number(item.unitPrice).toFixed(2)} RON</span>
          </div>
          <div className='order-item-total'>
            {Number(item.unitPrice) * item.quantity} RON
          </div>
        </article>
      ))}
    </div>
  );

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  return (
    <section className='page'>
      <div className='admin-header'>
        <div>
          <h1>Admin comenzi</h1>
          <p className='lead'>Gestioneaza comenzile utilizatorilor si actualizeaza statusul lor.</p>
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <p>Se incarca comenzile...</p>
      ) : ordersQuery.isError ? (
        <p>Nu am putut incarca comenzile.</p>
      ) : orders.length === 0 ? (
        <p>Nu exista comenzi pentru a fi gestionate.</p>
      ) : (
        <div className='order-history'>
          {orders.map((order) => (
            <article className='order-card order-card-large' key={order.id}>
              <header className='order-card-header'>
                <div>
                  <span className='order-label'>Comanda</span>
                  <h2>#{order.id}</h2>
                  <p className='order-user'>Client: {order.user.fullName} ({order.user.email})</p>
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

              {renderOrderItems(order)}

              <footer className='order-card-footer'>
                <button
                  type='button'
                  className='button button-secondary'
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    reset({ status: order.status });
                  }}
                >
                  Modifica status
                </button>
                {selectedOrderId === order.id ? (
                  <form className='form admin-order-status-form' onSubmit={handleSubmit(handleStatusUpdate)}>
                    <label>
                      Status nou
                      <select {...register('status')}>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className='button' type='submit' disabled={isSubmitting || updateStatusMutation.isPending}>
                      {isSubmitting || updateStatusMutation.isPending ? 'Actualizare...' : 'Salveaza status'}
                    </button>
                  </form>
                ) : null}
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
