export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_PUBLIC_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function buildHeaders(token) {
  return token
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    : {
        'Content-Type': 'application/json'
      };
}

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token),
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return data;
}

async function requestMultipart(path, { method = 'POST', token, formData } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return data;
}

function getPublicFileUrl(fileUrl) {
  if (!fileUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${API_PUBLIC_ORIGIN}${normalizedPath}`;
}

export const api = {
  getPublicFileUrl,
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/me', { token }),
  markPresent: (token) => request('/attendance/present', { method: 'POST', token }),
  myAttendance: (token) => request('/attendance/me', { token }),
  
  // Courses
  listCourses: (token) => request('/courses', { token }),
  getCourseDetails: (id, token) => request(`/courses/${id}`, { token }),
  createCourse: (payload, token) => request('/courses', { method: 'POST', token, body: payload }),
  updateCourse: (id, payload, token) =>
    request(`/courses/${id}`, { method: 'PUT', token, body: payload }),
  deleteCourse: (id, token) => request(`/courses/${id}`, { method: 'DELETE', token }),
  
  // Course Enrollment
  enrollStudent: (courseId, payload, token) =>
    request(`/courses/${courseId}/enroll`, { method: 'POST', token, body: payload }),
  removeStudentFromCourse: (courseId, studentId, token) =>
    request(`/courses/${courseId}/enroll/${studentId}`, { method: 'DELETE', token }),
  getCourseStudents: (courseId, token) =>
    request(`/courses/${courseId}/students`, { token }),
  getStudentCourses: (token) => request('/student/courses', { token }),
  
  // Assignments
  listAssignments: (token) => request('/assignments', { token }),
  getAssignmentDetails: (id, token) => request(`/assignments/${id}`, { token }),
  createAssignment: (payload, token) =>
    request('/assignments', { method: 'POST', token, body: payload }),
  createAssignmentWithFile: (formData, token) =>
    requestMultipart('/assignments', { method: 'POST', token, formData }),
  getCourseAssignments: (courseId, token) =>
    request(`/courses/${courseId}/assignments`, { token }),
  
  // Submissions & File Upload
  submitAssignment: (id, payload, token) =>
    request(`/student/assignments/${id}/submit`, { method: 'POST', token, body: payload }),
  submitAssignmentWithFile: (id, formData, token) =>
    requestMultipart(`/student/assignments/${id}/submit`, { method: 'POST', token, formData }),
  getStudentSubmission: (assignmentId, token) =>
    request(`/student/assignments/${assignmentId}/submission`, { token }),
  getStudentSubmissions: (token) => request('/student/submissions', { token }),
  teacherSubmissions: (token) => request('/teacher/submissions', { token }),
  
  // Grading
  gradeSubmission: (submissionId, payload, token) =>
    request(`/teacher/submissions/${submissionId}/grade`, { method: 'PUT', token, body: payload }),
  
  // Materials
  listMaterials: (token) => request('/materials', { token }),
  createMaterial: (formData, token) =>
    requestMultipart('/materials', { method: 'POST', token, formData }),
  createCourseMaterial: (courseId, formData, token) =>
    requestMultipart(`/courses/${courseId}/materials`, { method: 'POST', token, formData }),
  getCourseMaterials: (courseId, token) =>
    request(`/courses/${courseId}/materials`, { token }),
  updateMaterial: (id, payload, token) =>
    request(`/materials/${id}`, { method: 'PUT', token, body: payload }),
  deleteMaterial: (id, token) => request(`/materials/${id}`, { method: 'DELETE', token }),
  
  // Notices
  listNotices: (token) => request('/notices', { token }),
  createNotice: (payload, token) => request('/notices', { method: 'POST', token, body: payload }),
  updateNotice: (id, payload, token) =>
    request(`/notices/${id}`, { method: 'PUT', token, body: payload }),
  deleteNotice: (id, token) => request(`/notices/${id}`, { method: 'DELETE', token }),
  
  // Dashboard
  studentDashboard: (token) => request('/student/dashboard', { token }),
  
  // Admin Users
  listUsers: (token) => request('/admin/users', { token }),
  createUser: (payload, token) => request('/admin/users', { method: 'POST', token, body: payload }),
  updateUser: (id, payload, token) =>
    request(`/admin/users/${id}`, { method: 'PUT', token, body: payload }),
  resetUserPassword: (id, password, token) =>
    request(`/admin/users/${id}/password`, { method: 'PUT', token, body: { password } }),
  deleteUser: (id, token) => request(`/admin/users/${id}`, { method: 'DELETE', token })
};
