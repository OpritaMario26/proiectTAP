import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useState, useRef, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from './hooks';
import { http } from './api/http';
import { clearSession } from './store/authSlice';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { AdminCategoriesPage } from './pages/AdminCategoriesPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AccountPage } from './pages/AccountPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { ProductsPage } from './pages/ProductsPage';
import { RegisterPage } from './pages/RegisterPage';
import { RequestResetPage } from './pages/RequestResetPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

function AdminRoute({ children }: { children: ReactElement }) {
  const user = useAppSelector((state) => state.auth.user);
  if (!user) {
    return <Navigate to='/login' replace />;
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to='/' replace />;
  }
  return children;
}

function App() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className='app-shell'>
      <header className='topbar topbar-main'>
        <div className='brand-row'>
          <Link to='/' className='brand-logo'>
            ATAP Shop
          </Link>
          <span className='brand-badge'>Electrocasnice si IT</span>
        </div>
        <form
          className='search-row'
          onSubmit={(e) => {
            e.preventDefault();
            const q = searchQuery.trim();
            if (q) navigate(`/products?search=${encodeURIComponent(q)}`);
            else navigate('/products');
          }}
        >
          <input
            type='text'
            placeholder='Cauta laptopuri, telefoane, TV, electrocasnice...'
            aria-label='Cauta produse'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className='button search-button' type='submit'>
            Cauta
          </button>
        </form>
      </header>

      <section className='promo-strip'>
        <p>
          Super Preturi | Rate fara dobanda | Livrare rapida in toata tara
        </p>
      </section>

      <header className='topbar topbar-nav'>
        <nav>
          <Link to='/'>Acasa</Link>
          <Link to='/products'>Produse</Link>
          <Link to='/cart'>Cos</Link>
          {user ? <Link to='/orders'>Comenzile mele</Link> : null}
          {!user ? (
            <Link className='button button-secondary' to='/register'>
              Creare cont
            </Link>
          ) : null}
          {!user ? (
            <Link className='button' to='/login'>
              Autentificare
            </Link>
          ) : null}
          {user?.role === 'ADMIN' ? <Link to='/admin/products'>Admin Produse</Link> : null}
          {user?.role === 'ADMIN' ? <Link to='/admin/categories'>Admin Categorii</Link> : null}
          {user?.role === 'ADMIN' ? <Link to='/admin/orders'>Admin Comenzi</Link> : null}
        </nav>
        <div className='user-panel'>
          {user ? (
            <div className='user-dropdown-container' ref={dropdownRef}>
              <button
                type='button'
                className='button button-secondary dropdown-toggle'
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                Salut, {user.fullName} ▼
              </button>
              {dropdownOpen && (
                <div className='dropdown-menu'>
                  <Link
                    to='/account'
                    className='dropdown-item'
                    onClick={() => setDropdownOpen(false)}
                  >
                    Detalii cont
                  </Link>
                  <button
                    type='button'
                    className='dropdown-item text-left'
                    onClick={async () => {
                      setDropdownOpen(false);
                      try {
                        if (accessToken) {
                          await http.post(
                            '/auth/logout',
                            {},
                            { headers: { Authorization: `Bearer ${accessToken}` } },
                          );
                        }
                      } finally {
                        dispatch(clearSession());
                      }
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span>Neautentificat</span>
          )}
        </div>
      </header>

      <main className='content'>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/products' element={<ProductsPage />} />
          <Route path='/products/:slug' element={<ProductDetailsPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/request-reset' element={<RequestResetPage />} />
          <Route path='/reset-password' element={<ResetPasswordPage />} />
          <Route path='/verify-email' element={<VerifyEmailPage />} />
          <Route path='/cart' element={<CartPage />} />
          <Route path='/checkout' element={<CheckoutPage />} />
          <Route path='/orders' element={<OrdersPage />} />
          <Route path='/account' element={<AccountPage />} />
          <Route
            path='/admin/products'
            element={
              <AdminRoute>
                <AdminProductsPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/categories'
            element={
              <AdminRoute>
                <AdminCategoriesPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/orders'
            element={
              <AdminRoute>
                <AdminOrdersPage />
              </AdminRoute>
            }
          />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
