import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../lib/auth.js';

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, numbers, and hyphens only'),
});

const updateCategorySchema = createCategorySchema.partial();

export const categoriesRouter = Router();

categoriesRouter.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  return res.status(200).json({ data: categories });
});

categoriesRouter.post('/', authenticate, requireAdmin, async (req, res) => {
  const parsed = createCategorySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const { name, slug } = parsed.data;

  // Check if slug is unique
  const existingCategory = await prisma.category.findUnique({
    where: { slug },
  });
  if (existingCategory) {
    return res.status(409).json({ message: 'Category slug already exists' });
  }

  const category = await prisma.category.create({
    data: { name, slug },
  });

  return res.status(201).json({
    message: 'Category created',
    category,
  });
});

categoriesRouter.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const parsed = updateCategorySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!existingCategory) {
    return res.status(404).json({ message: 'Category not found' });
  }

  // Check if new slug is unique (if provided)
  if (parsed.data.slug && parsed.data.slug !== existingCategory.slug) {
    const slugExists = await prisma.category.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (slugExists) {
      return res.status(409).json({ message: 'Category slug already exists' });
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: parsed.data,
  });

  return res.status(200).json({
    message: 'Category updated',
    category: updatedCategory,
  });
});

categoriesRouter.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!existingCategory) {
    return res.status(404).json({ message: 'Category not found' });
  }

  // Check if category has products
  const productCount = await prisma.product.count({
    where: { categoryId },
  });
  if (productCount > 0) {
    return res.status(409).json({
      message: 'Cannot delete category with existing products',
    });
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  return res.status(200).json({ message: 'Category deleted' });
});