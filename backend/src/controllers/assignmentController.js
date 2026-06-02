import { v4 as uuid } from 'uuid';
import { createAssignment, findAssignmentById, listAllAssignments, listAssignmentsByTeacher } from '../models/assignmentModel.js';
import { findCourseByIdAndTeacher, listAllCourses } from '../models/courseModel.js';
import {
  createSubmission,
  findSubmissionByAssignmentAndStudent,
  listSubmissionsByAssignmentIds,
  updateSubmissionById
} from '../models/submissionModel.js';
import { listUsers } from '../models/userModel.js';

export async function createAssignmentHandler(req, res) {
  const { title, description, dueDate, courseId } = req.body;

  if (!title || !courseId) {
    return res.status(400).json({ message: 'Title and course are required' });
  }

  const course = await findCourseByIdAndTeacher(courseId, req.user.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const assignment = {
    id: uuid(),
    title,
    description: description || '',
    dueDate: dueDate || null,
    courseId,
    teacherId: req.user.id,
    fileUrl,
    createdAt: new Date().toISOString()
  };

  await createAssignment(assignment);
  return res.status(201).json({ assignment });
}

export async function listAssignmentsHandler(req, res) {
  if (req.user.role === 'teacher') {
    const assignments = await listAssignmentsByTeacher(req.user.id);
    return res.json({ assignments });
  }

  const assignments = await listAllAssignments();
  return res.json({ assignments });
}

export async function listTeacherSubmissions(req, res) {
  // Find all courses where this user is the teacher
  const allCourses = await listAllCourses();
  const teacherCourses = allCourses.filter(c => c.teacherId === req.user.id);
  const teacherCourseIds = teacherCourses.map(c => c.id);

  // Find all assignments belonging to these courses OR created by this teacher
  const allAssignments = await listAllAssignments();
  const teacherAssignments = allAssignments.filter(a => 
    teacherCourseIds.includes(a.courseId) || a.teacherId === req.user.id
  );
  
  const assignmentIds = teacherAssignments.map((a) => a.id);
  if (assignmentIds.length === 0) {
    return res.json({ submissions: [] });
  }

  const submissions = await listSubmissionsByAssignmentIds(assignmentIds);
  const users = await listUsers();

  const shaped = submissions.map((submission) => {
    const student = users.find((user) => user.id === submission.studentId);
    const assignment = teacherAssignments.find((item) => item.id === submission.assignmentId);
    const course = teacherCourses.find(c => c.id === assignment?.courseId);
    
    return {
      ...submission,
      studentName: student?.name || 'Unknown',
      studentEmail: student?.email || 'Unknown',
      assignmentTitle: assignment?.title || 'Unknown',
      courseName: course?.title || 'Unknown'
    };
  });

  return res.json({ submissions: shaped });
}

export async function submitAssignment(req, res) {
  const { content } = req.body;
  const assignmentId = req.params.id;

  if (!content) {
    return res.status(400).json({ message: 'Submission content is required' });
  }

  const assignment = await findAssignmentById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  const existing = await findSubmissionByAssignmentAndStudent(assignmentId, req.user.id);
  if (existing) {
    const updated = await updateSubmissionById(existing.id, {
      content,
      submittedAt: new Date().toISOString()
    });
    return res.json({ submission: updated, updated: true });
  }

  const submission = {
    id: uuid(),
    assignmentId,
    studentId: req.user.id,
    content,
    submittedAt: new Date().toISOString()
  };

  await createSubmission(submission);
  return res.status(201).json({ submission, updated: false });
}
