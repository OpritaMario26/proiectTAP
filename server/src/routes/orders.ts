import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../lib/auth.js';

const createOrderSchema = z.object({
  shippingAddress: z.string().min(10).max(500),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELED']),
});

export const ordersRouter = Router();

ordersRouter.use(authenticate); // All order routes require auth

ordersRouter.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';

  const whereClause = isAdmin ? {} : { userId };

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      orderItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({ data: orders });
});

ordersRouter.get('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';

  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (!isAdmin && order.userId !== userId) {
    return res.status(403).json({ message: 'Access denied' });
  }

  return res.status(200).json({ data: order });
});

ordersRouter.post('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const { shippingAddress } = parsed.data;

  // Get cart items
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  // Check stock and calculate total
  let totalAmount = 0;
  const orderItems: { productId: number; quantity: number; unitPrice: any }[] = [];

  for (const item of cartItems) {
    if (item.product.stock < item.quantity) {
      return res.status(400).json({
        message: `Insufficient stock for ${item.product.name}`,
      });
    }
    totalAmount += item.product.price.toNumber() * item.quantity;
    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.product.price,
    });
  }

  // Create order in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        shippingAddress,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
    });

    // Update product stock
    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { userId },
    });

    return order;
  });

  return res.status(201).json({
    message: 'Order created successfully',
    order: result,
  });
});

ordersRouter.put('/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const parsed = updateOrderStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  const { status } = parsed.data;

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!existingOrder) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      orderItems: {
        include: { product: true },
      },
    },
  });

  return res.status(200).json({
    message: 'Order status updated',
    order: updatedOrder,
  });
});