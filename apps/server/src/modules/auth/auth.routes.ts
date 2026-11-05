import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RegisterUserSchema, LoginUserSchema } from '@koin/shared';
import { authController } from './auth.controller';
import { validateBody, authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

// Strict Rate Limiter for Login: 5 requests per 15 min per IP (Brute-Force Protection)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos fallidos. Por seguridad, intente de nuevo en 15 minutos.',
  },
});

// Rate Limiter for Registration: 10 registrations per hour per IP
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Límite de registros alcanzado. Por favor, intente más tarde.',
  },
});

router.post('/register', registerRateLimiter, validateBody(RegisterUserSchema), (req, res, next) => {
  authController.register(req, res, next);
});

router.post('/login', loginRateLimiter, validateBody(LoginUserSchema), (req, res, next) => {
  authController.login(req, res, next);
});

router.get('/me', authenticateToken, (req, res, next) => {
  authController.getMe(req, res, next);
});

router.post('/logout', authenticateToken, (req, res) => {
  authController.logout(req, res);
});

export default router;
