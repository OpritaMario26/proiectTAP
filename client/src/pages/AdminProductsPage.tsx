import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
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
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories-admin'],
    queryFn: async () => {
      const response = await http.get<CategoriesResponse>('/categories');
      return response.data.data;
    },
  });

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
      reset();
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

  const onSubmit = async (data: ProductForm) => {
    if (!accessToken) {
      setError('root', { message: 'Autentificare invalida. Refa login.' });
      return;
    }
    await createProductMutation.mutateAsync(data);
  };

  return (
    <section className='page'>
      <h1>Admin - Adauga produs</h1>
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

        <button className='button' type='submit' disabled={isSubmitting || createProductMutation.isPending}>
          {isSubmitting || createProductMutation.isPending ? 'Se salveaza...' : 'Adauga produs'}
        </button>
      </form>
    </section>
  );
}
