import { listAttendanceByStudent } from '../models/attendanceModel.js';
import { listAllAssignments } from '../models/assignmentModel.js';
import { listAllCourses } from '../models/courseModel.js';
import { listMaterials } from '../models/materialModel.js';
import { listNotices } from '../models/noticeModel.js';
import { listSubmissionsByStudent } from '../models/submissionModel.js';

export async function studentDashboard(req, res) {
  const [attendance, submissions, assignments, courses, notices, materials] = await Promise.all([
    listAttendanceByStudent(req.user.id),
    listSubmissionsByStudent(req.user.id),
    listAllAssignments(),
    listAllCourses(),
    listNotices(),
    listMaterials()
  ]);

  const mergedAssignments = assignments.map((assignment) => {
    const submitted = submissions.find((submission) => submission.assignmentId === assignment.id);
    const course = courses.find((item) => item.id === assignment.courseId);

    return {
      ...assignment,
      courseTitle: course?.title || 'Unknown',
      submitted: Boolean(submitted),
      submittedAt: submitted?.submittedAt || null
    };
  });

  return res.json({
    attendanceCount: attendance.length,
    assignments: mergedAssignments,
    notices,
    materials
  });
}
