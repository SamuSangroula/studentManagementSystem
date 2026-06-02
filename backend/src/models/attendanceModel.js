import { and, desc, eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { attendance } from '../db/schema.js';

export async function findAttendanceByStudentAndDate(studentId, date) {
  const rows = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.studentId, studentId), eq(attendance.date, date)))
    .limit(1);
  return rows[0] || null;
}

export async function createAttendance(values) {
  await db.insert(attendance).values(values);
  return values;
}

export async function listAttendanceByStudent(studentId) {
  return db
    .select()
    .from(attendance)
    .where(eq(attendance.studentId, studentId))
    .orderBy(desc(attendance.date));
}
