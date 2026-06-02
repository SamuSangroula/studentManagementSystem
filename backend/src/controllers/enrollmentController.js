import { v4 as uuid } from 'uuid';
import { findCourseByIdAndTeacher, findCourseById } from '../models/courseModel.js';
import { findUserById } from '../models/userModel.js';
import {
  enrollStudent,
  isStudentEnrolled,
  getEnrolledStudents,
  removeStudentEnrollment,
  getStudentCourses
} from '../models/enrollmentModel.js';

export async function enrollStudentInCourse(req, res) {
  const { courseId } = req.params;
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  // Verify teacher owns the course
  const course = await findCourseByIdAndTeacher(courseId, req.user.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  // Verify student exists
  const student = await findUserById(studentId);
  if (!student || student.role !== 'student') {
    return res.status(404).json({ message: 'Student not found' });
  }

  // Check if already enrolled
  const isEnrolled = await isStudentEnrolled(courseId, studentId);
  if (isEnrolled) {
    return res.status(409).json({ message: 'Student already enrolled' });
  }

  await enrollStudent(courseId, studentId);
  return res.status(201).json({ message: 'Student enrolled successfully' });
}

export async function removeStudentFromCourse(req, res) {
  const { courseId, studentId } = req.params;

  // Verify teacher owns the course
  const course = await findCourseByIdAndTeacher(courseId, req.user.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  await removeStudentEnrollment(courseId, studentId);
  return res.json({ message: 'Student removed from course' });
}

export async function getCourseStudents(req, res) {
  const { courseId } = req.params;

  // Verify teacher owns the course
  const course = await findCourseByIdAndTeacher(courseId, req.user.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const enrollments = await getEnrolledStudents(courseId);
  return res.json({ students: enrollments });
}

export async function getStudentEnrolledCourses(req, res) {
  const enrollments = await getStudentCourses(req.user.id);
  return res.json({ courses: enrollments });
}

export async function getCourseDetails(req, res) {
  const { id } = req.params;

  const course = await findCourseById(id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  // If teacher, show enrolled students
  let enrolledStudents = [];
  if (req.user.role === 'teacher' && course.teacherId === req.user.id) {
    const enrollments = await getEnrolledStudents(id);
    enrolledStudents = enrollments.map((e) => e.studentId);
  } else if (req.user.role === 'student') {
    // Check if student is enrolled
    const isEnrolled = await isStudentEnrolled(id, req.user.id);
    if (!isEnrolled) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }
  }

  return res.json({ course: { ...course, enrolledStudents } });
}
