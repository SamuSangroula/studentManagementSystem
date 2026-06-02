import { v4 as uuid } from 'uuid';
import { unlink } from 'fs/promises';
import path from 'path';
import { findAssignmentById } from '../models/assignmentModel.js';
import {
  findSubmissionByAssignmentAndStudent,
  listSubmissionsByStudent,
  createSubmission,
  updateSubmissionById
} from '../models/submissionModel.js';
import { listAllAssignments } from '../models/assignmentModel.js';
import { listAllCourses } from '../models/courseModel.js';
import { listUsers } from '../models/userModel.js';

function toUploadPublicPath(file) {
  if (!file?.filename) {
    return null;
  }
  return `/uploads/${file.filename}`;
}

function toAbsoluteUploadPath(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
    return null;
  }
  const fileName = fileUrl.replace('/uploads/', '');
  return path.join(process.cwd(), 'uploads', fileName);
}

async function tryDeleteFile(fileUrl) {
  const absolutePath = toAbsoluteUploadPath(fileUrl);
  if (!absolutePath) {
    return;
  }

  try {
    await unlink(absolutePath);
  } catch {
    // Ignore missing file or filesystem cleanup failures during resubmission.
  }
}

// ===== Enhanced Student Submission with File Upload =====
export async function submitAssignmentWithFile(req, res) {
  const content = req.body?.content?.trim() || '';
  const { id: assignmentId } = req.params;

  console.log('--- Submission Debug ---', {
    assignmentId,
    studentId: req.user.id,
    body: req.body,
    file: req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype } : 'none'
  });

  // Allow submission with either content or file, or both
  if (!content && !req.file) {
    console.error('Submission Error: No content and no file provided.');
    return res.status(400).json({ message: 'Submission content or file is required' });
  }

  const assignment = await findAssignmentById(assignmentId);
  console.log('Found Assignment:', assignment ? 'Yes' : 'No');
  
  if (!assignment) {
    console.error('Submission Error: Assignment not found');
    return res.status(404).json({ message: 'Assignment not found' });
  }

  const existing = await findSubmissionByAssignmentAndStudent(assignmentId, req.user.id);
  console.log('Existing Submission found:', existing ? 'Yes (Id: ' + existing.id + ')' : 'No');

  const submissionData = {
    content: content || null,
    submittedAt: new Date().toISOString()
  };

  // If file is uploaded, add file info
  if (req.file) {
    submissionData.fileUrl = toUploadPublicPath(req.file);
    submissionData.fileName = req.file.originalname;
  }

  if (existing) {
    if (req.file && existing.fileUrl && existing.fileUrl !== submissionData.fileUrl) {
      await tryDeleteFile(existing.fileUrl);
    }

    // Update existing submission
    const updated = await updateSubmissionById(existing.id, submissionData);
    return res.json({ submission: updated, updated: true });
  }

  // Create new submission
  const submission = {
    id: uuid(),
    assignmentId,
    studentId: req.user.id,
    ...submissionData
  };

  await createSubmission(submission);
  return res.status(201).json({ submission, updated: false });
}

// ===== Get Student's Submission for Assignment =====
export async function getStudentSubmission(req, res) {
  const { assignmentId } = req.params;

  const submission = await findSubmissionByAssignmentAndStudent(assignmentId, req.user.id);
  if (!submission) {
    return res.status(404).json({ message: 'No submission found' });
  }

  return res.json({
    submission: {
      ...submission,
      fileUrl: submission.fileUrl || null
    }
  });
}

// ===== Get All Student Submissions with Grades =====
export async function getStudentSubmissionsWithGrades(req, res) {
  const [studentSubmissions, assignments, courses] = await Promise.all([
    listSubmissionsByStudent(req.user.id),
    listAllAssignments(),
    listAllCourses()
  ]);

  const assignmentMap = new Map(assignments.map((assignment) => [assignment.id, assignment]));
  const courseMap = new Map(courses.map((course) => [course.id, course]));

  const shaped = studentSubmissions.map((submission) => {
    const assignment = assignmentMap.get(submission.assignmentId);
    const course = assignment ? courseMap.get(assignment.courseId) : null;

    return {
      ...submission,
      assignmentTitle: assignment?.title || 'Unknown Assignment',
      courseName: course?.title || 'Unknown Course',
      fileUrl: submission.fileUrl || null
    };
  });

  return res.json({ submissions: shaped });
}
