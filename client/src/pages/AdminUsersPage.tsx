import axios from 'axios';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { http } from '../api/http';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setSession } from '../store/authSlice';

type UserRole = 'USER' | 'ADMIN';

type User = {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
};

type UsersResponse = {
  data: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const currentUser = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['admin-users', page],
    queryFn: async () => {
      const response = await http.get<UsersResponse>('/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { page, pageSize: 25 },
      });
      return response.data;
    },
    enabled: Boolean(accessToken),
  });

  const users = useMemo(() => {
    if (!usersQuery.data) {
      return [] as User[];
    }

    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return usersQuery.data.data;
    }

    return usersQuery.data.data.filter((user) =>
      [user.fullName, user.email, user.role]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [usersQuery.data, searchTerm]);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: UserRole }) => {
      const response = await http.put(`/users/${id}/role`, { role }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.user as User;
    },
    onSuccess: (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setActionError(null);

      if (currentUser?.id === variables.id) {
        dispatch(
          setSession({
            accessToken: accessToken ?? '',
            refreshToken: refreshToken ?? null,
            user: {
              ...currentUser,
              role: updatedUser.role,
            },
          }),
        );

        if (updatedUser.role !== 'ADMIN') {
          navigate('/');
        }
      }
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? 'Nu am putut actualiza rolul utilizatorului.'
        : 'Eroare necunoscuta la actualizarea rolului.';
      setActionError(message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await http.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setActionError(null);
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? 'Nu am putut sterge utilizatorul.'
        : 'Eroare necunoscuta la stergerea utilizatorului.';
      setActionError(message);
    },
  });

  const handleToggleRole = async (user: User) => {
    if (!accessToken) {
      setActionError('Autentificare invalida. Refa login.');
      return;
    }

    const nextRole: UserRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmMessage =
      nextRole === 'ADMIN'
        ? `Promovezi utilizatorul ${user.fullName} la ADMIN?`
        : `Demotezi utilizatorul ${user.fullName} la USER?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    await updateRoleMutation.mutateAsync({ id: user.id, role: nextRole });
  };

  const handleDeleteUser = async (user: User) => {
    if (!accessToken) {
      setActionError('Autentificare invalida. Refa login.');
      return;
    }

    if (currentUser?.id === user.id) {
      setActionError('Nu poti sterge contul tau.');
      return;
    }

    if (!window.confirm(`Stergi utilizatorul ${user.fullName}?`)) {
      return;
    }

    await deleteUserMutation.mutateAsync(user.id);
  };

  const pagination = usersQuery.data?.pagination;
  const canPrev = Boolean(pagination && page > 1);
  const canNext = Boolean(pagination && page < pagination.totalPages);

  return (
    <section className='page'>
      <div className='admin-header'>
        <div>
          <h1>Admin utilizatori</h1>
          <p className='lead'>Gestioneaza conturile active din magazin.</p>
        </div>
      </div>

      <div className='admin-users-toolbar'>
        <input
          type='text'
          placeholder='Cauta utilizatori dupa nume, email sau rol...'
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        {pagination ? (
          <div className='pagination-controls'>
            <button
              type='button'
              className='button button-secondary'
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={!canPrev}
            >
              Inapoi
            </button>
            <span>
              Pagina {pagination.page} din {pagination.totalPages}
            </span>
            <button
              type='button'
              className='button button-secondary'
              onClick={() => setPage((current) => Math.min(current + 1, pagination.totalPages))}
              disabled={!canNext}
            >
              Urmator
            </button>
          </div>
        ) : null}
      </div>

      {actionError ? <p className='error'>{actionError}</p> : null}

      {usersQuery.isLoading ? (
        <p>Se incarca utilizatorii...</p>
      ) : usersQuery.isError ? (
        <p>Nu am putut incarca utilizatorii.</p>
      ) : users.length === 0 ? (
        <p>Nu exista utilizatori de afisat.</p>
      ) : (
        <div className='admin-users-grid'>
          {users.map((user) => (
            <article className='admin-user-card' key={user.id}>
              <div className='admin-user-card-main'>
                <div>
                  <span className='user-card-label'>Utilizator</span>
                  <h2>{user.fullName}</h2>
                  <p className='user-email'>{user.email}</p>
                </div>
                <div className='admin-user-meta'>
                  <span className={`badge badge-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                  <span className='user-created'>Creat: {new Date(user.createdAt).toLocaleDateString('ro-RO')}</span>
                </div>
              </div>

              <div className='admin-user-actions'>
                <div className='action-buttons'>
                  <button
                    type='button'
                    className='button button-secondary'
                    onClick={() => handleToggleRole(user)}
                    disabled={updateRoleMutation.isPending || deleteUserMutation.isPending}
                  >
                    {user.role === 'ADMIN' ? 'Demoteaza la USER' : 'Promoveaza la ADMIN'}
                  </button>
                  <button
                    type='button'
                    className='button button-secondary'
                    onClick={() => handleDeleteUser(user)}
                    disabled={currentUser?.id === user.id || deleteUserMutation.isPending || updateRoleMutation.isPending}
                  >
                    Sterge
                  </button>
                </div>
                {currentUser?.id === user.id ? <small className='current-user-note'>Este contul tau</small> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
