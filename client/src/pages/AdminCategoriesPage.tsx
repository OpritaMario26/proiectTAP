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
      <div className='admin-header'>
        <div>
          <h1>Admin categorii</h1>
          <p className='lead'>Gestioneaza categoriile magazinului.</p>
        </div>
      </div>

      <form className='form admin-category-form' onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
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

      <section className='category-section'>
        <div className='section-header'>
          <div>
            <h2>Categorii existente</h2>
          </div>
          <span className='category-count'>Total: {categoriesQuery.data?.length ?? 0}</span>
        </div>

        {categoriesQuery.isLoading ? (
          <p>Se incarca categoriile...</p>
        ) : categoriesQuery.isError ? (
          <p>Nu am putut incarca categoriile.</p>
        ) : categoriesQuery.data && categoriesQuery.data.length > 0 ? (
          <div className='category-grid'>
            {categoriesQuery.data.map((category) => (
              <article className='category-card' key={category.id}>
                <div className='category-card-content'>
                  <span className='category-label'>Categorie</span>
                  <h3>{category.name}</h3>
                  <p className='category-slug'>{category.slug}</p>
                </div>
                <button
                  type='button'
                  className='button button-secondary'
                  onClick={() => deleteMutation.mutate(category.id)}
                  disabled={deleteMutation.isPending}
                >
                  Sterge
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p>Nu exista categorii in baza de date.</p>
        )}
      </section>
    </section>
  );
}
