import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PublicLayout from '../components/ui/Layout/PublicLayout';
import Sidebar from '../components/ui/Layout/Sidebar';
import Topbar from '../components/ui/Layout/Topbar';
import { Button, Card, Badge } from '../components/ui';
import {
  Code2,
  Database,
  Cpu,
  BrainCircuit,
  Laptop,
  MessageSquare,
  FileCheck,
  FileText,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import '../style.css';

const resources = [
  { title: 'Data Structures & Algorithms', category: 'Coding', desc: 'Master Arrays, Trees, Graphs, and Dynamic Programming for technical interview coding rounds.', progress: 75, icon: Code2 },
  { title: 'SQL & Database Design', category: 'Database', desc: 'Practice complex joins, indexing, aggregation, and relational schema normalization questions.', progress: 90, icon: Database },
  { title: 'Java & Object Oriented Programming', category: 'Core CS', desc: 'Inheritance, Polymorphism, Abstraction, Multithreading, and Garbage Collection concepts.', progress: 60, icon: Cpu },
  { title: 'Quantitative Aptitude & Reasoning', category: 'Aptitude', desc: 'Speed math, probability, logic puzzles, and verbal reasoning required for initial MCQ rounds.', progress: 85, icon: BrainCircuit },
  { title: 'Technical Interview Preparation', category: 'Interview', desc: 'Common system design, project walk-throughs, and code review interview questions.', progress: 40, icon: Laptop },
  { title: 'HR & Behavioral Interview Prep', category: 'Soft Skills', desc: 'STAR technique answers, leadership scenarios, and career vision communication strategies.', progress: 95, icon: MessageSquare },
  { title: 'Resume Building & Portfolio Guide', category: 'Profile', desc: 'ATS-friendly resume templates, action verbs, and project highlight formatting rules.', progress: 100, icon: FileCheck },
  { title: 'Company Mock Tests & Past Papers', category: 'Practice', desc: 'Simulated online assessment environments matching TCS, Infosys, and Cognizant patterns.', progress: 50, icon: FileText },
];

const CareerResourcesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const renderContent = () => (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: user ? '32px 40px' : '36px 24px' }}>
      {/* Header */}
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
          <BookOpen size={14} />
          <span>CAREER PREPARATION MODULES</span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '32px',
          fontWeight: '700',
          color: 'var(--navy-deep)',
          margin: '0 0 8px 0'
        }}>
          Placement Preparation Resources
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '15px',
          color: 'var(--muted)',
          margin: 0,
          maxWidth: '640px'
        }}>
          Curated study guides, interview prep tracks, and aptitude practice modules for Kongu Engineering College students.
        </p>
      </div>

      {/* Resources Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {resources.map((item, index) => {
          const IconComp = item.icon;
          return (
            <Card key={index} padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
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
                    <IconComp size={22} />
                  </div>
                  <Badge tone="info">{item.category}</Badge>
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--navy-deep)',
                  marginBottom: '8px'
                }}>
                  {item.title}
                </h3>

                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '20px'
                }}>
                  {item.desc}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: '6px' }}>
                  <span>Readiness Track</span>
                  <span>{item.progress}% Complete</span>
                </div>
                <div style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: 'var(--paper)',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: `${item.progress}%`,
                    height: '100%',
                    background: item.progress > 80 ? 'var(--forest)' : 'var(--navy)'
                  }} />
                </div>
                <Button
                  variant="secondary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => alert(`Opening resource track: ${item.title}`)}
                >
                  <span>Explore Track</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

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

export default CareerResourcesPage;
