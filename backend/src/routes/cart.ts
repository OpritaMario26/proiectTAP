import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../lib/auth.js';

const addToCartSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99),
});

const updateCartSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export const cartRouter = Router();

cartRouter.use(authenticate); // All cart routes require auth

cartRouter.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: { category: true },
      },
    },
  });

  return res.status(200).json({ data: cartItems });
});

cartRouter.post('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const parsed = addToCartSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const { productId, quantity } = parsed.data;

  // Check if product exists and has stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  if (product.stock < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  // Check if item already in cart
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    if (product.stock < newQuantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
      include: { product: true },
    });

    return res.status(200).json({
      message: 'Cart updated',
      item: updatedItem,
    });
  } else {
    // Add new item
    const newItem = await prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
      include: { product: true },
    });

    return res.status(201).json({
      message: 'Item added to cart',
      item: newItem,
    });
  }
});

cartRouter.put('/:productId', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { productId } = req.params;
  const parsed = updateCartSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const productIdNum = Number(productId);
  if (!Number.isInteger(productIdNum)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  const { quantity } = parsed.data;

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId: productIdNum,
      },
    },
  });
  if (!existingItem) {
    return res.status(404).json({ message: 'Item not in cart' });
  }

  if (quantity === 0) {
    // Remove item
    await prisma.cartItem.delete({
      where: { id: existingItem.id },
    });
    return res.status(200).json({ message: 'Item removed from cart' });
  } else {
    // Check stock
    const product = await prisma.product.findUnique({
      where: { id: productIdNum },
    });
    if (!product || product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
      include: { product: true },
    });

    return res.status(200).json({
      message: 'Cart updated',
      item: updatedItem,
    });
  }
});

cartRouter.delete('/:productId', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { productId } = req.params;
  const productIdNum = Number(productId);
  if (!Number.isInteger(productIdNum)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId: productIdNum,
      },
    },
  });
  if (!existingItem) {
    return res.status(404).json({ message: 'Item not in cart' });
  }

  await prisma.cartItem.delete({
    where: { id: existingItem.id },
  });

  return res.status(200).json({ message: 'Item removed from cart' });
});