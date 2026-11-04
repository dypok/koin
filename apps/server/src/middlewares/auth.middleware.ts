import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ZodSchema, ZodError } from 'zod';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  profileId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_koin_change_in_production_min32';

/**
 * Middleware that strictly enforces JWT authentication.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({
      error: 'No autenticado',
      message: 'Token de acceso ausente. Proporcione un encabezado Authorization: Bearer <token>',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      error: 'Token inválido o expirado',
      message: 'La sesión no es válida o ha caducado. Inicie sesión nuevamente.',
    });
  }
}

/**
 * Generic Request Body Validator using Zod schemas.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: 'Error de validación',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
