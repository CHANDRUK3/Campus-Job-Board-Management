import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicLayout from '../components/ui/Layout/PublicLayout';
import Sidebar from '../components/ui/Layout/Sidebar';
import Topbar from '../components/ui/Layout/Topbar';
import DriveCard from '../components/DriveCard';
import { Button, Card, Badge } from '../components/ui';
import { Building2, ArrowLeft, ExternalLink, Mail, CheckCircle2, Briefcase } from 'lucide-react';
import '../style.css';

const CompanyDetailsPage = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyAndDrives();
  }, [companyId]);

  const fetchCompanyAndDrives = async () => {
    try {
      setLoading(true);
      const compRes = await fetch(`http://localhost:5000/api/companies/profiles/${companyId}`);
      if (compRes.ok) {
        const compData = await compRes.json();
        setCompany(compData);
      }

      const drivesRes = await fetch('http://localhost:5000/api/drives');
      if (drivesRes.ok) {
        const drivesData = await drivesRes.json();
        const companyDrives = Array.isArray(drivesData)
          ? drivesData.filter(d => (d.companyId?._id || d.companyId) === companyId)
          : [];
        setDrives(companyDrives);
      }
    } catch (err) {
      console.error('Error fetching company details:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
          Loading company profile...
        </div>
      );
    }

    if (!company) {
      return (
        <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
          <Card padding="lg">
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--navy-deep)', marginBottom: '12px' }}>Company Not Found</h2>
            <Button className="btn-gold" onClick={() => navigate('/companies')}>Back to Companies</Button>
          </Card>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: user ? '32px 40px' : '36px 24px' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/companies')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Companies
        </Button>

        {/* Company Header */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '32px',
          marginBottom: '28px',
          boxShadow: '0 4px 12px rgba(12, 27, 54, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '12px',
              background: 'var(--navy-tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--navy)',
              fontFamily: 'var(--font-serif)'
            }}>
              {company.name ? company.name.charAt(0) : <Building2 size={32} />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '700', color: 'var(--navy-deep)', margin: 0 }}>
                  {company.name}
                </h1>
                <Badge tone="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Verified Partner
                </Badge>
              </div>

              <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 12px 0' }}>
                Industry: <strong style={{ color: 'var(--navy-deep)' }}>{company.industry || 'Technology'}</strong>
              </p>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px', color: 'var(--muted)' }}>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--gold)', textDecoration: 'none', fontWeight: '600' }}>
                    <ExternalLink size={14} /> {company.website.replace('https://', '')}
                  </a>
                )}
                {company.contactEmail && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> {company.contactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '28px' }}>
          <div>
            <Card padding="lg" style={{ marginBottom: '28px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--navy-deep)', marginBottom: '12px' }}>
                About {company.name}
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '15px' }}>
                {company.description || 'Verified enterprise hiring partner conducting campus placement drives.'}
              </p>
            </Card>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--navy-deep)', marginBottom: '20px' }}>
              Active Recruitment Drives ({drives.length})
            </h3>

            {drives.length === 0 ? (
              <Card padding="lg" style={{ textAlign: 'center', color: 'var(--muted)' }}>
                No active drives currently published for this company.
              </Card>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {drives.map(drive => (
                  <div key={drive._id} onClick={() => navigate(`/placement-drives/${drive._id}`)} style={{ cursor: 'pointer' }}>
                    <DriveCard
                      drive={drive}
                      onView={() => navigate(`/placement-drives/${drive._id}`)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Card padding="lg">
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-deep)', marginBottom: '16px' }}>Overview</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)' }}>Active Drives:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--navy-deep)' }}>{drives.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)' }}>Industry:</span>
                  <strong style={{ color: 'var(--navy-deep)' }}>{company.industry || 'Technology'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Status:</span>
                  <strong style={{ color: 'var(--forest)' }}>Verified</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  if (user) {
    return (
      <div className="app-shell">
        <Sidebar user={user} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Topbar user={user} />
          <main style={{ flex: 1 }}>{renderContent()}</main>
        </div>
      </div>
    );
  }

  return (
    <PublicLayout>
      {renderContent()}
    </PublicLayout>
  );
};

export default CompanyDetailsPage;
