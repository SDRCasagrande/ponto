'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Users, Cpu, Clock, FileText, BarChart3, Settings,
  ChevronDown, ChevronRight, Fingerprint,
  LayoutDashboard, LogOut, Bell, CalendarDays,
  UserCircle, Shield, AlertTriangle, History
} from 'lucide-react';
import { APP_VERSION } from '@/app/atualizacoes/page';

interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  children?: { href: string; label: string }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'Apuração e Cálculo': true,
    'Relatórios': true,
    'Gestão de Pessoas': false,
    'Sistema': false,
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll notifications count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications?unread=true&limit=1');
        if (res.ok) { const d = await res.json(); setUnreadCount(d.unreadCount || 0); }
      } catch { /* */ }
    };
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => clearInterval(iv);
  }, []);

  const NAV: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/notificacoes', label: 'Notificações', icon: Bell, badge: unreadCount },
    { href: '/equipamentos', label: 'Equipamentos', icon: Cpu },
    { href: '/horarios', label: 'Jornadas', icon: Clock },
    {
      label: 'Gestão de Pessoas', icon: Users,
      children: [
        { href: '/cadastros', label: 'Funcionários' },
        { href: '/perfil-funcionario', label: 'Perfil Individual' },
        { href: '/ferias', label: 'Férias / Afastamentos' },
      ],
    },
    {
      label: 'Apuração e Cálculo', icon: BarChart3,
      children: [
        { href: '/apuracao', label: 'Apuração de Ponto' },
        { href: '/banco-de-horas', label: 'Banco de Horas' },
        { href: '/inconsistencias', label: 'Inconsistências' },
      ],
    },
    {
      label: 'Relatórios', icon: FileText,
      children: [
        { href: '/espelho-de-ponto', label: 'Espelho de Ponto' },
        { href: '/cartao-de-ponto', label: 'Cartão de Ponto' },
        { href: '/extrato-periodo', label: 'Extrato por Período' },
      ],
    },
    {
      label: 'Sistema', icon: Settings,
      children: [
        { href: '/usuarios', label: 'Usuários e Permissões' },
        { href: '/configuracoes', label: 'Configurações' },
        { href: '/atualizacoes', label: 'Atualizações' },
      ],
    },
  ];

  const toggleSection = (label: string) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth', { method: 'DELETE' }); } catch { /* */ }
    localStorage.removeItem('bc_auth');
    window.location.reload();
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Fingerprint size={22} />
        </div>
        <div>
          <h1>Bit<span style={{ color: '#7c3aed', fontWeight: 800 }}>Converter</span></h1>
          <span>Controle de Ponto</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV.map((item) => {
          if (item.children) {
            const isExpanded = expanded[item.label];
            const isActive = item.children.some(c => pathname === c.href || pathname.startsWith(c.href + '?'));
            return (
              <div key={item.label}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); toggleSection(item.label); }}
                  className={isActive ? 'active' : ''}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <item.icon size={16} />
                    {item.label}
                  </span>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </a>
                {isExpanded && (
                  <div style={{ paddingLeft: '20px' }}>
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={pathname === child.href || pathname.startsWith(child.href + '?') ? 'active' : ''}
                        style={{ fontSize: '12px', padding: '7px 14px' }}
                      >
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: pathname === child.href ? '#fff' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={pathname === item.href ? 'active' : ''}
              style={{ position: 'relative' }}
            >
              <item.icon size={16} />
              {item.label}
              {item.badge && item.badge > 0 ? (
                <span style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700,
                  padding: '1px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center',
                }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Logout + Footer */}
      <div className="sidebar-footer">
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '12px', color: 'rgba(255,255,255,0.5)',
          textDecoration: 'none', padding: '8px 0', marginBottom: '8px',
          cursor: 'pointer',
        }}>
          <LogOut size={13} /> Sair
        </a>
        <span>© {new Date().getFullYear()} BitKaiser Solution · v{APP_VERSION}</span>
      </div>
    </aside>
  );
}
