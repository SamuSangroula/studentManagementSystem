import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  ClipboardList, 
  Book, 
  Bell, 
  Send, 
  FlaskConical,
  ArrowRight,
  PenTool,
  Download,
  CheckCircle
} from 'lucide-react';
import { api } from '../lib/api';

export default function DashboardPage({ token, user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    courses: 0,
    assignments: 0,
    materials: 0,
    tests: 0,
    submissions: 0,
    notices: 0,
    recentActivities: [],
    enrolledCourses: [],
    recentSubmissions: []
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [coursesRes, assignmentsRes, materialsRes, noticesRes, submissionsRes] = await Promise.all([
          api.listCourses(token),
          api.listAssignments(token),
          api.listMaterials(token),
          api.listNotices(token),
          user.role === 'student' ? api.getStudentSubmissions(token) : (user.role === 'teacher' ? api.teacherSubmissions(token) : Promise.resolve({ submissions: [] }))
        ]);

        if (!cancelled) {
          setDashboardData({
            courses: coursesRes.courses?.length || 0,
            assignments: assignmentsRes.assignments?.length || 0,
            materials: materialsRes.materials?.length || 0,
            tests: 42,
            submissions: submissionsRes.submissions?.length || 0,
            notices: noticesRes.notices?.length || 0,
            recentActivities: (noticesRes.notices || []).slice(0, 4).map((notice) => ({
              title: notice.title,
              body: notice.body,
              date: notice.createdAt
            })),
            enrolledCourses: (coursesRes.courses || []).slice(0, 3),
            recentSubmissions: user.role === 'teacher' ? (submissionsRes.submissions || []).filter(sub => !sub.grade).slice(0, 4) : []
          });
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || 'Failed to load dashboard.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token, user.role]);

  const stats = [
    { label: 'Courses', value: dashboardData.courses, icon: <BookOpen size={24} /> },
    { label: 'Assignments', value: dashboardData.assignments, icon: <ClipboardList size={24} /> },
    { label: 'Materials', value: dashboardData.materials, icon: <Book size={24} /> },
    { label: 'Notices', value: dashboardData.notices, icon: <Bell size={24} /> },
    { label: 'Submissions', value: dashboardData.submissions, icon: <Send size={24} /> },
    { label: 'Tests', value: dashboardData.tests, icon: <FlaskConical size={24} /> }
  ];

  return (
    <div className="dashboard-page-v2">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user.name || user.role}! Here's an overview of your activities.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Quick Stats */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{loading ? '--' : stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Recent Activities */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Notices</h2>
            <a href="/notices" className="view-all-link">View All <ArrowRight size={16} /></a>
          </div>
          {loading ? (
            <p className="loading-text">Loading notices...</p>
          ) : dashboardData.recentActivities.length > 0 ? (
            <div className="activities-list">
              {dashboardData.recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-dot"></div>
                  <div className="activity-content">
                    <p className="activity-title">{activity.title}</p>
                    <p className="activity-desc">{activity.body?.substring(0, 60)}...</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data-text">No recent activities</p>
          )}
        </div>

        {/* Enrolled Courses */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Active Courses</h2>
            <a href="/courses" className="view-all-link">View All <ArrowRight size={16} /></a>
          </div>
          {loading ? (
            <p className="loading-text">Loading courses...</p>
          ) : dashboardData.enrolledCourses.length > 0 ? (
            <div className="courses-list">
              {dashboardData.enrolledCourses.map((course) => (
                <div key={course.id} className="course-item">
                  <div className="course-icon"><BookOpen size={20} /></div>
                  <div className="course-info">
                    <p className="course-title">{course.title}</p>
                    <p className="course-desc">{course.description?.substring(0, 50)}...</p>
                  </div>
                  <a href={`/courses/${course.id}`} className="course-arrow"><ArrowRight size={20} /></a>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data-text">No enrolled courses</p>
          )}
        </div>

        {/* Teacher Pending Submissions */}
        {user.role === 'teacher' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Pending Submissions</h2>
              <a href="/grades" className="view-all-link">Grade All <ArrowRight size={16} /></a>
            </div>
            {loading ? (
              <p className="loading-text">Loading submissions...</p>
            ) : dashboardData.recentSubmissions.length > 0 ? (
              <div className="dash-submissions-list">
                {dashboardData.recentSubmissions.map((sub, index) => (
                  <div key={sub.id || index} className="dash-submission-item">
                    <div className="dash-sub-icon"><Send size={20} color="#2563eb" /></div>
                    <div className="dash-sub-info">
                      <p className="dash-sub-title">{sub.assignmentTitle || 'Assignment'}</p>
                      <p className="dash-sub-student">By {sub.studentName || 'Student'}</p>
                      <p className="dash-sub-date">{new Date(sub.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <a href="/grades" className="dash-sub-action">Grade</a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-sub-state">
                <CheckCircle size={32} color="#10b981" />
                <p>All caught up!</p>
                <span>No pending submissions to grade.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="dashboard-card">
        <h2>Quick Actions</h2>
        <div className="quick-links">
          <a href="/assignments" className="quick-link">
            <span className="link-icon"><PenTool size={20} /></span>
            <span>View Assignments</span>
          </a>
          <a href="/materials" className="quick-link">
            <span className="link-icon"><Download size={20} /></span>
            <span>Download Materials</span>
          </a>
          <a href="/submissions" className="quick-link">
            <span className="link-icon"><Send size={20} /></span>
            <span>My Submissions</span>
          </a>
          <a href="/attendance" className="quick-link">
            <span className="link-icon"><CheckCircle size={20} /></span>
            <span>View Attendance</span>
          </a>
        </div>
      </div>
    </div>
  );
}
