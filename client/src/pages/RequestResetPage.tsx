import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { http } from '../api/http';

const schema = z.object({
  email: z.string().email('Email invalid'),
});

type FormValues = z.infer<typeof schema>;

export function RequestResetPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    await http.post('/auth/request-reset', data);
    reset();
    window.alert('Daca email-ul exista, ai primit instructiuni pentru resetare.');
  };

  return (
    <section className='page'>
      <h1>Resetare parola</h1>
      <form className='form' onSubmit={handleSubmit(onSubmit)}>
        <label>
          Email
          <input type='email' {...register('email')} />
          {errors.email ? <span className='error'>{errors.email.message}</span> : null}
        </label>
        <button className='button' type='submit' disabled={isSubmitting}>
          Trimite link resetare
        </button>
      </form>
    </section>
  );
}
