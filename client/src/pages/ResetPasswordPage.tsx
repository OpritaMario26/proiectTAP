import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { http } from '../api/http';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Parola trebuie sa aiba minim 8 caractere')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Parola trebuie sa contina litera mica, mare si cifra'),
    confirmPassword: z.string().min(1, 'Confirmarea parolei este obligatorie'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    if (!token) {
      window.alert('Token invalid sau lipsa.');
      return;
    }

    await http.post('/auth/reset-password', {
      token,
      newPassword: data.newPassword,
    });
    reset();
    window.alert('Parola a fost actualizata cu succes.');
  };

  return (
    <section className='page'>
      <h1>Seteaza parola noua</h1>
      <form className='form' onSubmit={handleSubmit(onSubmit)}>
        <label>
          Parola noua
          <input type='password' {...register('newPassword')} />
          {errors.newPassword ? <span className='error'>{errors.newPassword.message}</span> : null}
        </label>
        <label>
          Confirma parola
          <input type='password' {...register('confirmPassword')} />
          {errors.confirmPassword ? (
            <span className='error'>{errors.confirmPassword.message}</span>
          ) : null}
        </label>
        <button className='button' type='submit' disabled={isSubmitting}>
          Actualizeaza parola
        </button>
      </form>
    </section>
  );
}
