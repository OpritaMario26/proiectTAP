import { ZodError } from 'zod';
export function errorHandler(error, _req, res, _next) {
    if (error instanceof ZodError) {
        return res.status(400).json({
            message: 'Validation failed',
            issues: error.issues,
        });
    }
    if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
}
