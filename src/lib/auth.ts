import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type User, type Session } from "@/db/schema";

export const SESSION_COOKIE_NAME = "marketpam_session";
const SESSION_DURATION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    token,
    userId,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function validateSessionToken(token: string): Promise<{ user: User; session: Session } | null> {
  if (!token) return null;

  const [result] = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!result) {
    return null;
  }

  return {
    user: result.user,
    session: result.session,
  };
}

export async function invalidateSession(token: string): Promise<void> {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function invalidateAllUserSessions(userId: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const validated = await validateSessionToken(token);
    if (!validated) {
      return null;
    }
    return validated.user;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function safeUser(user: User) {
  const { passwordHash, resetToken, resetExpires, ...safe } = user;
  return safe;
}

export type SafeUser = ReturnType<typeof safeUser>;
