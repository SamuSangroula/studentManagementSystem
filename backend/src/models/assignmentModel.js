import { and, eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { assignments } from '../db/schema.js';

export async function createAssignment(values) {
  await db.insert(assignments).values(values);
  return values;
}

export async function listAssignmentsByTeacher(teacherId) {
  return db.select().from(assignments).where(eq(assignments.teacherId, teacherId));
}

export async function listAllAssignments() {
  return db.select().from(assignments);
}

export async function getAssignmentsByCourse(courseId) {
  return db.select().from(assignments).where(eq(assignments.courseId, courseId));
}

export async function findAssignmentById(id) {
  const rows = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
  return rows[0] || null;
}

export async function deleteAssignmentsByCourseId(courseId) {
  await db.delete(assignments).where(eq(assignments.courseId, courseId));
}
