import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import { submissions } from '../db/schema.js';

export async function findSubmissionByAssignmentAndStudent(assignmentId, studentId) {
  const rows = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, studentId)))
    .limit(1);
  return rows[0] || null;
}

export async function findSubmissionById(id) {
  const rows = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  return rows[0] || null;
}

export async function createSubmission(values) {
  await db.insert(submissions).values(values);
  return values;
}

export async function updateSubmissionById(id, values) {
  await db.update(submissions).set(values).where(eq(submissions.id, id));
  const rows = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  return rows[0] || null;
}

export async function listSubmissionsByStudent(studentId) {
  return db.select().from(submissions).where(eq(submissions.studentId, studentId));
}

export async function listSubmissionsByAssignmentIds(assignmentIds) {
  if (!assignmentIds.length) {
    return [];
  }
  return db.select().from(submissions).where(inArray(submissions.assignmentId, assignmentIds));
}

export async function gradeSubmission(submissionId, grade, feedback) {
  return updateSubmissionById(submissionId, {
    grade,
    feedback,
    gradedAt: new Date().toISOString()
  });
}
