import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { http } from '../api/http';
import { useAppDispatch } from '../hooks';
import { setSession } from '../store/authSlice';

const loginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(1, 'Parola este obligatorie'),
});

type LoginForm = z.infer<typeof loginSchema>;

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: 'USER' | 'ADMIN';
  };
};

export function LoginPage() {
  const dispatch = useAppDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    const response = await http.post<LoginResponse>('/auth/login', data);
    dispatch(setSession(response.data));
  };

  return (
    <section className='page'>
      <h1>Login</h1>
      <form className='form' onSubmit={handleSubmit(onSubmit)}>
        <label>
          Email
          <input type='email' {...register('email')} />
          {errors.email ? (
            <span className='error'>{errors.email.message}</span>
          ) : null}
        </label>

        <label>
          Parola
          <input type='password' {...register('password')} />
          {errors.password ? (
            <span className='error'>{errors.password.message}</span>
          ) : null}
        </label>

        <button className='button' type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Se trimite...' : 'Autentifica-te'}
        </button>
      </form>
    </section>
  );
}
