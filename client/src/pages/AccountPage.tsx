import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { http } from '../api/http';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setSession } from '../store/authSlice';

export function AccountPage() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const user = useAppSelector((state) => state.auth.user);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      setProfileMessage('');
      setProfileError('');
      const response = await http.put(
        '/auth/profile',
        { email: user?.email, fullName },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      return response.data;
    },
    onSuccess: (data) => {
      setProfileMessage('Profil actualizat cu succes.');
      if (accessToken) {
        dispatch(setSession({ user: data.user, accessToken, refreshToken }));
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setProfileError(
        err.response?.data?.message || 'Eroare la actualizare profil',
      );
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      setPasswordMessage('');
      setPasswordError('');
      const response = await http.put(
        '/auth/change-password',
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      return response.data;
    },
    onSuccess: () => {
      setPasswordMessage('Parola a fost schimbata cu succes.');
      setOldPassword('');
      setNewPassword('');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setPasswordError(
        err.response?.data?.message || 'Eroare la schimbare parola',
      );
    },
  });

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  return (
    <section className='page'>
      <h1>Detalii cont</h1>
      <p className='lead'>Gestioneaza-ti datele personale si parola.</p>

      <div className='form-group' style={{ marginBottom: '32px' }}>
        <h2>Date personale</h2>
        <form
          className='form'
          onSubmit={(e) => {
            e.preventDefault();
            updateProfileMutation.mutate();
          }}
        >
          <label>
            Email (nu poate fi modificat)
            <input type='email' value={user.email} disabled />
          </label>
          <label>
            Nume complet
            <input
              type='text'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
          {profileError && <p className='error'>{profileError}</p>}
          {profileMessage && <p style={{ color: 'green', fontWeight: 'bold' }}>{profileMessage}</p>}
          <button
            className='button'
            type='submit'
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? 'Se salveaza...' : 'Salveaza modificarile'}
          </button>
        </form>
      </div>

      <div className='form-group'>
        <h2>Schimbare parola</h2>
        <form
          className='form'
          onSubmit={(e) => {
            e.preventDefault();
            changePasswordMutation.mutate();
          }}
        >
          <label>
            Parola actuala
            <input
              type='password'
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Parola noua
            <input
              type='password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          {passwordError && <p className='error'>{passwordError}</p>}
          {passwordMessage && <p style={{ color: 'green', fontWeight: 'bold' }}>{passwordMessage}</p>}
          <button
            className='button button-secondary'
            type='submit'
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? 'Se schimba...' : 'Schimba parola'}
          </button>
        </form>
      </div>
    </section>
  );
}
