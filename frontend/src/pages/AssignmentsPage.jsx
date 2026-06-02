import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import PageHeader from '../components/shared/PageHeader';
import { 
  ClipboardList, 
  Hourglass, 
  CheckCircle2, 
  Trophy, 
  User, 
  BookOpen, 
  Calendar, 
  UploadCloud, 
  FileText,
  ChevronRight,
  AlertCircle,
  Paperclip
} from 'lucide-react';

export default function AssignmentsPage({ token, user }) {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [studentSubmissionMap, setStudentSubmissionMap] = useState({});
  const [submissionDrafts, setSubmissionDrafts] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', dueDate: '', courseId: '' });
  const [createFile, setCreateFile] = useState(null);
  const [submissionFiles, setSubmissionFiles] = useState({});
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const isTeacher = user.role === 'teacher';
      const isStudent = user.role === 'student';

      console.log('--- Initializing Assignment Load ---', { tokenPresent: !!token, role: user.role });
      const [assignmentRes, courseRes, submissionRes, studentSubmissionsRes] = await Promise.all([
        api.listAssignments(token),
        isTeacher ? api.listCourses(token) : Promise.resolve({ courses: [] }),
        isTeacher ? api.teacherSubmissions(token) : Promise.resolve({ submissions: [] }),
        isStudent ? api.getStudentSubmissions(token) : Promise.resolve({ submissions: [] })
      ]);
      console.log('Load Results:', { 
        assignments: assignmentRes.assignments?.length, 
        submissions: studentSubmissionsRes.submissions?.length 
      });

      const latestByAssignment = (studentSubmissionsRes.submissions || []).reduce((acc, submission) => {
        acc[submission.assignmentId] = submission;
        return acc;
      }, {});

      setAssignments(assignmentRes.assignments || []);
      setCourses(courseRes.courses || []);
      setSubmissions(submissionRes.submissions || []);
      setStudentSubmissionMap(latestByAssignment);
      
      // Auto-select first incomplete assignment for student
      if (isStudent && assignmentRes.assignments?.length > 0 && !selectedAssignmentId) {
        const firstIncomplete = assignmentRes.assignments.find(a => !latestByAssignment[a.id]);
        setSelectedAssignmentId(firstIncomplete?.id || assignmentRes.assignments[0].id);
      }
    } catch (requestError) {
      setError(requestError.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  }, [token, user.role, selectedAssignmentId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  async function createAssignment(event) {
    event.preventDefault();
    try {
      if (createFile) {
        const formData = new FormData();
        if (createForm.title) formData.append('title', createForm.title);
        if (createForm.description) formData.append('description', createForm.description);
        if (createForm.dueDate) formData.append('dueDate', createForm.dueDate);
        if (createForm.courseId) formData.append('courseId', createForm.courseId);
        formData.append('file', createFile);
        await api.createAssignmentWithFile(formData, token);
      } else {
        await api.createAssignment(createForm, token);
      }
      setCreateForm({ title: '', description: '', dueDate: '', courseId: '' });
      setCreateFile(null);
      await loadAssignments();
    } catch (requestError) {
      setError(requestError.message || 'Could not create assignment.');
    }
  }

  async function submitAssignment(assignmentId) {
    const draft = (submissionDrafts[assignmentId] || '').trim();
    const file = submissionFiles[assignmentId];

    if (!draft && !file) {
      setError('Please write content or upload a file before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      if (draft) formData.append('content', draft);
      if (file) formData.append('file', file);
      
      await api.submitAssignmentWithFile(assignmentId, formData, token);

      setSubmissionDrafts(prev => ({ ...prev, [assignmentId]: '' }));
      setSubmissionFiles(prev => ({ ...prev, [assignmentId]: null }));
      setSuccess('Submission saved successfully!');
      await loadAssignments();
    } catch (err) {
      console.error('Submission error:', err);
      const statusText = err.status ? ` (Error ${err.status})` : '';
      setError(err.message + statusText);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAssignment = assignments.find(a => String(a.id) === String(selectedAssignmentId));

  // Stats calculation
  const totalTasks = assignments.length;
  const submittedTasks = Object.keys(studentSubmissionMap).length;
  const pendingTasks = totalTasks - submittedTasks;
  const avgGrade = submittedTasks > 0 ? "99%" : "N/A";

  return (
    <div className="assignments-dashboard">
      <PageHeader title="Assignments" subtitle="Publish, track, and submit assignments" />

      {/* Status messages moved below for better visibility in portal */}

      {/* Stats Cards Row */}
      <div className="assignment-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <ClipboardList size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalTasks}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <Hourglass size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{pendingTasks}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{submittedTasks}</span>
            <span className="stat-label">Submitted</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <Trophy size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{avgGrade}</span>
            <span className="stat-label">Avg Grade</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-layout">
        {/* Left: Assignment List Card View */}
        <div className="assignments-main-col">
          <div className="section-header">
            <h3>My Assignments</h3>
            <span className="badge">{assignments.length} active</span>
          </div>
          
          <div className="assignment-cards-grid">
            {assignments.map((assignment) => {
              const isSubmitted = !!studentSubmissionMap[assignment.id];
              return (
                <div 
                  key={assignment.id} 
                  className={`assignment-card ${selectedAssignmentId === assignment.id ? 'active' : ''} ${isSubmitted ? 'is-submitted' : ''}`}
                  onClick={() => setSelectedAssignmentId(assignment.id)}
                >
                  <div className="card-top">
                    <h4>{assignment.title}</h4>
                    <span className={`status-tag ${isSubmitted ? 'success' : 'pending'}`}>
                      {isSubmitted ? 'Submitted' : 'No due date'}
                    </span>
                  </div>
                  
                  <div className="card-meta">
                    <div className="meta-item">
                      <BookOpen size={14} />
                      <span>{assignment.courseId}</span>
                    </div>
                    {assignment.dueDate && (
                      <div className="meta-item">
                        <Calendar size={14} />
                        <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-footer">
                    <div className="teacher-info">
                      <User size={14} />
                      <span>Teacher assigned</span>
                    </div>
                    {isSubmitted && <span className="check-mark"><CheckCircle2 size={16} /></span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Submission Portal */}
        <div className="submission-portal-col">
          {selectedAssignment ? (
            user.role === 'admin' ? (
              /* Admin: read-only overview, no submission allowed */
              <div className="submission-card">
                <div className="submission-header">
                  <div className="title-area">
                    <FileText size={20} className="header-icon" />
                    <h3>Assignment — <span className="highlight">{selectedAssignment.title}</span></h3>
                  </div>
                </div>
                <div className="submission-body" style={{ padding: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--surface-color-alt)', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {selectedAssignment.dueDate && (
                      <p style={{ margin: '0 0 0.4rem' }}><strong>Due:</strong> {new Date(selectedAssignment.dueDate).toLocaleDateString()}</p>
                    )}
                    {selectedAssignment.description && (
                      <p style={{ margin: '0 0 0.4rem' }}><strong>Description:</strong> {selectedAssignment.description}</p>
                    )}
                    {selectedAssignment.fileUrl && (
                      <a href={api.getPublicFileUrl(selectedAssignment.fileUrl)} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
                        <FileText size={14} /> Download Assignment File
                      </a>
                    )}
                  </div>
                  <div style={{ padding: '1rem', background: '#fef9c3', borderRadius: '8px', color: '#92400e', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    Admins can view assignments but cannot submit them. Assignment submission is for students only.
                  </div>
                </div>
              </div>
            ) : user.role === 'teacher' ? (
              <div className="submission-card">
                <div className="submission-header">
                  <div className="title-area">
                    <FileText size={20} className="header-icon" />
                    <h3>Assignment — <span className="highlight">{selectedAssignment.title}</span></h3>
                  </div>
                </div>
                <div className="submission-body" style={{ padding: '1.5rem' }}>
                  {/* Assignment details */}
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-color-alt)', borderRadius: '8px', fontSize: '0.9rem' }}>
                    {selectedAssignment.dueDate && (
                      <p style={{ margin: '0 0 0.4rem' }}><strong>Due:</strong> {new Date(selectedAssignment.dueDate).toLocaleDateString()}</p>
                    )}
                    {selectedAssignment.description && (
                      <p style={{ margin: '0 0 0.4rem' }}><strong>Description:</strong> {selectedAssignment.description}</p>
                    )}
                    {selectedAssignment.fileUrl && (
                      <a href={api.getPublicFileUrl(selectedAssignment.fileUrl)} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
                        <FileText size={14} /> Download Assignment File
                      </a>
                    )}
                  </div>

                  {/* Student submissions for this assignment */}
                  <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} /> Student Submissions
                  </h4>
                  {(() => {
                    const assignmentSubs = submissions.filter(s => s.assignmentId === selectedAssignment.id);
                    if (assignmentSubs.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
                          <User size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                          <p style={{ margin: 0 }}>No students have submitted this assignment yet.</p>
                        </div>
                      );
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {assignmentSubs.map(sub => (
                          <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                            <div>
                              <p style={{ margin: '0 0 0.2rem', fontWeight: '700', color: '#166534' }}>{sub.studentName}</p>
                              <p style={{ margin: '0 0 0.2rem', fontSize: '0.82rem', color: '#64748b' }}>{sub.studentEmail}</p>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                                Submitted: {new Date(sub.submittedAt).toLocaleString()}
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                              {sub.grade !== null && sub.grade !== undefined ? (
                                <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: '700', fontSize: '0.85rem' }}>
                                  {sub.grade}%
                                </span>
                              ) : (
                                <span style={{ background: '#fef9c3', color: '#854d0e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem' }}>
                                  Not graded
                                </span>
                              )}
                              {sub.fileUrl && (
                                <a href={api.getPublicFileUrl(sub.fileUrl)} target="_blank" rel="noreferrer"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#2563eb', fontSize: '0.8rem', textDecoration: 'none', fontWeight: '600' }}>
                                  <Paperclip size={12} /> {sub.fileName || 'View file'}
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
            <div className="submission-card">
              <div className="submission-header">
                <div className="title-area">
                  <UploadCloud size={20} className="header-icon" />
                  <h3>Submit Assignment — <span className="highlight">{selectedAssignment.title}</span></h3>
                </div>
                <span className={`status-pill ${studentSubmissionMap[selectedAssignment.id] ? 'success' : 'warning'}`}>
                  {studentSubmissionMap[selectedAssignment.id] ? 'Submitted' : 'Not Submitted'}
                </span>
              </div>

              <div className="submission-body">
                {error && (
                  <div className="status-error-pill" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="status-success-pill" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <CheckCircle2 size={18} />
                    <span>{success}</span>
                  </div>
                )}
                {selectedAssignment.fileUrl && (
                  <div className="assignment-file-download" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-color-alt)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>Teacher's Attached Materials:</p>
                    <a href={api.getPublicFileUrl(selectedAssignment.fileUrl)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', textDecoration: 'none' }}>
                      <FileText size={16} /> View Assignment File
                    </a>
                  </div>
                )}

                {studentSubmissionMap[selectedAssignmentId] && (
                  <div className="previous-submission-info" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                    <p style={{ margin: '0 0 0.75rem 0', fontWeight: '800', color: '#0369a1', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Your Previous Submission
                    </p>
                    {studentSubmissionMap[selectedAssignmentId].content && (
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                        "{studentSubmissionMap[selectedAssignmentId].content}"
                      </p>
                    )}
                    {studentSubmissionMap[selectedAssignmentId].fileUrl && (
                      <a 
                        href={api.getPublicFileUrl(studentSubmissionMap[selectedAssignmentId].fileUrl)} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ fontSize: '0.9rem', color: '#2563eb', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Paperclip size={14} /> View Submitted File: {studentSubmissionMap[selectedAssignmentId].fileName || 'file'}
                      </a>
                    )}
                    <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                      Last updated: {new Date(studentSubmissionMap[selectedAssignmentId].submittedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="form-group">
                  <label><FileText size={16} /> Your Answer / Notes</label>
                  <textarea
                    placeholder="Write your submission content here... (optional if uploading a file)"
                    value={submissionDrafts[selectedAssignmentId] || ''}
                    onChange={(e) => setSubmissionDrafts(prev => ({ ...prev, [selectedAssignmentId]: e.target.value }))}
                  />
                </div>

                <div className="file-upload-zone">
                  <input
                    type="file"
                    id="file-input"
                    className="hidden-input"
                    onChange={(e) => setSubmissionFiles(prev => ({ ...prev, [selectedAssignmentId]: e.target.files[0] }))}
                  />
                  <label htmlFor="file-input" className="drop-zone">
                    <div className="cloud-icon">
                      <UploadCloud size={32} />
                    </div>
                    <div className="drop-text">
                      <p className="main-text">
                        {submissionFiles[selectedAssignmentId] 
                          ? submissionFiles[selectedAssignmentId].name 
                          : 'Upload file — PDF, Word, Excel, Image'}
                      </p>
                      <p className="sub-text">Click to browse or drag and drop · Max 20MB</p>
                    </div>
                  </label>
                </div>

                <button 
                  type="button" 
                  className="submit-action-btn"
                  disabled={loading || submitting}
                  onClick={() => submitAssignment(selectedAssignment.id)}
                >
                  {submitting ? 'Submitting...' : (studentSubmissionMap[selectedAssignmentId] ? 'Update Submission' : 'Submit Assignment')}
                </button>
              </div>
            </div>
            )
          ) : (
            <div className="empty-selection-card">
              <AlertCircle size={48} />
              <p>Select an assignment from the list to start your submission.</p>
            </div>
          )}
        </div>
      </div>

      {user.role === 'teacher' && (
        <div className="teacher-controls">
          <div className="form-panel elevated">
             {/* Teacher creation form (simplified for this design) */}
             <h3>Quick Publish Assignment</h3>
             <form onSubmit={createAssignment} className="teacher-form-grid">
                <input
                  placeholder="Assignment Title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
                <select
                  value={createForm.courseId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, courseId: e.target.value }))}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, dueDate: e.target.value }))}
                />
                <input
                  type="file"
                  onChange={(e) => setCreateFile(e.target.files[0])}
                  className="teacher-file-input"
                  title="Upload Assignment File"
                  style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                />
                <button type="submit" className="teacher-publish-btn">Publish</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
