import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { SUPPORTED_CURRENCIES } from '@koin/shared';

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS Whitelist
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por política CORS de Koin'));
      }
    },
    credentials: true,
  })
);

// 3. HTTP Parameter Pollution Protection
app.use(hpp());

// 4. Body Parsers with Strict Size Limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 5. Global Rate Limiter (100 req / 15 min per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
  },
});
app.use('/api/', globalLimiter);

// 6. Mount API Routes
import authRoutes from './modules/auth/auth.routes';
app.use('/api/v1/auth', authRoutes);

// Base Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'koin-api',
    uptime: process.uptime(),
    supportedCurrencies: Object.keys(SUPPORTED_CURRENCIES),
  });
});

// 7. Swagger Document Specification
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Koin Finance API',
    version: '1.0.0',
    description: 'API REST Segura y de Alta Velocidad para Koin Finanzas Personales',
  },
  servers: [
    {
      url: '/api',
      description: 'Current Environment API Base',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health Check del Sistema',
        responses: {
          '200': {
            description: 'Servicio en estado saludable',
          },
        },
      },
    },
    '/v1/auth/register': {
      post: {
        summary: 'Registro de Cuenta Titular con Semilla Base (Argon2id)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', example: 'dylan@koin.app' },
                  password: { type: 'string', example: 'Password123' },
                  fullName: { type: 'string', example: 'Dylan Gamero' },
                  baseCurrency: { type: 'string', example: 'USD' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Usuario y perfil inicial creados exitosamente' },
          '400': { description: 'Datos de entrada inválidos' },
          '409': { description: 'Correo electrónico ya registrado' },
        },
      },
    },
    '/v1/auth/login': {
      post: {
        summary: 'Inicio de Sesión Seguro (Protección Anti-Fuerza Bruta)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'dylan@koin.app' },
                  password: { type: 'string', example: 'Password123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Sesión iniciada con éxito y JWT emitido' },
          '401': { description: 'Credenciales inválidas' },
          '429': { description: 'Límite de intentos excedido (5 intentos / 15 min)' },
        },
      },
    },
    '/v1/auth/me': {
      get: {
        summary: 'Obtener información de usuario y perfiles de la sesión',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Datos del usuario autenticado' },
          '401': { description: 'No autenticado' },
        },
      },
    },
  },
};

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 8. Serve Frontend Static SPA in Production (Unified Dyno)
const webDistPath = path.join(__dirname, '../../web/dist');
app.use(express.static(webDistPath));

app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta de API no encontrada' });
  }
  res.sendFile(path.join(webDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Koin API is running. Build frontend with `npm run build` to serve web app.');
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Koin API] Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`[Koin Docs] Documentación Swagger disponible en http://localhost:${PORT}/api/docs`);
  });
}

export default app;
