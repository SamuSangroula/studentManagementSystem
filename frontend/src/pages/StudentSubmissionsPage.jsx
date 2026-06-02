import { useCallback, useEffect, useState } from 'react';
import { 
  Award, 
  FileText, 
  CheckCircle, 
  Clock, 
  X,
  Paperclip,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/shared/PageHeader';

export default function StudentSubmissionsPage({ token, user }) {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getStudentSubmissions(token);
      setSubmissions(data.submissions || []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const gradedSubmissions = submissions.filter((s) => s.grade !== null && s.grade !== undefined);
  const pendingSubmissions = submissions.filter((s) => s.grade === null || s.grade === undefined);

  return (
    <div className="my-submissions-dashboard">
      <PageHeader
        title="My Submissions"
        subtitle={`${gradedSubmissions.length} graded · ${pendingSubmissions.length} pending`}
      />

      {error && <p className="status-error-pill"><X size={16} /> {error}</p>}

      <div className="submissions-content">
        {loading ? (
          <div className="loading-placeholder">Loading your submission records...</div>
        ) : submissions.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>You haven't submitted any assignments yet.</p>
          </div>
        ) : (
          <div className="submissions-sections-stack">
            {/* Graded Submissions Section */}
            {gradedSubmissions.length > 0 && (
              <div className="submission-section">
                <div className="section-header">
                  <Award size={18} />
                  <h3>GRADED SUBMISSIONS ({gradedSubmissions.length})</h3>
                </div>
                <div className="submission-cards-list">
                  {gradedSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className={`submission-record-card graded ${selectedSubmission?.id === submission.id ? 'active' : ''}`}
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <div className="submission-icon-box">
                        <CheckCircle size={22} />
                      </div>
                      <div className="submission-main">
                        <h4 className="submission-title">{submission.assignmentTitle}</h4>
                        <span className="submission-course">{submission.courseName}</span>
                        <div className="submission-meta">
                          <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                          <span className="dot">·</span>
                          <span>Graded: {new Date(submission.gradedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="submission-score-badge">
                        {submission.grade}%
                      </div>
                      <div className="submission-chevron">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Submissions Section */}
            {pendingSubmissions.length > 0 && (
              <div className="submission-section">
                <div className="section-header">
                  <Clock size={18} />
                  <h3>PENDING REVIEW ({pendingSubmissions.length})</h3>
                </div>
                <div className="submission-cards-list">
                  {pendingSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className={`submission-record-card pending ${selectedSubmission?.id === submission.id ? 'active' : ''}`}
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <div className="submission-icon-box">
                        <Clock size={22} />
                      </div>
                      <div className="submission-main">
                        <h4 className="submission-title">{submission.assignmentTitle}</h4>
                        <span className="submission-course">{submission.courseName}</span>
                        <div className="submission-meta">
                          <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="submission-status-pill">
                        Reviewing
                      </div>
                      <div className="submission-chevron">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Submission Drawer/Modal Overlay */}
        {selectedSubmission && (
          <div className="submission-modal-overlay" onClick={() => setSelectedSubmission(null)}>
            <div className="submission-detail-drawer" onClick={(e) => e.stopPropagation()}>
              <button className="drawer-close-btn" onClick={() => setSelectedSubmission(null)}>
                <X size={24} />
              </button>

              <div className="drawer-content">
                <div className="drawer-header">
                  <h2 className="title">{selectedSubmission.assignmentTitle}</h2>
                  <p className="course">{selectedSubmission.courseName}</p>
                </div>

                <div className="drawer-stats-grid">
                  <div className="drawer-stat">
                    <span className="label">Submitted On</span>
                    <span className="value">{new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
                  </div>
                  {selectedSubmission.grade !== null && (
                    <div className="drawer-stat">
                      <span className="label">Grade Received</span>
                      <span className="value score">{selectedSubmission.grade}%</span>
                    </div>
                  )}
                </div>

                <div className="drawer-body">
                  {selectedSubmission.content && (
                    <div className="drawer-section">
                      <label><FileText size={16} /> Submission Content</label>
                      <div className="content-box">
                        <p>{selectedSubmission.content}</p>
                      </div>
                    </div>
                  )}

                  {selectedSubmission.fileUrl && (
                    <div className="drawer-section">
                      <label><Paperclip size={16} /> Attached File</label>
                      <a
                        href={api.getPublicFileUrl(selectedSubmission.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="premium-file-link"
                      >
                        <FileText size={18} />
                        <span>{selectedSubmission.fileName || 'View file'}</span>
                      </a>
                    </div>
                  )}

                  {selectedSubmission.feedback && (
                    <div className="drawer-section">
                      <label><MessageSquare size={16} /> Instructor Feedback</label>
                      <div className="feedback-container">
                        <p>{selectedSubmission.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
