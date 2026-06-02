import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import PageHeader from '../components/shared/PageHeader';
import { 
  Bell, 
  Trash2, 
  Plus, 
  Megaphone,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function NoticesPage({ token, user }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ title: '', body: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.listNotices(token);
      setNotices(response.notices || []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load notices.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  async function createNotice(event) {
    event.preventDefault();
    try {
      await api.createNotice(form, token);
      setForm({ title: '', body: '' });
      setSuccess('Notice published successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await loadNotices();
    } catch (requestError) {
      setError(requestError.message || 'Could not publish notice.');
    }
  }

  async function deleteNotice(noticeId) {
    setDeleteLoading(true);
    try {
      await api.deleteNotice(noticeId, token);
      setSuccess('Notice deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setConfirmDelete(null);
      await loadNotices();
    } catch (requestError) {
      setError(requestError.message || 'Could not delete notice.');
    } finally {
      setDeleteLoading(false);
    }
  }

  const canDeleteNotice = (notice) => {
    return user.role === 'admin' || (user.role === 'teacher' && notice.createdBy === user.id);
  };

  return (
    <div className="notices-dashboard">
      <PageHeader title="Notices" subtitle="Publish and browse announcements" />

      {(user.role === 'teacher' || user.role === 'admin') && (
        <div className="notice-creator-panel">
          <div className="panel-header">
            <Plus size={20} />
            <h3>Create New Announcement</h3>
          </div>
          <form className="premium-notice-form" onSubmit={createNotice}>
            <div className="form-grid">
              <div className="input-group">
                <label>Notice Title</label>
                <input
                  placeholder="e.g. Exam Schedule Update"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>
              <div className="input-group">
                <label>Notice Description</label>
                <textarea
                  placeholder="Provide more details here..."
                  value={form.body}
                  onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                  required
                />
              </div>
            </div>
            <button className="publish-notice-btn" type="submit">
              <Megaphone size={18} /> Publish Notice
            </button>
          </form>
        </div>
      )}

      {error && <p className="status-error-pill"><AlertCircle size={16} /> {error}</p>}
      {success && <p className="status-success-pill"><CheckCircle2 size={16} /> {success}</p>}

      <div className="notices-grid">
        {loading ? (
          <div className="loading-placeholder">Loading announcements...</div>
        ) : notices.length > 0 ? (
          notices.map((notice) => (
            <div key={notice.id} className="notice-card">
              <div className="notice-icon-wrapper">
                <Bell size={24} />
              </div>
              <div className="notice-content">
                <div className="notice-header">
                  <h4 className="notice-title">{notice.title}</h4>
                  {canDeleteNotice(notice) && (
                    <button
                      className="notice-delete-action"
                      onClick={() => setConfirmDelete(notice.id)}
                      title="Delete notice"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <p className="notice-body">{notice.body}</p>
                <span className="notice-date">
                  {new Date(notice.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-notices">
            <p>No notices published yet.</p>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-icon warning">
              <AlertCircle size={32} />
            </div>
            <h3>Delete Notice?</h3>
            <p>This announcement will be permanently removed for everyone. This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setConfirmDelete(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="danger-btn-elevated"
                onClick={() => deleteNotice(confirmDelete)}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
