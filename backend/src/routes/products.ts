import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';

const querySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
});

export const productsRouter = Router();

productsRouter.get('/', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Query parameters invalid',
      issues: parsed.error.issues,
    });
  }

  const { search, categoryId, page, pageSize } = parsed.data;

  const whereClause = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { brand: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId: Number(categoryId) } : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where: whereClause }),
    prisma.product.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return res.status(200).json({
    data: products,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});
