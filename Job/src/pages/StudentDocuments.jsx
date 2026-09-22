import React from 'react';
import { Card, Button, Badge } from '../components/ui';
import Sidebar from '../components/ui/Layout/Sidebar';
import Topbar from '../components/ui/Layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Award, IdCard, Eye, Download, FolderArchive } from 'lucide-react';
import '../style.css';

const StudentDocuments = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar user={user} />
        <main style={{ padding: '32px 40px', maxWidth: 'var(--content-max-width)', width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              <FolderArchive size={14} />
              <span>VERIFICATION VAULT</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: '700', color: 'var(--navy-deep)', margin: '0 0 4px 0' }}>
              Student Documents & Verification Vault
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
              Upload and manage your placement credentials, marksheets, and official PDF resume.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <Card padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: 'var(--navy-tint)',
                  color: 'var(--navy)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={22} />
                </div>
                <Badge tone="success">Verified Resume</Badge>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '6px' }}>Placement Resume (PDF)</h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '20px' }}>
                Primary resume submitted to recruiting companies during opt-in.
              </p>
              <Button variant="secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => alert('Opening PDF Resume...')}>
                <Eye size={15} />
                <span>Preview Resume PDF</span>
              </Button>
            </Card>

            <Card padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: 'var(--gold-tint)',
                  color: 'var(--gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Award size={22} />
                </div>
                <Badge tone="info">Academic Transcript</Badge>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '6px' }}>Semester Grade Sheets</h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '20px' }}>
                Consolidated 1st-6th semester grade marksheets verified by Placement Cell.
              </p>
              <Button variant="secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => alert('Opening Transcripts...')}>
                <Eye size={15} />
                <span>View Transcripts</span>
              </Button>
            </Card>

            <Card padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: 'var(--navy-tint)',
                  color: 'var(--navy)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IdCard size={22} />
                </div>
                <Badge tone="neutral">Identification</Badge>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '6px' }}>College ID & Identity Proof</h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '20px' }}>
                Official institution identity verification for online test proctoring.
              </p>
              <Button variant="secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => alert('Opening College ID Card...')}>
                <Eye size={15} />
                <span>View ID Card</span>
              </Button>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDocuments;
