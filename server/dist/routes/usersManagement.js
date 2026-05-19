import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { isAdmin } from '../middleware/auth';
const router = Router();
// Get all users
router.get('/', isAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Promote user to admin
router.patch('/:id/promote', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.update({
            where: { id },
            data: { role: 'ADMIN' },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to promote user' });
    }
});
// Delete user
router.delete('/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
export default router;
