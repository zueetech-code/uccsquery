import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByColumn, insert, update } from './db-client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id: number;
  uid: string;
  email: string;
  full_name?: string;
  role: string;
  is_admin: boolean;
}

export interface AuthToken {
  user: User;
  token: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      uid: user.uid,
      email: user.email,
      role: user.role,
      is_admin: user.is_admin,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function registerUser(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthToken> {
  // Check if user already exists
  const existingUser = await findByColumn('users', 'email', email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(password);
  const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const user = await insert('users', {
    uid,
    email,
    password_hash: passwordHash,
    full_name: fullName || '',
    role: 'user',
    is_admin: false,
  });

  const token = generateToken(user);
  return { user, token };
}

export async function loginUser(email: string, password: string): Promise<AuthToken> {
  const user = await findByColumn('users', 'email', email);
  if (!user) {
    throw new Error('User not found');
  }

  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid password');
  }

  const token = generateToken(user);
  return { user, token };
}

export async function updateUserProfile(
  userId: number,
  data: { full_name?: string; email?: string }
): Promise<User> {
  return update('users', userId, data);
}

export async function getUserById(userId: number): Promise<User | null> {
  const result = await findByColumn('users', 'id', userId);
  return result || null;
}
