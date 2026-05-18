import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { http } from '../api/http';
import heroLogo from '../assets/Shop LOGO.png';

type Category = {
  id: number;
  name: string;
  slug: string;
};

export function HomePage() {
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await http.get<{ data: Category[] }>('/categories');
      return res.data.data;
    },
  });

  return (
    <section className='page'>
      <section className='hero-panel'>
        <div className='hero-content'>
          <img src={heroLogo} alt='Shop LOGO' className='hero-logo' />
          <h1>Electronice și electrocasnice la un click distanță</h1>
          <p className='lead'>Găsește echipamente de încredere, livrare rapidă și suport dedicat pentru fiecare comandă.</p>
          <div className='actions'>
            <Link className='button' to='/products'>
              Vezi produsele
            </Link>
          </div>

          <div className='hero-features'>
            <article>
              <strong>Livrare națională</strong>
              <p>În toată țara, rapid și sigur.</p>
            </article>
            <article>
              <strong>Suport dedicat</strong>
              <p>Te ajutăm cu orice întrebare.</p>
            </article>
          </div>
        </div>

        <div className='hero-visual'>
          <img src="https://static.vecteezy.com/system/resources/thumbnails/050/532/704/small/a-store-with-many-electronic-devices-on-display-photo.jpg" alt='Electronice si electrocasnice' className='hero-image' style={{ width: '100%', height: '100%', objectFit: 'cover' }  } />
          <span className='hero-visual-pill'>Top echipamente, garanție reală.</span>
        </div>
      </section>

      <div className='category-strip'>
        {categoriesQuery.data ? (
          categoriesQuery.data.map((cat) => (
            <Link key={cat.id} to={`/products?categoryId=${cat.id}`}>
              <span>{cat.name}</span>
            </Link>
          ))
        ) : (
          <>
            <span>Laptopuri</span>
            <span>Telefoane</span>
            <span>Televizoare</span>
            <span>Electrocasnice</span>
          </>
        )}
      </div>

      <div className='feature-grid'>
        <article className='feature-card'>
          <h3>Calitate verificată</h3>
          <p>Produse atent selecționate pentru performanță și durabilitate.</p>
        </article>
        <article className='feature-card'>
          <h3>Rate flexibile</h3>
          <p>Alege plata în rate care se potrivește bugetului tău.</p>
        </article>
        <article className='feature-card'>
          <h3>Retur simplu</h3>
          <p>14 zile pentru orice produs neconform.</p>
        </article>
      </div>
    </section>
  );
}
