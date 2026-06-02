import { useCallback, useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../lib/api';
import PageHeader from '../components/shared/PageHeader';
import { 
  Check, 
  Lock, 
  Calendar,
  Clock,
  CheckCircle2,
  Download
} from 'lucide-react';

export default function AttendancePage({ token, user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const loadAttendance = useCallback(async () => {
    if (user.role !== 'student') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.myAttendance(token);
      setRecords(response.attendance || []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, [token, user.role]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  async function markPresent() {
    setError('');
    setStatusMessage('');
    try {
      const response = await api.markPresent(token);
      setStatusMessage(response.message || 'Attendance marked successfully.');
      await loadAttendance();
    } catch (requestError) {
      setError(requestError.message || 'Could not mark attendance.');
    }
  }

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Attendance Report`, 14, 20);
    
    const tableColumn = ["Date", "Time", "Status"];
    const tableRows = [];

    // Build map of present records by date string
    const recordsMap = {};
    records.forEach(r => {
      recordsMap[r.date] = r;
    });

    // Start from user creation date or fallback to 30 days ago
    const startDate = new Date(user.createdAt || Date.now() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(23,59,59,999);

    let currentDate = new Date(startDate);
    let totalAbsent = 0;
    
    while (currentDate <= today) {
      // Skip Saturdays (weekend in Nepal/many parts of South Asia)
      if (currentDate.getDay() !== 6) {
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        
        const record = recordsMap[dateStr];
        if (record && record.status === 'present') {
          const time = new Date(record.markedAt).toLocaleTimeString();
          tableRows.push([currentDate.toLocaleDateString(), time, 'Present']);
        } else {
          tableRows.push([currentDate.toLocaleDateString(), '--:--', 'Absent']);
          totalAbsent++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Reverse to show newest dates first
    tableRows.reverse();

    doc.setFontSize(11);
    doc.text(`Name: ${user.name}`, 14, 28);
    doc.text(`Email: ${user.email}`, 14, 34);
    doc.text(`Present: ${records.filter(r => r.status === 'present').length} | Absent: ${totalAbsent}`, 14, 40);
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 46);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 52,
    });

    doc.save(`Attendance_${user.name.replace(/\s+/g, '_')}.pdf`);
  };

  // Handle non-student view
  if (user.role !== 'student') {
    return (
      <div className="attendance-page">
        <PageHeader title="Attendance" subtitle="Student attendance management system" />
        <div className="content-locked">
          <Lock size={48} />
          <p>This section is available for students only.</p>
        </div>
      </div>
    );
  }

  // Date Logic
  const todayDate = new Date();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(todayDate.getDate() - 1);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(todayDate.getDate() + 1);

  const formatCardDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isMarked = (date) => {
    const dStr = getLocalDateStr(date);
    return records.find(r => r.date === dStr && r.status === 'present');
  };

  const yesterdayRecord = isMarked(yesterdayDate);
  const todayRecord = isMarked(todayDate);

  return (
    <div className="attendance-page">
      <PageHeader title="Attendance" subtitle={`Mark your attendance · Logged in as ${user.role}`} />
      
      {error && <p className="status-error-pill" style={{ margin: '1rem 0' }}><Calendar size={16} /> Error: {error}</p>}
      {statusMessage && <p className="status-success-pill" style={{ margin: '1rem 0' }}><Check size={16} /> Success: {statusMessage}</p>}

      <div className="attendance-timeline">
        {/* Yesterday Row */}
        <div className="timeline-group">
          <span className="timeline-label">Yesterday</span>
          <div className="attendance-card-row yesterday-row">
            <div className="date-info">
              <h3>{formatCardDate(yesterdayDate)}</h3>
              <p>{yesterdayRecord ? `Marked at ${new Date(yesterdayRecord.markedAt).toLocaleTimeString()}` : 'No record for yesterday'}</p>
            </div>
            <div className={`status-badge ${yesterdayRecord ? 'present' : 'absent'}`}>
              <Check size={16} /> {yesterdayRecord ? 'Present' : 'Absent'}
            </div>
          </div>
        </div>

        {/* Today Row */}
        <div className="timeline-group">
          <span className="timeline-label">Today</span>
          <div className={`attendance-card-row today-row ${todayRecord ? 'marked' : 'active-row'}`}>
            <div className="date-info">
              <h3>{formatCardDate(todayDate)}</h3>
              <p>{todayRecord ? `Marked at ${new Date(todayRecord.markedAt).toLocaleTimeString()}` : 'Today — mark before end of day'}</p>
            </div>
            {todayRecord ? (
              <div className="status-badge success-large">
                <CheckCircle2 size={18} /> Marked Present
              </div>
            ) : (
              <button 
                className="mark-attendance-btn" 
                onClick={markPresent} 
                disabled={loading}
                style={{ scale: loading ? '0.98' : '1' }}
              >
                {loading ? 'Processing...' : 'Mark Present'}
              </button>
            )}
          </div>
        </div>

        {/* Tomorrow Row */}
        <div className="timeline-group">
          <span className="timeline-label">Tomorrow</span>
          <div className="attendance-card-row tomorrow-row">
            <div className="date-info">
              <h3>{formatCardDate(tomorrowDate)}</h3>
              <p>Tomorrow — not available yet</p>
            </div>
            <div className="status-badge locked">
              <Lock size={16} /> Locked
            </div>
          </div>
        </div>
      </div>

      <div className="past-records-section">
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3>Attendance Record Details</h3>
           {records.length > -1 && (
             <button 
               onClick={(e) => { e.preventDefault(); downloadPDF(); }} 
               className="secondary-button" 
               style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: 'white' }}
             >
               <Download size={16} /> Download PDF
             </button>
           )}
         </div>
         <div className="record-summary">
            {records.length > 0 ? (
              <p>You have {records.filter(r => r.status === 'present').length} total present marks on file.</p>
            ) : (
              <p>No attendance records found yet.</p>
            )}
         </div>
      </div>
    </div>
  );
}
