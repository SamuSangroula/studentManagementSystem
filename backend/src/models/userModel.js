import { and, eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users } from '../db/schema.js';

export function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: Boolean(user.active),
    createdAt: user.createdAt
  };
}

export async function findUserByEmail(email) {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] || null;
}

export async function findActiveUserById(id) {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.active, true)))
    .limit(1);
  return rows[0] || null;
}

export async function createUser(data) {
  await db.insert(users).values(data);
  return data;
}

export async function listUsers() {
  return db.select().from(users);
}

export async function findUserById(id) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] || null;
}

export async function updateUserById(id, values) {
  await db.update(users).set(values).where(eq(users.id, id));
  return findUserById(id);
}

export async function deleteUserById(id) {
  const user = await findUserById(id);
  if (!user) {
    return null;
  }
  await db.delete(users).where(eq(users.id, id));
  return user;
}
