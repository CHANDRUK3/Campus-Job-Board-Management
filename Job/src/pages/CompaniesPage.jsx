import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/ui/Layout/PublicLayout';
import { Button, Card, Badge } from '../components/ui';
import { Building2, Search, Filter, ExternalLink } from 'lucide-react';
import '../style.css';

const CompaniesPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/companies/profiles');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const industries = ['all', ...new Set(companies.map(c => c.industry).filter(Boolean))];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchQuery || 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  return (
    <PublicLayout>
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 24px 60px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--navy-deep)',
            margin: '0 0 8px 0'
          }}>
            Recruiting Companies
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--muted)', margin: 0 }}>
            Explore verified corporate partners participating in campus recruitment drives at Kongu Engineering College.
          </p>

          {/* Search & Filter Bar */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '24px',
            flexWrap: 'wrap',
            alignItems: 'center',
            background: '#ffffff',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search companies by name or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 16px 0 42px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--paper)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              style={{
                height: '44px',
                padding: '0 14px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Industries</option>
              {industries.filter(i => i !== 'all').map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Company Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            Loading recruiting companies...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--navy-deep)', marginBottom: '8px' }}>No Companies Found</h3>
            <p style={{ color: 'var(--muted)' }}>Try adjusting your search terms or industry filter.</p>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px'
          }}>
            {filteredCompanies.map(company => (
              <Card key={company._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '10px',
                      background: 'var(--navy-tint)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: '700',
                      color: 'var(--navy)',
                      fontFamily: 'var(--font-serif)'
                    }}>
                      {company.name ? company.name.charAt(0) : <Building2 size={24} />}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700', color: 'var(--navy-deep)', margin: 0 }}>
                        {company.name}
                      </h3>
                      <Badge tone="info" style={{ marginTop: '4px' }}>{company.industry || 'Technology'}</Badge>
                    </div>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {company.description || 'Verified campus recruitment partner.'}
                  </p>
                </div>

                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ExternalLink size={13} /> {company.website ? company.website.replace('https://', '') : 'Verified Company'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/companies/${company._id}`)}>
                    View Details →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default CompaniesPage;
