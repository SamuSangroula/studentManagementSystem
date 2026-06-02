import { useCallback, useEffect, useState } from 'react';
import { 
  RefreshCw, 
  Plus, 
  BookOpen, 
  CheckCircle, 
  ClipboardList, 
  Users, 
  AlertTriangle, 
  Search, 
  Loader2, 
  Edit, 
  Trash2, 
  Inbox,
  Book,
  Notebook,
  Edit3,
  GraduationCap,
  PenTool
} from 'lucide-react';
import { api } from '../lib/api';

const COURSE_COLORS = ['blue', 'teal', 'purple', 'green', 'orange', 'pink'];

export default function CoursesPage({ token, user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [createForm, setCreateForm] = useState({ title: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listCourses(token);
      const courseList = Array.isArray(data) ? data : (data.courses || []);
      setCourses(courseList);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  async function createCourse(event) {
    event.preventDefault();
    try {
      await api.createCourse(createForm, token);
      setCreateForm({ title: '', description: '' });
      await loadCourses();
    } catch (requestError) {
      setError(requestError.message || 'Could not create course.');
    }
  }

  async function deleteCourse(courseId) {
    try {
      await api.deleteCourse(courseId, token);
      setDeleteConfirm(null);
      await loadCourses();
    } catch (requestError) {
      setError(requestError.message || 'Could not delete course.');
    }
  }

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const coursesStats = {
    total: courses.length,
    active: courses.filter((c) => c.status !== 'draft').length,
    drafts: courses.filter((c) => c.status === 'draft').length,
    students: 42
  };

  const getColorClass = (index) => {
    return COURSE_COLORS[index % COURSE_COLORS.length];
  };

  const getCourseIcon = (index) => {
    const icons = [
      <BookOpen size={24} />, 
      <Book size={24} />, 
      <Notebook size={24} />, 
      <Edit3 size={24} />, 
      <GraduationCap size={24} />, 
      <PenTool size={24} />
    ];
    return icons[index % icons.length];
  };

  return (
    <div className="courses-page">
      {/* Header Section */}
      <div className="courses-header">
        <div className="header-content">
          <h1>Courses</h1>
          <p>Manage curriculum and visibility of course content</p>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => loadCourses()} title="Refresh">
            <RefreshCw size={20} className={loading ? 'spin' : ''} />
          </button>
          {user.role === 'teacher' && (
            <button className="action-btn" title="Create Course">
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="courses-stats">
        <div className="stats-card">
          <div className="stats-icon"><BookOpen size={24} /></div>
          <div>
            <div className="stats-value">{coursesStats.total}</div>
            <div className="stats-label">Courses</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon"><CheckCircle size={24} /></div>
          <div>
            <div className="stats-value">{coursesStats.active}</div>
            <div className="stats-label">Active</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon"><ClipboardList size={24} /></div>
          <div>
            <div className="stats-value">{coursesStats.drafts}</div>
            <div className="stats-label">Drafts</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon"><Users size={24} /></div>
          <div>
            <div className="stats-value">{coursesStats.students}</div>
            <div className="stats-label">Students</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error"><AlertTriangle size={18} /> {error}</div>}

      {/* Create Course Form */}
      {user.role === 'teacher' && (
        <div className="create-course-section">
          <h3><Plus size={20} /> Create New Course</h3>
          <form onSubmit={createCourse} className="create-course-form">
            <div className="form-fields">
              <div className="form-field">
                <label>Course Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Brief course description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label>&nbsp;</label>
                <button type="submit" className="submit-btn">
                  Create
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="loading-text"><Loader2 size={24} className="spin" /> Loading courses...</div>
      ) : filteredCourses.length > 0 ? (
        <div className="courses-grid">
          {filteredCourses.map((course, index) => (
            <div key={course.id} className={`course-card course-${getColorClass(index)}`}>
              <div className="course-header">
                <div className="course-icon-large">{getCourseIcon(index)}</div>
                <div className="course-status">Active</div>
              </div>
              <div className="course-body">
                <h3>{course.title}</h3>
                <p>{course.description || 'No description provided'}</p>
              </div>
              <div className="course-footer">
                <span className={`course-badge badge-${getColorClass(index)}`}>
                  {getColorClass(index).charAt(0).toUpperCase() + getColorClass(index).slice(1)}
                </span>
                <div className="course-actions">
                  <button className="action-icon" title="Edit">
                    <Edit size={16} />
                  </button>
                  <button
                    className="action-icon"
                    title="Delete"
                    onClick={() => setDeleteConfirm(course.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-courses"><Inbox size={48} /> No courses found. {searchQuery && 'Try a different search.'}</div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3><Trash2 size={24} /> Delete Course</h3>
            <p>Are you sure? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteCourse(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
