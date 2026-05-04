import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { http } from '../api/http';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Numele trebuie sa aiba minim 2 caractere'),
    email: z.string().email('Email invalid'),
    password: z
      .string()
      .min(8, 'Parola trebuie sa aiba minim 8 caractere')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Parola trebuie sa contina litera mica, mare si cifra',
      ),
    confirmPassword: z.string().min(1, 'Confirmarea parolei este obligatorie'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Parolele nu coincid',
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await http.post('/auth/register', {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      reset();
      window.alert(
        'Cont creat cu succes. Verifica emailul pentru activare, apoi te poti loga.',
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setError('email', { message: 'Email deja folosit' });
        return;
      }

      setError('root', {
        message:
          'Nu am putut crea contul acum. Verifica setarile backend si incearca din nou.',
      });
    }
  };

  return (
    <section className='page'>
      <h1>Creare cont</h1>
      <p className='lead'>Inregistreaza-te pentru a putea comanda produse.</p>

      <form className='form' onSubmit={handleSubmit(onSubmit)}>
        <label>
          Nume complet
          <input type='text' {...register('fullName')} />
          {errors.fullName ? <span className='error'>{errors.fullName.message}</span> : null}
        </label>

        <label>
          Email
          <input type='email' {...register('email')} />
          {errors.email ? <span className='error'>{errors.email.message}</span> : null}
        </label>

        <label>
          Parola
          <input type='password' {...register('password')} />
          {errors.password ? <span className='error'>{errors.password.message}</span> : null}
        </label>

        <label>
          Confirma parola
          <input type='password' {...register('confirmPassword')} />
          {errors.confirmPassword ? (
            <span className='error'>{errors.confirmPassword.message}</span>
          ) : null}
        </label>

        {errors.root ? <span className='error'>{errors.root.message}</span> : null}

        <button className='button' type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Se creeaza contul...' : 'Creeaza cont'}
        </button>
      </form>
    </section>
  );
}
