import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { z } from 'zod';

import { http } from '../api/http';
import { useAppSelector } from '../hooks';

type Category = {
  id: number;
  name: string;
  slug: string;
};

type CategoriesResponse = {
  data: Category[];
};

type Product = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  categoryId: number;
  category: Category;
  description: string;
  price: string;
  stock: number;
  imageUrl: string;
};

type ProductsResponse = {
  data: Product[];
};

const productSchema = z.object({
  categoryId: z.number().int().positive('Selecteaza categoria'),
  name: z.string().min(2, 'Numele este obligatoriu'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug invalid (doar litere mici, cifre si -)'),
  description: z.string().min(8, 'Descriere prea scurta'),
  price: z.number().positive('Pret invalid'),
  stock: z.number().int().min(0, 'Stoc invalid'),
  imageUrl: z.string().url('URL imagine invalid'),
  brand: z.string().min(1, 'Brand obligatoriu'),
});

type ProductForm = z.infer<typeof productSchema>;

export function AdminProductsPage() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {},
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories-admin'],
    queryFn: async () => {
      const response = await http.get<CategoriesResponse>('/categories');
      return response.data.data;
    },
  });

  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await http.get<ProductsResponse>('/products', {
        params: { pageSize: 50 },
      });
      return response.data.data;
    },
  });

  const filteredProducts = useMemo(() => {
    if (!productsQuery.data) {
      return [] as Product[];
    }

    return productsQuery.data.filter((product) => {
      const matchesSearch = searchTerm
        ? [product.name, product.slug, product.brand, product.category.name]
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        : true;
      const matchesCategory = categoryFilter ? product.categoryId === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
  }, [productsQuery.data, searchTerm, categoryFilter]);

  const createProductMutation = useMutation({
    mutationFn: async (formData: ProductForm) => {
      await http.post('/products', formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      reset();
      setEditingProduct(null);
      window.alert('Produs adaugat cu succes.');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        setError('root', {
          message: error.response?.data?.message ?? 'Nu am putut salva produsul',
        });
        return;
      }

      setError('root', { message: 'Eroare necunoscuta la salvare' });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductForm }) => {
      await http.put(`/products/${id}`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      reset();
      setEditingProduct(null);
      window.alert('Produs actualizat cu succes.');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        setError('root', {
          message: error.response?.data?.message ?? 'Nu am putut actualiza produsul',
        });
        return;
      }

      setError('root', { message: 'Eroare necunoscuta la actualizare' });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await http.delete(`/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteError(null);
      window.alert('Produs sters cu succes.');
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? 'Nu am putut sterge produsul'
        : 'Eroare necunoscuta la stergere';
      setDeleteError(message);
    },
  });

  const onSubmit = async (data: ProductForm) => {
    if (!accessToken) {
      setError('root', { message: 'Autentificare invalida. Refa login.' });
      return;
    }

    if (editingProduct) {
      await updateProductMutation.mutateAsync({ id: editingProduct.id, data });
      return;
    }

    await createProductMutation.mutateAsync(data);
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      categoryId: product.categoryId,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      imageUrl: product.imageUrl,
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchTerm(searchValue.trim());
  };

  const handleCategoryFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setCategoryFilter(value ? Number(value) : '');
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    reset();
  };

  const handleDelete = async (productId: number) => {
    if (!accessToken) {
      setDeleteError('Autentificare invalida. Refa login si reincearca.');
      return;
    }

    if (!window.confirm('Esti sigur ca vrei sa stergi acest produs?')) {
      return;
    }

    try {
      await deleteProductMutation.mutateAsync(productId);
    } catch {
      // onError already handles the message, no further action required
    }
  };

  return (
    <section className='page'>
      <h1>{editingProduct ? 'Admin - Editeaza produs' : 'Admin - Adauga produs'}</h1>
      <p className='lead'>Doar utilizatorii cu rol ADMIN pot accesa aceasta pagina.</p>

      <form className='form form-large' onSubmit={handleSubmit(onSubmit)}>
        <label>
          Nume produs
          <input type='text' {...register('name')} />
          {errors.name ? <span className='error'>{errors.name.message}</span> : null}
        </label>

        <label>
          Slug
          <input type='text' {...register('slug')} placeholder='ex: tv-samsung-qled-55' />
          {errors.slug ? <span className='error'>{errors.slug.message}</span> : null}
        </label>

        <label>
          Brand
          <input type='text' {...register('brand')} />
          {errors.brand ? <span className='error'>{errors.brand.message}</span> : null}
        </label>

        <label>
          Categorie
          <select {...register('categoryId', { valueAsNumber: true })} defaultValue=''>
            <option value='' disabled>
              {categoriesQuery.isPending ? 'Se incarca...' : 'Selecteaza categoria'}
            </option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId ? <span className='error'>{errors.categoryId.message}</span> : null}
        </label>

        <label>
          Pret (RON)
          <input type='number' step='0.01' {...register('price', { valueAsNumber: true })} />
          {errors.price ? <span className='error'>{errors.price.message}</span> : null}
        </label>

        <label>
          Stoc
          <input type='number' {...register('stock', { valueAsNumber: true })} />
          {errors.stock ? <span className='error'>{errors.stock.message}</span> : null}
        </label>

        <label>
          URL imagine
          <input type='text' {...register('imageUrl')} />
          {errors.imageUrl ? <span className='error'>{errors.imageUrl.message}</span> : null}
        </label>

        <label>
          Descriere
          <textarea rows={5} {...register('description')} />
          {errors.description ? (
            <span className='error'>{errors.description.message}</span>
          ) : null}
        </label>

        {errors.root ? <span className='error'>{errors.root.message}</span> : null}

        <div className='form-actions'>
          <button className='button' type='submit' disabled={isSubmitting || createProductMutation.isPending || updateProductMutation.isPending}>
            {editingProduct
              ? isSubmitting || updateProductMutation.isPending
                ? 'Se actualizeaza...'
                : 'Salveaza modificari'
              : isSubmitting || createProductMutation.isPending
              ? 'Se salveaza...'
              : 'Adauga produs'}
          </button>
          {editingProduct ? (
            <button type='button' className='button button-secondary' onClick={cancelEditing}>
              Renunta
            </button>
          ) : null}
        </div>
      </form>

      <section className='admin-list'>
        <h2>Produse existente</h2>
        <form className='admin-filter-form' onSubmit={handleSearchSubmit}>
          <input
            type='text'
            placeholder='Cauta produs, brand sau categorie'
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
          <select value={categoryFilter} onChange={handleCategoryFilterChange}>
            <option value=''>Toate categoriile</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button className='button button-secondary' type='submit'>
            Cauta
          </button>
        </form>
        {productsQuery.isLoading ? (
          <p>Se incarca produsele...</p>
        ) : productsQuery.isError ? (
          <p>
            Nu am putut incarca produsele.
            {productsQuery.error instanceof Error ? ` ${productsQuery.error.message}` : ''}
          </p>
        ) : (
          <>
            {deleteError ? <div className='error'>{deleteError}</div> : null}
            <div className='admin-table-container'>
              <table className='admin-table'>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Imagine</th>
                  <th>Produs</th>
                  <th>Categorie</th>
                  <th>Pret</th>
                  <th>Stoc</th>
                  <th>Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.category.name}</td>
                    <td>{Number(product.price).toFixed(2)} RON</td>
                    <td>{product.stock}</td>
                    <td>
                      <button className='button button-secondary' type='button' onClick={() => startEditing(product)}>
                        Editeaza
                      </button>
                      <button
                        className='button button-danger'
                        type='button'
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteProductMutation.isPending}
                      >
                        Sterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </section>
  );
}
