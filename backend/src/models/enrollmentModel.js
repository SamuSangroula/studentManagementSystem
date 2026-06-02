import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import { courseEnrollments } from '../db/schema.js';

export async function enrollStudent(courseId, studentId) {
  const result = await db.insert(courseEnrollments).values({
    id: `ce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    courseId,
    studentId,
    enrolledAt: new Date().toISOString()
  });
  return result;
}

export async function isStudentEnrolled(courseId, studentId) {
  const rows = await db
    .select()
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.studentId, studentId)))
    .limit(1);
  return rows.length > 0;
}

export async function getEnrolledStudents(courseId) {
  return db
    .select()
    .from(courseEnrollments)
    .where(eq(courseEnrollments.courseId, courseId));
}

export async function removeStudentEnrollment(courseId, studentId) {
  return db
    .delete(courseEnrollments)
    .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.studentId, studentId)));
}

export async function getStudentCourses(studentId) {
  return db
    .select()
    .from(courseEnrollments)
    .where(eq(courseEnrollments.studentId, studentId));
}
