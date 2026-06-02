import { useCallback, useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import PageHeader from '../components/shared/PageHeader';
import { 
  Trash2, 
  Upload, 
  Plus, 
  FileText, 
  Link as LinkIcon, 
  FolderOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  Download,
  ExternalLink
} from 'lucide-react';

export default function MaterialsPage({ token, user }) {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: '', type: 'file', url: '', courseId: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [materialsRes, coursesRes] = await Promise.all([
        api.listMaterials(token),
        user.role === 'teacher' || user.role === 'admin'
          ? api.listCourses(token)
          : Promise.resolve({ courses: [] })
      ]);
      setMaterials(materialsRes.materials || []);
      setCourses(coursesRes.courses || []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load materials.');
    } finally {
      setLoading(false);
    }
  }, [token, user.role]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  function handleTypeChange(type) {
    setForm((prev) => ({
      ...prev,
      type,
      url: type === 'file' ? '' : (prev.url || '')
    }));
    if (type === 'file') {
      setFile(null);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  async function createMaterial(event) {
    event.preventDefault();
    setSubmitLoading(true);
    setError('');
    try {
      if (form.type === 'file') {
        if (!file) {
          setError('Please select a file');
          setSubmitLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('type', form.type);
        formData.append('file', file);
        if (form.courseId) {
          formData.append('courseId', form.courseId);
        }
        await api.createMaterial(formData, token);
      } else {
        if (!form.url) {
          setError('Please enter a URL');
          setSubmitLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('type', form.type);
        formData.append('url', form.url);
        if (form.courseId) {
          formData.append('courseId', form.courseId);
        }
        await api.createMaterial(formData, token);
      }
      
      setForm({ title: '', type: 'file', url: '', courseId: '' });
      setFile(null);
      setSuccess('Material added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await loadMaterials();
    } catch (requestError) {
      setError(requestError.message || 'Could not create material.');
    } finally {
      setSubmitLoading(false);
    }
  }

  async function deleteMaterial(materialId) {
    setDeleteLoading(true);
    try {
      await api.deleteMaterial(materialId, token);
      setSuccess('Material deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setConfirmDelete(null);
      await loadMaterials();
    } catch (requestError) {
      setError(requestError.message || 'Could not delete material.');
    } finally {
      setDeleteLoading(false);
    }
  }

  const canDeleteMaterial = (material) => {
    return user.role === 'admin' || (user.role === 'teacher' && material.createdBy === user.id);
  };

  const getFileUrl = (material) => {
    if (material.type === 'file') {
      return api.getPublicFileUrl(material.url);
    }
    return material.url;
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find(c => String(c.id) === String(courseId));
    return course ? course.title : 'General Resource';
  };

  return (
    <div className="materials-dashboard">
      <PageHeader title="Materials" subtitle="Share and access learning resources" />

      {(user.role === 'teacher' || user.role === 'admin') && (
        <div className="material-creator-panel">
          <div className="panel-header">
            <Plus size={20} />
            <h3>Upload Resource</h3>
          </div>
          <form className="premium-material-form" onSubmit={createMaterial}>
            <div className="form-grid">
              <div className="input-group">
                <label>Resource Title</label>
                <input
                  placeholder="e.g. Calculus Summary PDF"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>

              <div className="input-group">
                <label>Linked Course</label>
                <select
                  value={form.courseId}
                  onChange={(event) => setForm((prev) => ({ ...prev, courseId: event.target.value }))}
                >
                  <option value="">No course link (General)</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group full-width">
                <label>Resource Type</label>
                <div className="type-toggle-group">
                  <button 
                    type="button" 
                    className={`type-btn ${form.type === 'file' ? 'active' : ''}`}
                    onClick={() => handleTypeChange('file')}
                  >
                    <FileText size={16} /> File Upload
                  </button>
                  <button 
                    type="button" 
                    className={`type-btn ${form.type === 'link' ? 'active' : ''}`}
                    onClick={() => handleTypeChange('link')}
                  >
                    <LinkIcon size={16} /> External Link
                  </button>
                </div>
              </div>

              {form.type === 'file' ? (
                <div className="input-group full-width">
                  <div
                    className={`premium-drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={32} />
                    <div className="drop-info">
                      <p className="main-text">{file ? file.name : 'Click or Drag to Upload File'}</p>
                      <p className="sub-text">PDF, DOCX, ZIP or Images (Max 10MB)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => e.target.files && setFile(e.target.files[0])}
                    />
                  </div>
                </div>
              ) : (
                <div className="input-group full-width">
                  <label>External URL</label>
                  <input
                    placeholder="https://example.com/resource"
                    value={form.url}
                    onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                    required={form.type !== 'file'}
                  />
                </div>
              )}
            </div>
            
            <button 
              className="publish-material-btn" 
              type="submit"
              disabled={submitLoading}
            >
              {submitLoading ? <RefreshCcw size={18} className="spin" /> : <Plus size={18} />}
              {submitLoading ? 'Uploading...' : 'Add to Library'}
            </button>
          </form>
        </div>
      )}

      {error ? <p className="status-error-pill"><AlertCircle size={16} /> {error}</p> : null}
      {success ? <p className="status-success-pill"><CheckCircle2 size={16} /> {success}</p> : null}

      <div className="materials-grid">
        {loading ? (
          <div className="loading-placeholder">Searching resource library...</div>
        ) : materials.length > 0 ? (
          materials.map((item) => (
            <div key={item.id} className="material-card">
              <div className={`material-icon-box ${item.type}`}>
                {item.type === 'file' ? <FileText size={24} /> : <LinkIcon size={24} />}
              </div>
              <div className="material-main">
                <div className="material-header">
                  <h4 className="material-title">{item.title}</h4>
                  {canDeleteMaterial(item) && (
                    <button
                      className="material-delete-action"
                      onClick={() => setConfirmDelete(item.id)}
                      title="Delete material"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <span className="material-course-tag">{getCourseTitle(item.courseId)}</span>
                <div className="material-footer">
                  <span className="type-pill">{item.type}</span>
                  <a 
                    href={getFileUrl(item)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="material-action-link"
                  >
                    {item.type === 'file' ? <Download size={16} /> : <ExternalLink size={16} />}
                    {item.type === 'file' ? 'Download' : 'Open'}
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-materials">
            <FolderOpen size={48} />
            <p>No learning materials found in this library yet.</p>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-icon warning">
              <AlertCircle size={32} />
            </div>
            <h3>Delete Resource?</h3>
            <p>This material will be removed from the library permanently.</p>
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
                onClick={() => deleteMaterial(confirmDelete)}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
