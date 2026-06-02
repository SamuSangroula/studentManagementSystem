import { mysqlTable, varchar, text, boolean, decimal, int } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 191 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 32 }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: varchar('created_at', { length: 40 }).notNull()
});

export const attendance = mysqlTable('attendance', {
  id: varchar('id', { length: 191 }).primaryKey(),
  studentId: varchar('student_id', { length: 191 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  markedAt: varchar('marked_at', { length: 40 }).notNull()
});

export const courses = mysqlTable('courses', {
  id: varchar('id', { length: 191 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  teacherId: varchar('teacher_id', { length: 191 }).notNull(),
  createdAt: varchar('created_at', { length: 40 }).notNull()
});

export const assignments = mysqlTable('assignments', {
  id: varchar('id', { length: 191 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  dueDate: varchar('due_date', { length: 40 }),
  courseId: varchar('course_id', { length: 191 }).notNull(),
  teacherId: varchar('teacher_id', { length: 191 }).notNull(),
  fileUrl: text('file_url'),
  createdAt: varchar('created_at', { length: 40 }).notNull()
});

export const courseEnrollments = mysqlTable('course_enrollments', {
  id: varchar('id', { length: 191 }).primaryKey(),
  courseId: varchar('course_id', { length: 191 }).notNull(),
  studentId: varchar('student_id', { length: 191 }).notNull(),
  enrolledAt: varchar('enrolled_at', { length: 40 }).notNull(),
  // Composite unique key: (courseId, studentId)
});

export const submissions = mysqlTable('submissions', {
  id: varchar('id', { length: 191 }).primaryKey(),
  assignmentId: varchar('assignment_id', { length: 191 }).notNull(),
  studentId: varchar('student_id', { length: 191 }).notNull(),
  content: text('content'),
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  grade: decimal('grade', { precision: 5, scale: 2 }),
  feedback: text('feedback'),
  submittedAt: varchar('submitted_at', { length: 40 }).notNull(),
  gradedAt: varchar('graded_at', { length: 40 })
});

export const materials = mysqlTable('materials', {
  id: varchar('id', { length: 191 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 32 }).notNull(),
  url: text('url').notNull(),
  courseId: varchar('course_id', { length: 191 }),
  createdBy: varchar('created_by', { length: 191 }).notNull(),
  createdAt: varchar('created_at', { length: 40 }).notNull()
});

export const notices = mysqlTable('notices', {
  id: varchar('id', { length: 191 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  createdBy: varchar('created_by', { length: 191 }).notNull(),
  createdAt: varchar('created_at', { length: 40 }).notNull()
});
