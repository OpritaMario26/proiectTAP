import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { http } from '../api/http';
import { useAppSelector } from '../hooks';

type Category = { id: number; name: string; slug: string };
type CategoriesResponse = { data: Category[] };

const categorySchema = z.object({
  name: z.string().min(2, 'Numele este obligatoriu'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug invalid'),
});

type CategoryForm = z.infer<typeof categorySchema>;

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await http.get<CategoriesResponse>('/categories');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CategoryForm) => {
      await http.post('/categories', payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await http.delete(`/categories/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return (
    <section className='page'>
      <h1>Admin categorii</h1>
      <form className='form' onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
        <label>
          Nume categorie
          <input type='text' {...register('name')} />
          {errors.name ? <span className='error'>{errors.name.message}</span> : null}
        </label>
        <label>
          Slug
          <input type='text' {...register('slug')} />
          {errors.slug ? <span className='error'>{errors.slug.message}</span> : null}
        </label>
        <button className='button' type='submit' disabled={isSubmitting || createMutation.isPending}>
          Adauga categorie
        </button>
      </form>

      <div className='orders-list'>
        {categoriesQuery.data?.map((category) => (
          <article className='order-card' key={category.id}>
            <h3>{category.name}</h3>
            <p>{category.slug}</p>
            <button type='button' onClick={() => deleteMutation.mutate(category.id)}>
              Sterge
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
