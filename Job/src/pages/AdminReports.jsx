import React from 'react';
import { Card, Button } from '../components/ui';
import Sidebar from '../components/ui/Layout/Sidebar';
import Topbar from '../components/ui/Layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/api';
import '../style.css';

const AdminReports = () => {
  const { user } = useAuth();

  const handleExportJobs = async () => {
    try {
      await adminAPI.exportJobs();
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  };

  const handleExportStudents = async () => {
    try {
      await adminAPI.exportStudents();
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  };

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar user={user} />
      <div className="app-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar user={user} />
        <main style={{ padding: '24px 32px', maxWidth: '1200px', width: '100%' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--navy)', margin: '0 0 4px 0' }}>
              Placement Cell Reports & Excel Exports
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Download official placement ledgers, student participation logs, and company hiring summaries.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <Card>
              <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>📊 Placement Drives Export</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Export all active and past recruitment drives, CTC packages, locations, and applicant counts to Excel.
              </p>
              <Button onClick={handleExportJobs}>Download Drives Excel (.xlsx)</Button>
            </Card>

            <Card>
              <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>👨‍🎓 Student Opt-In Ledger</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Export verified student opt-in/opt-out status ledger with CGPA and backlog metrics.
              </p>
              <Button onClick={handleExportStudents}>Download Students Excel (.xlsx)</Button>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminReports;
