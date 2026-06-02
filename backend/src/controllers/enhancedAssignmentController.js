import { v4 as uuid } from 'uuid';
import { findAssignmentById, listAllAssignments } from '../models/assignmentModel.js';
import { findSubmissionById, gradeSubmission } from '../models/submissionModel.js';
import {
  createMaterial,
  deleteMaterialById,
  findMaterialById,
  updateMaterialById,
  getMaterialsByCourse
} from '../models/materialModel.js';

// ===== Assignment Details =====
export async function getAssignmentDetails(req, res) {
  const { id } = req.params;

  const assignment = await findAssignmentById(id);
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  return res.json({ assignment });
}

// ===== Grading =====
export async function gradeSubmissionHandler(req, res) {
  const { submissionId } = req.params;
  const { grade, feedback } = req.body;

  if (grade === undefined || grade === null) {
    return res.status(400).json({ message: 'Grade is required' });
  }

  const submission = await findSubmissionById(submissionId);
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  // Verify the teacher owns the assignment
  const assignment = await findAssignmentById(submission.assignmentId);
  if (assignment.teacherId !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized to grade this submission' });
  }

  const gradeNum = parseFloat(grade);
  if (isNaN(gradeNum) || gradeNum < 0) {
    return res.status(400).json({ message: 'Invalid grade' });
  }

  const updatedSubmission = await gradeSubmission(submissionId, gradeNum, feedback || null);
  return res.json({ submission: updatedSubmission });
}

// ===== Materials Management =====
export async function createCourseMaterialHandler(req, res) {
  const { title, type, url, courseId } = req.body;

  if (!title || !type || !url || !courseId) {
    return res.status(400).json({ message: 'Title, type, url, and courseId are required' });
  }

  const material = {
    id: uuid(),
    title,
    type,
    url,
    courseId,
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  await createMaterial(material);
  return res.status(201).json({ material });
}

export async function getCourseMaterials(req, res) {
  const { courseId } = req.params;

  const materials = await getMaterialsByCourse(courseId);
  return res.json({ materials });
}

export async function updateMaterialHandler(req, res) {
  const { id } = req.params;
  const { title, type, url, courseId } = req.body;

  const material = await findMaterialById(id);
  if (!material) {
    return res.status(404).json({ message: 'Material not found' });
  }

  // Verify owner
  if (material.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to update this material' });
  }

  const updates = {};
  if (title) updates.title = title;
  if (type) updates.type = type;
  if (url) updates.url = url;
  if (courseId) updates.courseId = courseId;

  const updated = await updateMaterialById(id, updates);
  return res.json({ material: updated });
}

export async function deleteMaterialHandler(req, res) {
  const { id } = req.params;

  const material = await findMaterialById(id);
  if (!material) {
    return res.status(404).json({ message: 'Material not found' });
  }

  // Verify owner
  if (material.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this material' });
  }

  await deleteMaterialById(id);
  return res.json({ message: 'Material deleted' });
}
