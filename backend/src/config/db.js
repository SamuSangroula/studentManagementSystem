import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

export const pool = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = drizzle(pool);

export async function bootstrapDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at VARCHAR(40) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      date VARCHAR(10) NOT NULL,
      status VARCHAR(32) NOT NULL,
      marked_at VARCHAR(40) NOT NULL,
      UNIQUE KEY attendance_student_date_unique (student_id, date)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      teacher_id VARCHAR(191) NOT NULL,
      created_at VARCHAR(40) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      due_date VARCHAR(40) NULL,
      course_id VARCHAR(191) NOT NULL,
      teacher_id VARCHAR(191) NOT NULL,
      file_url TEXT NULL,
      created_at VARCHAR(40) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id VARCHAR(191) PRIMARY KEY,
      course_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      enrolled_at VARCHAR(40) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id VARCHAR(191) PRIMARY KEY,
      assignment_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      content TEXT NULL,
      file_url TEXT NULL,
      file_name VARCHAR(255) NULL,
      grade DECIMAL(5, 2) NULL,
      feedback TEXT NULL,
      submitted_at VARCHAR(40) NOT NULL,
      graded_at VARCHAR(40) NULL,
      UNIQUE KEY submissions_assignment_student_unique (assignment_id, student_id)
    )
  `);

  // Migration: Add missing columns if they don't exist
  try { await pool.query('ALTER TABLE assignments ADD COLUMN file_url TEXT NULL'); } catch (e) {}
  try { await pool.query('ALTER TABLE submissions MODIFY COLUMN content TEXT NULL'); } catch (e) {}
  try { await pool.query('ALTER TABLE submissions ADD COLUMN file_url TEXT NULL'); } catch (e) {}
  try { await pool.query('ALTER TABLE submissions ADD COLUMN file_name VARCHAR(255) NULL'); } catch (e) {}
  try { await pool.query('ALTER TABLE submissions ADD COLUMN grade DECIMAL(5, 2) NULL'); } catch (e) {}
  try { await pool.query('ALTER TABLE submissions ADD COLUMN feedback TEXT NULL'); } catch (e) {}
  try { await pool.query('ALTER TABLE submissions ADD COLUMN graded_at VARCHAR(40) NULL'); } catch (e) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS materials (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(32) NOT NULL,
      url TEXT NOT NULL,
      course_id VARCHAR(191) NULL,
      created_by VARCHAR(191) NOT NULL,
      created_at VARCHAR(40) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notices (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      created_by VARCHAR(191) NOT NULL,
      created_at VARCHAR(40) NOT NULL
    )
  `);
}
