import express from 'express';
import { allowRoles, authRequired } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { upload } from '../middleware/upload.js';
import { login, me, register } from '../controllers/authController.js';
import { markPresent, myAttendance } from '../controllers/attendanceController.js';
import {
  createCourseHandler,
  deleteCourseHandler,
  listCoursesHandler,
  updateCourseHandler
} from '../controllers/courseController.js';
import {
  createAssignmentHandler,
  listAssignmentsHandler,
  listTeacherSubmissions,
  submitAssignment
} from '../controllers/assignmentController.js';
import { studentDashboard } from '../controllers/studentController.js';
import {
  createMaterialHandler,
  createNoticeHandler,
  listMaterialsHandler,
  listNoticesHandler,
  deleteNoticeHandler,
  updateNoticeHandler,
  deleteMaterialHandler,
  updateMaterialHandler,
  createCourseMaterialHandler
} from '../controllers/contentController.js';
import {
  createUserHandler,
  deleteUserHandler,
  listUsersHandler,
  resetPasswordHandler,
  updateUserHandler
} from '../controllers/adminController.js';
import {
  enrollStudentInCourse,
  removeStudentFromCourse,
  getCourseStudents,
  getStudentEnrolledCourses,
  getCourseDetails
} from '../controllers/enrollmentController.js';
import {
  getAssignmentDetails,
  gradeSubmissionHandler,
  getCourseMaterials
} from '../controllers/enhancedAssignmentController.js';
import {
  submitAssignmentWithFile,
  getStudentSubmission,
  getStudentSubmissionsWithGrades
} from '../controllers/enhancedSubmissionController.js';


const router = express.Router();

router.post('/auth/register', asyncHandler(register));
router.post('/auth/login', asyncHandler(login));
router.get('/me', authRequired, asyncHandler(me));

router.post('/attendance/present', authRequired, allowRoles('student'), asyncHandler(markPresent));
router.get('/attendance/me', authRequired, allowRoles('student'), asyncHandler(myAttendance));

router.post('/courses', authRequired, allowRoles('teacher'), asyncHandler(createCourseHandler));
router.get('/courses', authRequired, asyncHandler(listCoursesHandler));
router.get('/courses/:id', authRequired, asyncHandler(getCourseDetails));
router.put('/courses/:id', authRequired, allowRoles('teacher'), asyncHandler(updateCourseHandler));
router.delete('/courses/:id', authRequired, allowRoles('teacher'), asyncHandler(deleteCourseHandler));

router.post('/courses/:courseId/enroll', authRequired, allowRoles('teacher'), asyncHandler(enrollStudentInCourse));
router.delete('/courses/:courseId/enroll/:studentId', authRequired, allowRoles('teacher'), asyncHandler(removeStudentFromCourse));
router.get('/courses/:courseId/students', authRequired, allowRoles('teacher'), asyncHandler(getCourseStudents));
router.get('/student/courses', authRequired, allowRoles('student'), asyncHandler(getStudentEnrolledCourses));

router.post('/assignments', authRequired, allowRoles('teacher'), upload.single('file'), asyncHandler(createAssignmentHandler));
router.get('/assignments', authRequired, asyncHandler(listAssignmentsHandler));
router.get('/assignments/:id', authRequired, asyncHandler(getAssignmentDetails));
router.get('/courses/:courseId/assignments', authRequired, asyncHandler(async (req, res) => {
  const { getAssignmentsByCourse } = await import('../models/assignmentModel.js');
  const assignments = await getAssignmentsByCourse(req.params.courseId);
  res.json({ assignments });
}));


router.get('/teacher/submissions', authRequired, allowRoles('teacher'), asyncHandler(listTeacherSubmissions));
router.post('/student/assignments/:id/submit', authRequired, allowRoles('student'), upload.single('file'), asyncHandler(submitAssignmentWithFile));
router.get('/student/assignments/:assignmentId/submission', authRequired, allowRoles('student'), asyncHandler(getStudentSubmission));
router.get('/student/submissions', authRequired, allowRoles('student'), asyncHandler(getStudentSubmissionsWithGrades));
router.put('/teacher/submissions/:submissionId/grade', authRequired, allowRoles('teacher'), asyncHandler(gradeSubmissionHandler));

router.get('/student/dashboard', authRequired, allowRoles('student'), asyncHandler(studentDashboard));

router.post('/materials', authRequired, allowRoles('teacher', 'admin'), upload.single('file'), asyncHandler(createMaterialHandler));
router.post('/courses/:courseId/materials', authRequired, allowRoles('teacher', 'admin'), upload.single('file'), asyncHandler(createCourseMaterialHandler));
router.get('/materials', authRequired, asyncHandler(listMaterialsHandler));
router.get('/courses/:courseId/materials', authRequired, asyncHandler(getCourseMaterials));
router.put('/materials/:id', authRequired, asyncHandler(updateMaterialHandler));
router.delete('/materials/:id', authRequired, asyncHandler(deleteMaterialHandler));

router.post('/notices', authRequired, allowRoles('teacher', 'admin'), asyncHandler(createNoticeHandler));
router.get('/notices', authRequired, asyncHandler(listNoticesHandler));
router.put('/notices/:id', authRequired, asyncHandler(updateNoticeHandler));
router.delete('/notices/:id', authRequired, asyncHandler(deleteNoticeHandler));

router.get('/admin/users', authRequired, allowRoles('admin'), asyncHandler(listUsersHandler));
router.post('/admin/users', authRequired, allowRoles('admin'), asyncHandler(createUserHandler));
router.put('/admin/users/:id', authRequired, allowRoles('admin'), asyncHandler(updateUserHandler));
router.put('/admin/users/:id/password', authRequired, allowRoles('admin'), asyncHandler(resetPasswordHandler));
router.delete('/admin/users/:id', authRequired, allowRoles('admin'), asyncHandler(deleteUserHandler));

export default router;
