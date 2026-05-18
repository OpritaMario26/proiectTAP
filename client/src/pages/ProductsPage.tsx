import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { http } from '../api/http';
import { useAppSelector } from '../hooks';
import type { Product } from '../types/product';

type ProductsResponse = {
  data: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type Category = {
  id: number;
  name: string;
  slug: string;
};

async function fetchProducts(search: string, sort: string, categoryId: string) {
  const response = await http.get<ProductsResponse>('/products', {
    params: {
      search: search || undefined,
      sort: sort || undefined,
      categoryId: categoryId || undefined,
    },
  });
  return response.data;
}

export function ProductsPage() {
  const navigate = useNavigate();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'createdAt_desc';
  const categoryId = searchParams.get('categoryId') || '';
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const productsQuery = useQuery({
    queryKey: ['products', search, sort, categoryId],
    queryFn: () => fetchProducts(search, sort, categoryId),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await http.get<{ data: Category[] }>('/categories');
      return res.data.data;
    },
  });

  const hasProducts = useMemo(
    () => (productsQuery.data?.data.length ?? 0) > 0,
    [productsQuery.data],
  );

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!accessToken) {
        navigate('/login');
        return;
      }

      await http.post(
        '/cart',
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    },
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams((prev) => {
      const trimmed = searchInput.trim();
      if (trimmed) prev.set('search', trimmed);
      else prev.delete('search');
      return prev;
    });
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const val = event.target.value;
    setSearchParams((prev) => {
      if (val && val !== 'createdAt_desc') prev.set('sort', val);
      else prev.delete('sort');
      return prev;
    });
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const val = event.target.value;
    setSearchParams((prev) => {
      if (val) prev.set('categoryId', val);
      else prev.delete('categoryId');
      return prev;
    });
  };

  if (productsQuery.isPending) {
    return <p>Se incarca produsele...</p>;
  }

  if (productsQuery.isError) {
    return <p>Nu am putut incarca produsele momentan.</p>;
  }

  return (
    <section className='page'>
      <h1>Produse</h1>
      <form className='catalog-toolbar' onSubmit={handleSearchSubmit}>
        <input
          type='text'
          placeholder='Cauta dupa nume, brand sau categorie'
          value={searchInput}
          onChange={handleSearchChange}
        />
        <button className='button button-secondary' type='submit'>
          Cauta
        </button>
        <select value={categoryId} onChange={handleCategoryChange}>
          <option value=''>Toate categoriile</option>
          {categoriesQuery.data?.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>
        <select value={sort} onChange={handleSortChange}>
          <option value='createdAt_desc'>Cele mai noi</option>
          <option value='price_asc'>Pret crescator</option>
          <option value='price_desc'>Pret descrescator</option>
          <option value='name_asc'>Nume A-Z</option>
          <option value='name_desc'>Nume Z-A</option>
        </select>
      </form>
      <p className='lead'>Total produse: {productsQuery.data.pagination.total}</p>
      <div className='products-grid'>
        {productsQuery.data.data.map((product) => (
          <article className='card' key={product.id}>
            <img src={product.imageUrl} alt={product.name} />
            <Link to={`/products/${product.slug}`}>
              <h3>{product.name}</h3>
            </Link>
            <p>{product.brand}</p>
            <p>{product.category.name}</p>
            <p className='stock'>Stoc: {product.stock}</p>
            <strong>{Number(product.price).toFixed(2)} RON</strong>
            <button
              className='button card-button'
              type='button'
              onClick={() => addToCartMutation.mutate(product.id)}
            >
              Adauga in cos
            </button>
          </article>
        ))}
      </div>
      {!hasProducts ? <p>Nu exista produse pentru filtrul curent.</p> : null}
    </section>
  );
}
