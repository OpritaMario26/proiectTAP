import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { http } from '../api/http';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificam adresa de email...');

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Tokenul de verificare lipseste.');
        return;
      }

      try {
        await http.get('/auth/verify-email', { params: { token } });
        setStatus('success');
        setMessage('Email verificat cu succes. Acum te poti autentifica.');
      } catch (error) {
        setStatus('error');
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          setMessage(String(error.response.data.message));
          return;
        }
        setMessage('Nu am putut verifica emailul.');
      }
    };

    void verify();
  }, [searchParams]);

  return (
    <section className='page'>
      <h1>Verificare email</h1>
      <p className='lead'>{message}</p>
      {status !== 'loading' ? (
        <Link className='button' to='/login'>
          Mergi la login
        </Link>
      ) : null}
    </section>
  );
}
