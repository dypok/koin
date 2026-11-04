import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { RegisterUserInput, LoginUserInput, UserDTO, ProfileDTO } from '@koin/shared';
import { authRepository, AuthRepository } from './auth.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_koin_change_in_production_min32';
const JWT_EXPIRES_IN = '7d';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  /**
   * Hashes plain text password with Argon2id using OWASP recommended parameters.
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,       // 3 iterations
      parallelism: 1,
    });
  }

  /**
   * Verifies password against hash using timing-safe comparison.
   */
  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  /**
   * Generates a signed JWT session token.
   */
  generateToken(payload: { userId: string; email: string; profileId?: string }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Registers a new Master Account and seeds initial profile and accounts.
   */
  async register(input: RegisterUserInput) {
    const existing = await this.repo.findUserByEmail(input.email);
    if (existing) {
      throw new AppError(409, 'El correo electrónico ya se encuentra registrado en Koin.');
    }

    const passwordHash = await this.hashPassword(input.password);

    const { user, profile, accounts, categories } = await this.repo.createUserWithSeedData({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      baseCurrency: input.baseCurrency || 'USD',
    });

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      profileId: profile.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      profile: {
        id: profile.id,
        userId: profile.userId,
        name: profile.name,
        avatarIcon: profile.avatarIcon,
        themeConfig: profile.themeConfig,
        baseCurrency: profile.baseCurrency,
        hasPin: profile.hasPin,
        useBiometrics: profile.useBiometrics,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
      accountsCount: accounts.length,
      categoriesCount: categories.length,
      token,
    };
  }

  /**
   * Authenticates Master Account credentials and returns session tokens.
   */
  async login(input: LoginUserInput) {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) {
      throw new AppError(401, 'Credenciales de acceso inválidas.');
    }

    const isValid = await this.verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new AppError(401, 'Credenciales de acceso inválidas.');
    }

    const profiles = await this.repo.findProfilesByUserId(user.id);
    const activeProfile = profiles[0] || null;

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      profileId: activeProfile?.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      profiles: profiles.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.name,
        avatarIcon: p.avatarIcon,
        themeConfig: p.themeConfig,
        baseCurrency: p.baseCurrency,
        hasPin: p.hasPin,
        useBiometrics: p.useBiometrics,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      activeProfile: activeProfile
        ? {
            id: activeProfile.id,
            userId: activeProfile.userId,
            name: activeProfile.name,
            avatarIcon: activeProfile.avatarIcon,
            themeConfig: activeProfile.themeConfig,
            baseCurrency: activeProfile.baseCurrency,
            hasPin: activeProfile.hasPin,
            useBiometrics: activeProfile.useBiometrics,
            createdAt: activeProfile.createdAt.toISOString(),
            updatedAt: activeProfile.updatedAt.toISOString(),
          }
        : null,
      token,
    };
  }

  /**
   * Retrieves profile details and current user info for an authenticated session.
   */
  async getMe(userId: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new AppError(404, 'Usuario no encontrado.');
    }

    const profiles = await this.repo.findProfilesByUserId(userId);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      profiles: profiles.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.name,
        avatarIcon: p.avatarIcon,
        themeConfig: p.themeConfig,
        baseCurrency: p.baseCurrency,
        hasPin: p.hasPin,
        useBiometrics: p.useBiometrics,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  }
}

export const authService = new AuthService();
