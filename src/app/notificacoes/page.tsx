'use client';
import { useEffect, useState, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, Clock, UserX, AlertTriangle, Info } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
  createdAt: string;
}

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?unread=${filter === 'unread'}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id?: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', id }),
    });
    load();
  };

  const clearOld = async () => {
    await fetch('/api/notifications', { method: 'DELETE' });
    load();
  };

  const sevIcon = (s: string) => {
    if (s === 'critical') return <UserX size={16} style={{ color: '#ef4444' }} />;
    if (s === 'warning') return <AlertTriangle size={16} style={{ color: '#f59e0b' }} />;
    return <Info size={16} style={{ color: '#3b82f6' }} />;
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Notificações</h2>
          <p>Alertas do sistema e avisos importantes</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => markRead()}>
              <CheckCheck size={14} /> Marcar todas como lidas
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={clearOld}>
            <Trash2 size={14} /> Limpar antigas
          </button>
        </div>
      </div>
      <div className="page-body">
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('all')}>
            Todas ({notifications.length})
          </button>
          <button className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('unread')}>
            Não lidas ({unreadCount})
          </button>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p className="pulse" style={{ color: 'var(--text-secondary)' }}>Carregando notificações...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card"><div className="empty-state">
            <Bell size={36} />
            <h3>Nenhuma notificação</h3>
            <p>Você será notificado sobre eventos importantes do sistema.</p>
          </div></div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {notifications.map((n, i) => (
              <div key={n.id} style={{
                padding: '14px 18px', borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                background: n.read ? 'transparent' : 'rgba(124, 58, 237, 0.03)',
                cursor: n.read ? 'default' : 'pointer',
              }} onClick={() => !n.read && markRead(n.id)}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: n.severity === 'critical' ? '#fef2f2' : n.severity === 'warning' ? '#fffbeb' : '#eff6ff',
                }}>
                  {sevIcon(n.severity)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: n.read ? 500 : 700, fontSize: '13px' }}>{n.title}</span>
                    {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>{n.message}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> {timeAgo(n.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
