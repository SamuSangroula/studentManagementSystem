import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Menu,
  Settings,
  Users,
  X,
  CheckCircle,
  Award
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from './lib/api';
import './App.css';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AttendancePage from './pages/AttendancePage';
import MaterialsPage from './pages/MaterialsPage';
import NoticesPage from './pages/NoticesPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import GradeSubmissionsPage from './pages/GradeSubmissionsPage';
import StudentSubmissionsPage from './pages/StudentSubmissionsPage';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'teacher', 'admin'] },
  { to: '/courses', label: 'Courses', icon: BookOpen, roles: ['student', 'teacher', 'admin'] },
  { to: '/assignments', label: 'Assignments', icon: ClipboardList, roles: ['student', 'teacher', 'admin'] },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['student'] },
  { to: '/materials', label: 'Materials', icon: GraduationCap, roles: ['student', 'teacher'] },
  { to: '/notices', label: 'Notices', icon: Megaphone, roles: ['student', 'teacher', 'admin'] },
  { to: '/submissions', label: 'My Submissions', icon: Award, roles: ['student'] },
  { to: '/grades', label: 'Grade Submissions', icon: CheckCircle, roles: ['teacher'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: Settings }
];

const TOKEN_KEY = 'syp_token';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [booting, setBooting] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!token) {
        setUser(null);
        setBooting(false);
        return;
      }

      try {
        const response = await api.me(token);
        if (!cancelled) {
          setUser(response.user || null);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken('');
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const availableNavItems = useMemo(() => {
    if (!user?.role) {
      return [];
    }
    return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));
  }, [user]);

  async function submitAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      if (authMode === 'register') {
        await api.register({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          role: authForm.role
        });
        setAuthMode('login');
        setAuthSuccess('Account created successfully. Please log in.');
        setAuthForm((prev) => ({ ...prev, password: '' }));
        setAuthLoading(false);
        return;
      }

      const response = await api.login({
        email: authForm.email,
        password: authForm.password
      });

      localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      setAuthForm({ name: '', email: '', password: '', role: 'student' });
    } catch (error) {
      setAuthError(error.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken('');
  }

  if (booting) {
    return <div className="boot-state">Loading workspace...</div>;
  }

  if (!token || !user) {
    return (
      <AuthPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        setAuthForm={setAuthForm}
        authLoading={authLoading}
        authError={authError}
        authSuccess={authSuccess}
        onSubmit={submitAuth}
      />
    );
  }

  const defaultPageForRole = 
    user.role === 'admin' ? '/admin-dashboard' :
    user.role === 'teacher' ? '/teacher-dashboard' :
    '/student-dashboard';

  const firstPage = availableNavItems[0]?.to === '/dashboard' ? defaultPageForRole : (availableNavItems[0]?.to || '/settings');

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          {/* removed brand-mark */}
          <div>
            <p className="brand-title">Management</p>
            <p className="brand-subtitle">School Portal</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {availableNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to === '/dashboard' ? defaultPageForRole : item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {isSidebarOpen ? (
        <button
          type="button"
          className="overlay"
          aria-label="Close menu"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <main className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="menu-button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div>
            <h1>Campus Portal</h1>
            <p>
              Signed in as {user.name} ({user.role})
            </p>
          </div>
        </header>

        <section className="page-area">
          <Routes>
            <Route path="/" element={<Navigate to={firstPage} replace />} />
            <Route path="/admin-dashboard" element={user.role === 'admin' ? <DashboardPage token={token} user={user} /> : <Navigate to={defaultPageForRole} replace />} />
            <Route path="/teacher-dashboard" element={user.role === 'teacher' ? <DashboardPage token={token} user={user} /> : <Navigate to={defaultPageForRole} replace />} />
            <Route path="/student-dashboard" element={user.role === 'student' ? <DashboardPage token={token} user={user} /> : <Navigate to={defaultPageForRole} replace />} />
            <Route path="/dashboard" element={<Navigate to={defaultPageForRole} replace />} />
            <Route path="/courses" element={<CoursesPage token={token} user={user} />} />
            <Route path="/courses/:courseId" element={<CourseDetailsPage token={token} user={user} />} />
            <Route path="/assignments" element={<AssignmentsPage token={token} user={user} />} />
            <Route path="/attendance" element={<AttendancePage token={token} user={user} />} />
            <Route path="/materials" element={<MaterialsPage token={token} user={user} />} />
            <Route path="/notices" element={<NoticesPage token={token} user={user} />} />
            <Route path="/submissions" element={<StudentSubmissionsPage token={token} user={user} />} />
            <Route path="/grades" element={<GradeSubmissionsPage token={token} user={user} />} />
            <Route path="/users" element={<UsersPage token={token} user={user} />} />
            <Route path="/settings" element={<SettingsPage token={token} user={user} logout={logout} />} />
            <Route path="*" element={<Navigate to={firstPage} replace />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

export default App;
