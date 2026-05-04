import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { http } from '../api/http';

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
      <h1>Oferte bune la electronice si electrocasnice</h1>
      <div className='hero-banner'>
        <h2>Reduceri de sezon</h2>
        <p>Discount pana la 40% la laptopuri, telefoane si televizoare smart.</p>
      </div>
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
      <div className='actions'>
        <Link className='button' to='/products'>
          Vezi produsele
        </Link>
        <Link className='button button-secondary' to='/register'>
          Creeaza cont
        </Link>
      </div>
    </section>
  );
}
