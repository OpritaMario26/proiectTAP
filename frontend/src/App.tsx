import { Link, Navigate, Route, Routes } from 'react-router-dom';

import { useAppSelector } from './hooks';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';

function App() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className='app-shell'>
      <header className='topbar'>
        <nav>
          <Link to='/'>Home</Link>
          <Link to='/products'>Produse</Link>
          <Link to='/login'>Login</Link>
        </nav>
        <span>{user ? `Salut, ${user.fullName}` : 'Neautentificat'}</span>
      </header>

      <main className='content'>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/products' element={<ProductsPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
