import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import PageHeader from '../components/shared/PageHeader';

export default function UsersPage({ token, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [resetPasswordMap, setResetPasswordMap] = useState({}); // userId -> new password string

  const loadUsers = useCallback(async () => {
    if (user.role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.listUsers(token);
      setUsers(response.users || []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [token, user.role]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function createUser(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createUser(createForm, token);
      setCreateForm({ name: '', email: '', password: '', role: 'student' });
      setSuccess(`User "${createForm.email}" created successfully.`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message || 'Could not create user.');
    }
  }

  async function updateUserRoleAndStatus(targetUser) {
    setError('');
    setSuccess('');
    try {
      await api.updateUser(targetUser.id, { role: targetUser.role, active: targetUser.active }, token);
      setSuccess('User updated.');
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message || 'Could not update user.');
    }
  }

  async function resetPassword(targetUser) {
    const newPassword = resetPasswordMap[targetUser.id];
    if (!newPassword || newPassword.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.resetUserPassword(targetUser.id, newPassword, token);
      setSuccess(`Password reset for ${targetUser.email}.`);
      setResetPasswordMap((prev) => ({ ...prev, [targetUser.id]: '' }));
    } catch (requestError) {
      setError(requestError.message || 'Could not reset password.');
    }
  }

  async function deleteUser(id) {
    setError('');
    setSuccess('');
    try {
      await api.deleteUser(id, token);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message || 'Could not delete user.');
    }
  }

  if (user.role !== 'admin') {
    return (
      <div className="function-page">
        <PageHeader title="Users" subtitle="User management is available only for admins." />
        <section className="content-panel">
          <p>Sign in as admin to create, update, and delete user accounts.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="function-page">
      <PageHeader title="Users" subtitle="Manage platform users and role permissions." />

      <form className="form-panel" onSubmit={createUser}>
        <h3>Create User</h3>
        <div className="form-row">
          <input
            placeholder="Name"
            value={createForm.name}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={createForm.email}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={createForm.password}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
          <select
            value={createForm.role}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value }))}
          >
            <option value="student">student</option>
            <option value="teacher">teacher</option>
            <option value="admin">admin</option>
          </select>
          <button type="submit" className="primary-button">
            Create
          </button>
        </div>
      </form>

      {error ? <p className="status error">{error}</p> : null}
      {success ? <p className="status success" style={{ color: 'green' }}>{success}</p> : null}

      <section className="content-panel">
        <h3>Existing Users</h3>
        {loading ? <p>Loading users...</p> : null}
        {users.map((item) => (
          <div key={item.id} className="user-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ flex: '1 1 160px' }}>
              <strong>{item.name}</strong>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>{item.email}</p>
            </div>
            <select
              value={item.role}
              onChange={(event) =>
                setUsers((prev) =>
                  prev.map((candidate) =>
                    candidate.id === item.id ? { ...candidate, role: event.target.value } : candidate
                  )
                )
              }
            >
              <option value="student">student</option>
              <option value="teacher">teacher</option>
              <option value="admin">admin</option>
            </select>
            <label className="check-inline">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(event) =>
                  setUsers((prev) =>
                    prev.map((candidate) =>
                      candidate.id === item.id ? { ...candidate, active: event.target.checked } : candidate
                    )
                  )
                }
              />
              Active
            </label>
            <button type="button" className="secondary-button" onClick={() => updateUserRoleAndStatus(item)}>
              Save
            </button>

            {/* Reset Password inline */}
            <input
              type="password"
              placeholder="New password"
              style={{ width: '130px', fontSize: '0.85rem' }}
              value={resetPasswordMap[item.id] || ''}
              onChange={(event) =>
                setResetPasswordMap((prev) => ({ ...prev, [item.id]: event.target.value }))
              }
            />
            <button
              type="button"
              className="secondary-button"
              style={{ background: '#f0a500', color: '#fff', borderColor: '#f0a500' }}
              onClick={() => resetPassword(item)}
            >
              Reset Password
            </button>

            <button type="button" className="danger-button" onClick={() => deleteUser(item.id)}>
              Delete
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

