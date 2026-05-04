import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { http } from '../api/http';
import { useAppSelector } from '../hooks';

const checkoutSchema = z.object({
  shippingAddress: z.string().min(10, 'Adresa trebuie sa aiba minim 10 caractere'),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (payload: CheckoutForm) => {
      await http.post('/orders', payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/orders');
    },
  });

  if (!accessToken) {
    navigate('/login');
    return null;
  }

  return (
    <section className='page'>
      <h1>Checkout</h1>
      <p className='lead'>Plata este simulata pentru acest proiect.</p>
      <form className='form' onSubmit={handleSubmit((data) => checkoutMutation.mutate(data))}>
        <label>
          Adresa livrare
          <textarea rows={5} {...register('shippingAddress')} />
          {errors.shippingAddress ? (
            <span className='error'>{errors.shippingAddress.message}</span>
          ) : null}
        </label>
        <button className='button' type='submit' disabled={isSubmitting || checkoutMutation.isPending}>
          Finalizeaza comanda
        </button>
      </form>
    </section>
  );
}
