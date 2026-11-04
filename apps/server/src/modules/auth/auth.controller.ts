import { Request, Response, NextFunction } from 'express';
import { authService, AppError } from './auth.service';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        message: 'Cuenta titular registrada con éxito.',
        data: result,
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        message: 'Sesión iniciada con éxito.',
        data: result,
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const result = await authService.getMe(req.user.userId);
      res.status(200).json({
        data: result,
      });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      next(err);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
  }
}

export const authController = new AuthController();
