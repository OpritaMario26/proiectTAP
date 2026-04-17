import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../lib/auth.js';

const querySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
  sort: z.enum(['name_asc', 'name_desc', 'price_asc', 'price_desc', 'createdAt_desc']).optional(),
});

const createProductSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, numbers, and hyphens only'),
  description: z.string().min(1).max(2000),
  price: z.number().positive().max(999999.99),
  stock: z.number().int().min(0).max(99999),
  imageUrl: z.string().url().max(500),
  brand: z.string().min(1).max(100),
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

  const { search, categoryId, page, pageSize, sort } = parsed.data;

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

  const orderBy = (() => {
    switch (sort) {
      case 'name_asc':
        return { name: 'asc' as const };
      case 'name_desc':
        return { name: 'desc' as const };
      case 'price_asc':
        return { price: 'asc' as const };
      case 'price_desc':
        return { price: 'desc' as const };
      case 'createdAt_desc':
      default:
        return { createdAt: 'desc' as const };
    }
  })();

  const [total, products] = await Promise.all([
    prisma.product.count({ where: whereClause }),
    prisma.product.findMany({
      where: whereClause,
      include: { category: true },
      orderBy,
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

productsRouter.post('/', authenticate, requireAdmin, async (req, res) => {
  const parsed = createProductSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const { categoryId, name, slug, description, price, stock, imageUrl, brand } = parsed.data;

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return res.status(400).json({ message: 'Category not found' });
  }

  // Check if slug is unique
  const existingProduct = await prisma.product.findUnique({
    where: { slug },
  });
  if (existingProduct) {
    return res.status(409).json({ message: 'Product slug already exists' });
  }

  const product = await prisma.product.create({
    data: {
      categoryId,
      name,
      slug,
      description,
      price,
      stock,
      imageUrl,
      brand,
    },
    include: { category: true },
  });

  return res.status(201).json({
    message: 'Product created',
    product,
  });
});

productsRouter.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const parsed = createProductSchema.partial().safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const productId = Number(id);
  if (!Number.isInteger(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!existingProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Check if new slug is unique (if provided)
  if (parsed.data.slug && parsed.data.slug !== existingProduct.slug) {
    const slugExists = await prisma.product.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (slugExists) {
      return res.status(409).json({ message: 'Product slug already exists' });
    }
  }

  // Check category if provided
  if (parsed.data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
    });
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: parsed.data,
    include: { category: true },
  });

  return res.status(200).json({
    message: 'Product updated',
    product: updatedProduct,
  });
});

productsRouter.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!existingProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  await prisma.product.delete({
    where: { id: productId },
  });

  return res.status(200).json({ message: 'Product deleted' });
});
