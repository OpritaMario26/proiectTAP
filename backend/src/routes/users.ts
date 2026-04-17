import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../lib/auth.js';

const queryUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export const usersRouter = Router();

usersRouter.use(authenticate, requireAdmin); // All routes require admin

usersRouter.get('/', async (req, res) => {
  const parsed = queryUsersSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Query parameters invalid',
      issues: parsed.error.issues,
    });
  }

  const { page, pageSize } = parsed.data;

  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return res.status(200).json({
    data: users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

usersRouter.put('/:id/role', async (req, res) => {
  const { id } = req.params;
  const parsed = updateUserRoleSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const { role } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!existingUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return res.status(200).json({
    message: 'User role updated',
    user: updatedUser,
  });
});

usersRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { orders: true },
  });
  if (!existingUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if user has active orders (not canceled)
  const activeOrders = existingUser.orders.filter(order => order.status !== 'CANCELED');
  if (activeOrders.length > 0) {
    return res.status(409).json({
      message: 'Cannot delete user with active orders',
    });
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return res.status(200).json({ message: 'User deleted' });
});