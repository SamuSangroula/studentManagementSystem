import { and, desc, eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { materials } from '../db/schema.js';

export async function createMaterial(values) {
  await db.insert(materials).values(values);
  return values;
}

export async function listMaterials() {
  return db.select().from(materials).orderBy(desc(materials.createdAt));
}

export async function findMaterialById(id) {
  const rows = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  return rows[0] || null;
}

export async function getMaterialsByCourse(courseId) {
  return db
    .select()
    .from(materials)
    .where(eq(materials.courseId, courseId))
    .orderBy(desc(materials.createdAt));
}

export async function updateMaterialById(id, values) {
  await db.update(materials).set(values).where(eq(materials.id, id));
  const rows = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  return rows[0] || null;
}

export async function deleteMaterialById(id) {
  await db.delete(materials).where(eq(materials.id, id));
  return true;
}
