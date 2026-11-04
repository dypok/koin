import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users, profiles, accounts, accountMembers, categories } from '../../db/schema';
import { DEFAULT_CATEGORIES } from '@koin/shared';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  baseCurrency: string;
}

export class AuthRepository {
  async findUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    return result[0] || null;
  }

  async findUserById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async findProfilesByUserId(userId: string) {
    return db.select().from(profiles).where(eq(profiles.userId, userId));
  }

  /**
   * Atomic transactional creation of User + Default Profile + Default Accounts + Categories.
   * Ensures complete seed state in a single ACID transaction.
   */
  async createUserWithSeedData(data: CreateUserData) {
    return db.transaction(async (tx) => {
      // 1. Create Master User
      const [newUser] = await tx
        .insert(users)
        .values({
          email: data.email.toLowerCase().trim(),
          passwordHash: data.passwordHash,
          fullName: data.fullName.trim(),
        })
        .returning();

      // 2. Create Default Initial Profile ("Personal")
      const [newProfile] = await tx
        .insert(profiles)
        .values({
          userId: newUser.id,
          name: 'Personal',
          avatarIcon: 'User',
          themeConfig: {
            preset: 'gold',
            primaryHex: '#F59E0B',
            accentHex: '#FCD34D',
            baseMode: 'dark',
          },
          baseCurrency: data.baseCurrency || 'USD',
          hasPin: false,
          useBiometrics: false,
        })
        .returning();

      // 3. Create Default Accounts ("Billetera Efectivo" & "Cuenta Bancaria")
      const defaultAccountsToInsert = [
        {
          createdByProfileId: newProfile.id,
          name: 'Billetera Efectivo',
          type: 'cash' as const,
          currency: data.baseCurrency || 'USD',
          initialBalance: '0.00',
          currentBalance: '0.00',
          isShared: false,
          color: '#F59E0B',
          icon: 'Wallet',
        },
        {
          createdByProfileId: newProfile.id,
          name: 'Cuenta Bancaria',
          type: 'bank' as const,
          currency: data.baseCurrency || 'USD',
          initialBalance: '0.00',
          currentBalance: '0.00',
          isShared: false,
          color: '#3B82F6',
          icon: 'Building2',
        },
      ];

      const insertedAccounts = await tx
        .insert(accounts)
        .values(defaultAccountsToInsert)
        .returning();

      // 4. Create Account Memberships (Owner role)
      const membershipsToInsert = insertedAccounts.map((account) => ({
        accountId: account.id,
        profileId: newProfile.id,
        role: 'owner' as const,
        status: 'accepted' as const,
      }));

      await tx.insert(accountMembers).values(membershipsToInsert);

      // 5. Create Default Categories with SVG icons
      const categoriesToInsert = DEFAULT_CATEGORIES.map((cat) => ({
        profileId: newProfile.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
        isDefault: true,
      }));

      const insertedCategories = await tx
        .insert(categories)
        .values(categoriesToInsert)
        .returning();

      return {
        user: newUser,
        profile: newProfile,
        accounts: insertedAccounts,
        categories: insertedCategories,
      };
    });
  }
}

export const authRepository = new AuthRepository();
