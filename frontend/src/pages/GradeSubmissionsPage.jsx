import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Eye, Paperclip } from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/shared/PageHeader';

export default function GradeSubmissionsPage({ token, user }) {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.teacherSubmissions(token);
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

  function selectSubmission(submission) {
    setSelectedSubmission(submission);
    setGradeForm({
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
  }

  async function submitGrade(event) {
    event.preventDefault();
    if (!gradeForm.grade) {
      setError('Grade is required');
      return;
    }

    try {
      await api.gradeSubmission(
        selectedSubmission.id,
        {
          grade: parseFloat(gradeForm.grade),
          feedback: gradeForm.feedback
        },
        token
      );
      setError('');
      await loadSubmissions();
      setSelectedSubmission(null);
      setGradeForm({ grade: '', feedback: '' });
    } catch (requestError) {
      setError(requestError.message || 'Failed to submit grade');
    }
  }

  const ungradedCount = submissions.filter((s) => !s.grade).length;

  return (
    <div className="function-page">
      <PageHeader
        title="Grade Submissions"
        subtitle={`${ungradedCount} ungraded submission${ungradedCount !== 1 ? 's' : ''}`}
      />

      {error && <p className="status error">{error}</p>}

      <div className="submissions-layout">
        {/* Submissions List */}
        <div className="submissions-list">
          <div className="list-header">
            <h3>
              <Eye size={18} /> Submissions ({submissions.length})
            </h3>
          </div>

          {loading ? (
            <p className="status">Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p className="status">No submissions yet</p>
          ) : (
            <div className="submission-items">
              {submissions.map((submission) => (
                <button
                  key={submission.id}
                  className={`submission-item ${selectedSubmission?.id === submission.id ? 'active' : ''}`}
                  onClick={() => selectSubmission(submission)}
                >
                  <div className="submission-header">
                    <span className="student-name">{submission.studentName}</span>
                    {submission.grade !== null && (
                      <span className="grade-badge">{submission.grade}%</span>
                    )}
                  </div>
                  <p className="assignment-name">{submission.assignmentTitle}</p>
                  <p className="submission-date">
                    Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                  {submission.grade && (
                    <p className="graded-date">
                      Graded: {new Date(submission.gradedAt).toLocaleDateString()}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grade Panel */}
        {selectedSubmission ? (
          <div className="grade-panel">
            <div className="panel-header">
              <h3>
                <CheckCircle size={18} /> Review Submission
              </h3>
            </div>

            <div className="submission-details">
              <div className="detail-row">
                <label>Student</label>
                <p>{selectedSubmission.studentName}</p>
              </div>
              <div className="detail-row">
                <label>Email</label>
                <p>{selectedSubmission.studentEmail}</p>
              </div>
              <div className="detail-row">
                <label>Assignment</label>
                <p>{selectedSubmission.assignmentTitle}</p>
              </div>
              <div className="detail-row">
                <label>Submitted</label>
                <p>{new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
              </div>

              {selectedSubmission.content && (
                <div className="detail-row">
                  <label>Submission Content</label>
                  <div className="submission-content">
                    <p>{selectedSubmission.content}</p>
                  </div>
                </div>
              )}

              {selectedSubmission.fileUrl && (
                <div className="detail-row">
                  <label>Attached File</label>
                  <a
                    href={api.getPublicFileUrl(selectedSubmission.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    <Paperclip size={14} /> {selectedSubmission.fileName || 'Download file'}
                  </a>
                </div>
              )}
            </div>

            {/* Grading Form */}
            <form className="grade-form" onSubmit={submitGrade}>
              <h4>Provide Grade & Feedback</h4>

              <div className="form-group">
                <label htmlFor="grade">Grade (0-100)</label>
                <input
                  id="grade"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="Enter grade"
                  value={gradeForm.grade}
                  onChange={(e) => setGradeForm((prev) => ({ ...prev, grade: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="feedback">Feedback</label>
                <textarea
                  id="feedback"
                  placeholder="Enter feedback for the student"
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm((prev) => ({ ...prev, feedback: e.target.value }))}
                  rows="6"
                />
              </div>

              <button type="submit" className="primary-button full-width">
                <CheckCircle size={16} /> Submit Grade
              </button>
            </form>
          </div>
        ) : (
          <div className="grade-panel empty">
            <p className="text-muted">Select a submission to grade</p>
          </div>
        )}
      </div>
    </div>
  );
}
