import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { courses } from '../db/schema.js';

export async function createCourse(values) {
  await db.insert(courses).values(values);
  return values;
}

export async function listCoursesByTeacher(teacherId) {
  return db.select().from(courses).where(eq(courses.teacherId, teacherId));
}

export async function listAllCourses() {
  return db.select().from(courses);
}

export async function findCourseById(id) {
  const rows = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return rows[0] || null;
}

export async function findCourseByIdAndTeacher(id, teacherId) {
  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id));
  const course = rows[0] || null;
  if (!course || course.teacherId !== teacherId) {
    return null;
  }
  return course;
}

export async function updateCourseById(id, values) {
  await db.update(courses).set(values).where(eq(courses.id, id));
  const rows = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return rows[0] || null;
}

export async function deleteCourseById(id) {
  const rows = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  const course = rows[0] || null;
  if (!course) {
    return null;
  }
  await db.delete(courses).where(eq(courses.id, id));
  return course;
}
