import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Users, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/shared/PageHeader';

export default function CourseDetailsPage({ token, user }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [enrollForm, setEnrollForm] = useState({ studentId: '' });
  const [materialForm, setMaterialForm] = useState({
    title: '',
    type: 'pdf',
    url: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCourseData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseRes, studentsRes, materialsRes, assignmentsRes, usersRes] =
        await Promise.all([
          api.getCourseDetails(courseId, token),
          user.role === 'teacher' ? api.getCourseStudents(courseId, token) : Promise.resolve({ students: [] }),
          api.getCourseMaterials(courseId, token),
          api.getCourseAssignments(courseId, token),
          user.role === 'teacher' ? api.listUsers(token) : Promise.resolve({ users: [] })
        ]);

      setCourse(courseRes.course);
      setStudents(studentsRes.students || []);
      setMaterials(materialsRes.materials || []);
      setAssignments(assignmentsRes.assignments || []);

      // Filter students who are not already enrolled
      if (user.role === 'teacher' && usersRes.users) {
        const enrolledIds = studentsRes.students?.map((s) => s.studentId) || [];
        setAllStudents(
          usersRes.users.filter((u) => u.role === 'student' && !enrolledIds.includes(u.id))
        );
      }
    } catch (requestError) {
      setError(requestError.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [courseId, token, user.role]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  async function enrollStudent(event) {
    event.preventDefault();
    if (!enrollForm.studentId) {
      setError('Please select a student');
      return;
    }

    try {
      await api.enrollStudent(courseId, { studentId: enrollForm.studentId }, token);
      setEnrollForm({ studentId: '' });
      await loadCourseData();
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Failed to enroll student');
    }
  }

  async function removeStudent(studentId) {
    if (!confirm('Remove this student from course?')) return;

    try {
      await api.removeStudentFromCourse(courseId, studentId, token);
      await loadCourseData();
    } catch (requestError) {
      setError(requestError.message || 'Failed to remove student');
    }
  }

  async function addMaterial(event) {
    event.preventDefault();
    if (!materialForm.title || !materialForm.url) {
      setError('Title and URL are required');
      return;
    }

    try {
      await api.createCourseMaterial(
        courseId,
        {
          title: materialForm.title,
          type: materialForm.type,
          url: materialForm.url,
          courseId
        },
        token
      );
      setMaterialForm({ title: '', type: 'pdf', url: '' });
      await loadCourseData();
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Failed to add material');
    }
  }

  if (loading) {
    return (
      <div className="function-page">
        <p className="status">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="function-page">
        <p className="status error">Course not found</p>
        <button className="primary-button" onClick={() => navigate('/courses')}>
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="function-page">
      <div className="page-header-with-button">
        <button
          className="icon-button"
          onClick={() => navigate('/courses')}
          title="Back to courses"
        >
          <ArrowLeft size={18} />
        </button>
        <PageHeader
          title={course.title}
          subtitle={course.description || 'No description provided'}
        />
      </div>

      {error && <p className="status error">{error}</p>}

      {user.role === 'teacher' && (
        <div className="course-details-grid">
          {/* Enrollment Section */}
          <div className="form-panel">
            <h3>
              <Users size={18} /> Manage Students
            </h3>
            <form onSubmit={enrollStudent}>
              <div className="form-row">
                <select
                  value={enrollForm.studentId}
                  onChange={(e) => setEnrollForm({ studentId: e.target.value })}
                >
                  <option value="">Select a student to enroll</option>
                  {allStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
                <button type="submit" className="primary-button">
                  <Plus size={16} /> Enroll
                </button>
              </div>
            </form>

            <div className="student-list">
              <h4>Enrolled Students ({students.length})</h4>
              {students.length === 0 ? (
                <p className="text-muted">No students enrolled yet</p>
              ) : (
                <ul>
                  {students.map((enrollment) => (
                    <li key={enrollment.id} className="student-item">
                      <span>Student ID: {enrollment.studentId}</span>
                      <button
                        className="danger-button"
                        onClick={() => removeStudent(enrollment.studentId)}
                        title="Remove student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Materials Section */}
          <div className="form-panel">
            <h3>Add Course Material</h3>
            <form onSubmit={addMaterial}>
              <div className="form-row">
                <input
                  placeholder="Material title"
                  value={materialForm.title}
                  onChange={(e) =>
                    setMaterialForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
                <select
                  value={materialForm.type}
                  onChange={(e) =>
                    setMaterialForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  <option value="pdf">PDF</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="link">Link</option>
                </select>
              </div>
              <div className="form-row">
                <input
                  placeholder="URL or file path"
                  value={materialForm.url}
                  onChange={(e) =>
                    setMaterialForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                  required
                />
                <button type="submit" className="primary-button">
                  <Plus size={16} /> Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Materials List */}
      {materials.length > 0 && (
        <div className="form-panel">
          <h3>Course Materials ({materials.length})</h3>
          <div className="materials-grid">
            {materials.map((material) => (
              <div key={material.id} className="material-card">
                <h4>{material.title}</h4>
                <p className="material-type">{material.type}</p>
                <a href={material.url} target="_blank" rel="noopener noreferrer" className="material-link">
                  Open Material <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments List */}
      {assignments.length > 0 && (
        <div className="form-panel">
          <h3>Course Assignments ({assignments.length})</h3>
          <div className="assignments-grid">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card">
                <h4>{assignment.title}</h4>
                {assignment.dueDate && (
                  <p className="due-date">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                )}
                <p className="assignment-description">{assignment.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
