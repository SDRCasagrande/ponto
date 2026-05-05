'use client';
import { useState, FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, Fingerprint } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Token is set as HttpOnly cookie by server
        localStorage.setItem('bc_auth', JSON.stringify({ email: data.email, role: data.role }));
        onLogin();
      } else {
        setError(data.error || 'Credenciais inválidas');
      }
    } catch {
      setError('Erro de conexão com o servidor');
    }
    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif",
    }}>
      {/* Left — Login Form */}
      <div style={{
        flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#ffffff', padding: '40px',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Logo */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
              }}><Fingerprint size={20} /></div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e1e2d' }}>
                Bit<span style={{ color: '#7c3aed' }}>Converter</span>
              </h1>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
              Acesso ao Sistema de Controle de Ponto
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                E-mail ou usuário
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@bitconverter.com"
                  required
                  style={{
                    width: '100%', padding: '10px 12px 10px 40px',
                    border: '1px solid #e5e7eb', borderRadius: '8px',
                    fontSize: '14px', fontFamily: "'Inter', sans-serif",
                    background: '#f9fafb', color: '#1e1e2d',
                    transition: 'border-color 0.15s',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '10px 44px 10px 40px',
                    border: '1px solid #e5e7eb', borderRadius: '8px',
                    fontSize: '14px', fontFamily: "'Inter', sans-serif",
                    background: '#f9fafb', color: '#1e1e2d',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '10px', top: '10px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', padding: '2px',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: '#7c3aed' }} /> Lembrar de mim
              </label>
              <a href="#" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>Esqueceu a senha?</a>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                background: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff', border: 'none', fontSize: '14px',
                fontWeight: 700, fontFamily: "'Inter', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s, transform 0.1s',
              }}
              onMouseDown={e => (e.target as HTMLElement).style.transform = 'scale(0.98)'}
              onMouseUp={e => (e.target as HTMLElement).style.transform = 'scale(1)'}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '28px' }}>
            © {new Date().getFullYear()} BitKaiser Solution — Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Right — Brand Panel */}
      <div style={{
        flex: '1',
        background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 50%, #1e1b4b 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative shapes */}
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', top: '-80px', right: '-80px',
        }} />
        <div style={{
          position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', bottom: '-60px', left: '-40px',
        }} />
        <div style={{
          position: 'absolute', width: '150px', height: '150px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', top: '40%', right: '20%',
        }} />

        <div style={{ textAlign: 'center', color: '#fff', position: 'relative', zIndex: 1 }}>
          <Fingerprint size={64} style={{ marginBottom: '20px', opacity: 0.9 }} />
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', lineHeight: '1.2' }}>
            Bit<span style={{ opacity: 0.8 }}>Converter</span>
          </h2>
          <p style={{ fontSize: '15px', opacity: 0.7, maxWidth: '340px', lineHeight: '1.6' }}>
            Sistema inteligente de controle de ponto com sincronização automática de relógios ControlID
          </p>

          <div style={{
            marginTop: '32px', display: 'flex', gap: '20px', justifyContent: 'center',
            fontSize: '12px', opacity: 0.6,
          }}>
            {['Tempo Real', 'Relatórios CLT', 'Multi-Relógio'].map(feat => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff' }} />
                {feat}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
