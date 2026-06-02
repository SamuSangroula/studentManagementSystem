import { desc, eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { notices } from '../db/schema.js';

export async function createNotice(values) {
  await db.insert(notices).values(values);
  return values;
}

export async function listNotices() {
  return db.select().from(notices).orderBy(desc(notices.createdAt));
}

export async function findNoticeById(id) {
  const rows = await db.select().from(notices).where(eq(notices.id, id)).limit(1);
  return rows[0] || null;
}

export async function deleteNoticeById(id) {
  await db.delete(notices).where(eq(notices.id, id));
  return true;
}

export async function updateNoticeById(id, values) {
  await db.update(notices).set(values).where(eq(notices.id, id));
  const rows = await db.select().from(notices).where(eq(notices.id, id)).limit(1);
  return rows[0] || null;
}
