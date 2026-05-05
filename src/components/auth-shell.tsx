'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/sidebar';
import LoginPage from '@/components/login-page';
import HoursCalculator from '@/components/hours-calculator';

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('bc_auth');
    setIsAuth(!!auth);
  }, []);

  const handleLogin = () => setIsAuth(true);

  // Loading state
  if (isAuth === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f6fa' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 10a2 2 0 0 0-2 2c0 1.02.1 2.51.4 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
            </svg>
          </div>
          <p style={{ color: '#6b7280', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show login
  if (!isAuth) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Authenticated — show app with calculator
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <HoursCalculator />
    </div>
  );
}
