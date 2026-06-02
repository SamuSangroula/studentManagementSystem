import { useState } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  LogOut, 
  RefreshCcw,
  Settings,
  Bell,
  Lock,
  Globe
} from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/shared/PageHeader';

export default function SettingsPage({ token, user, logout }) {
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function refreshProfile() {
    setLoading(true);
    setError('');
    try {
      const response = await api.me(token);
      setProfile(response.user);
    } catch (requestError) {
      setError(requestError.message || 'Failed to refresh profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="settings-dashboard">
      <PageHeader title="Settings" subtitle="Manage your account preferences and security" />

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="settings-card profile-main-card">
          <div className="card-header">
            <div className="user-avatar-large">
              {profile?.name?.charAt(0) || <User size={32} />}
            </div>
            <div className="header-info">
              <h3>{profile?.name}</h3>
              <span className="user-role-badge">{profile?.role}</span>
            </div>
          </div>
          
          <div className="profile-details">
            <div className="detail-item">
              <Mail size={18} />
              <div className="detail-main">
                <label>Email Address</label>
                <p>{profile?.email}</p>
              </div>
            </div>
            <div className="detail-item">
              <ShieldCheck size={18} />
              <div className="detail-main">
                <label>Account Status</label>
                <p>
                  {profile?.role === 'teacher' ? 'Verified Teacher' :
                   profile?.role === 'admin' ? 'Administrator' :
                   'Verified Student'}
                </p>
              </div>
            </div>
          </div>

          <div className="card-actions">
            <button 
              type="button" 
              className="refresh-profile-btn" 
              onClick={refreshProfile}
              disabled={loading}
            >
              <RefreshCcw size={16} className={loading ? 'spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh Profile'}
            </button>
          </div>
        </div>

        {/* Session Card */}
        <div className="settings-card session-card">
          <div className="card-header-simple">
            <LogOut size={20} />
            <h3>Session Management</h3>
          </div>
          <p className="session-text">You are currently logged in as <strong>{profile?.email}</strong>. Logging out will end your current session across this device.</p>
          <button type="button" className="logout-btn-elevated" onClick={logout}>
            <LogOut size={18} /> Log Out from Platform
          </button>
        </div>
      </div>

      {error && <p className="status-error-pill mt-4">{error}</p>}
    </div>
  );
}
