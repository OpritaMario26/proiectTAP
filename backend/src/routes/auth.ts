import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../lib/auth.js';
import { sendVerificationEmail, sendResetPasswordEmail } from '../lib/email.js';

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase, one uppercase, and one number'),
  fullName: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const requestResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase, one uppercase, and one number'),
});

const updateProfileSchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(2).max(100),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase, one uppercase, and one number'),
});

const createAccessToken = (userId: number, role: string) =>
  jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

const createRefreshToken = (userId: number) =>
  jwt.sign({ sub: userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: 'Invalid payload', issues: parsed.error.issues });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      passwordHash,
      emailVerified: false,
    },
  });

  const verificationToken = randomBytes(24).toString('hex');
  const verificationTokenHash = hashToken(verificationToken);
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpiresAt: verificationTokenExpiresAt,
    },
  });

  await sendVerificationEmail(user.email, verificationToken);

  return res.status(201).json({
    message: 'User created; verification email sent',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: 'Invalid payload', issues: parsed.error.issues });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordValid = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );
  if (!passwordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ message: 'Email not verified' });
  }

  const accessToken = createAccessToken(user.id, user.role);
  const refreshToken = createRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  return res.status(200).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

authRouter.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: 'Invalid payload', issues: parsed.error.issues });
  }

  try {
    const decoded = jwt.verify(
      parsed.data.refreshToken,
      env.JWT_REFRESH_SECRET,
    );

    if (
      typeof decoded === 'string' ||
      !('sub' in decoded) ||
      !('type' in decoded) ||
      typeof decoded.sub !== 'number' ||
      typeof decoded.type !== 'string'
    ) {
      return res.status(401).json({ message: 'Invalid refresh token payload' });
    }

    const userId = Number(decoded.sub);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ message: 'Invalid refresh token payload' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const isMatch =
      user.refreshTokenHash === hashToken(parsed.data.refreshToken);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = createAccessToken(user.id, user.role);
    return res.status(200).json({ accessToken });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

authRouter.post('/request-reset', async (req, res) => {
  const parsed = requestResetSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: 'Invalid payload', issues: parsed.error.issues });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) {
    return res
      .status(200)
      .json({ message: 'If email exists, reset token generated' });
  }

  const resetToken = randomBytes(24).toString('hex');
  const resetTokenHash = hashToken(resetToken);
  const resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash, resetTokenExpiresAt },
  });

  await sendResetPasswordEmail(user.email, resetToken);

  return res.status(200).json({
    message: 'If email exists, reset token generated and sent',
  });
});

authRouter.post('/reset-password', async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: 'Invalid payload', issues: parsed.error.issues });
  }

  const tokenHash = hashToken(parsed.data.token);

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      refreshTokenHash: null,
    },
  });

  return res.status(200).json({ message: 'Password reset successful' });
});

authRouter.get('/verify-email', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) {
    return res.status(400).json({ message: 'Token required' });
  }

  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: tokenHash,
      emailVerificationExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });

  return res.status(200).json({ message: 'Email verified successfully' });
});

authRouter.get('/profile', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json({ user });
});

authRouter.put('/profile', authenticate, async (req: AuthRequest, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const { email, fullName } = parsed.data;
  const userId = req.user!.id;

  // Check if email is taken by another user
  if (email !== req.user!.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { email, fullName },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return res.status(200).json({
    message: 'Profile updated',
    user: updatedUser,
  });
});

authRouter.put('/change-password', authenticate, async (req: AuthRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid payload',
      issues: parsed.error.issues,
    });
  }

  const { oldPassword, newPassword } = parsed.data;
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const passwordValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!passwordValid) {
    return res.status(400).json({ message: 'Old password is incorrect' });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return res.status(200).json({ message: 'Password changed successfully' });
});
