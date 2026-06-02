import { createCourse, deleteCourseById, findCourseByIdAndTeacher, listAllCourses, listCoursesByTeacher, updateCourseById } from '../models/courseModel.js';
import { deleteAssignmentsByCourseId } from '../models/assignmentModel.js';
import { v4 as uuid } from 'uuid';

export async function createCourseHandler(req, res) {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Course title is required' });
  }

  const course = {
    id: uuid(),
    title,
    description: description || '',
    teacherId: req.user.id,
    createdAt: new Date().toISOString()
  };

  await createCourse(course);
  return res.status(201).json({ course });
}

export async function listCoursesHandler(req, res) {
  if (req.user.role === 'teacher') {
    const courses = await listCoursesByTeacher(req.user.id);
    return res.json({ courses });
  }

  const courses = await listAllCourses();
  return res.json({ courses });
}

export async function updateCourseHandler(req, res) {
  const { title, description } = req.body;
  const course = await findCourseByIdAndTeacher(req.params.id, req.user.id);

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const updated = await updateCourseById(course.id, {
    title: title || course.title,
    description: description ?? course.description
  });

  return res.json({ course: updated });
}

export async function deleteCourseHandler(req, res) {
  const course = await findCourseByIdAndTeacher(req.params.id, req.user.id);

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  await deleteAssignmentsByCourseId(course.id);
  await deleteCourseById(course.id);
  return res.json({ message: 'Deleted' });
}
