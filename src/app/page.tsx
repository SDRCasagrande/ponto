'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Users, Cpu, Fingerprint, Activity, RefreshCw, AlertCircle, FileText, Clock, CalendarDays, BarChart3, Upload, X, CheckCircle, TrendingUp, TrendingDown, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  totalEmployees: number;
  totalClocks: number;
  totalPunches: number;
  punchedToday: number;
  todayPunches: Array<{ id: string; pis: string; punchTime: string; employeeName: string }>;
  recentSyncs: Array<{ id: string; clockName: string; status: string; message: string; punchesNew: number; createdAt: string }>;
  clocks: Array<{ id: string; name: string; ip: string; lastSyncStatus: string; lastSyncAt: string | null }>;
  last7Days: Array<{ date: string; dayName: string; punches: number; employees: number }>;
  monthlySummary: { workedDays: number; absentDays: number; lateDays: number; month: number; year: number };
}

interface ImportResult {
  success: boolean;
  format: string;
  totalPunches: number;
  punchesInserted: number;
  punchesSkipped: number;
  employeesFound: number;
  companyName: string;
  companyCnpj: string;
  dateStart: string;
  dateEnd: string;
}

// SVG Bar Chart Component
function BarChart({ data, label }: { data: Array<{ date: string; dayName: string; punches: number; employees: number }>; label: string }) {
  const maxVal = Math.max(...data.map(d => d.punches), 1);
  const barW = 28;
  const gap = 12;
  const chartH = 120;
  const chartW = data.length * (barW + gap) + gap;

  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>{label}</div>
      <svg width="100%" height={chartH + 30} viewBox={`0 0 ${chartW} ${chartH + 30}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1={0} y1={chartH * (1 - p)} x2={chartW} y2={chartH * (1 - p)}
            stroke="var(--border)" strokeWidth={0.5} strokeDasharray={i > 0 ? "3,3" : ""} />
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const h = (d.punches / maxVal) * chartH;
          const x = gap + i * (barW + gap);
          return (
            <g key={i}>
              <defs>
                <linearGradient id={`bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#5b21b6" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <rect x={x} y={chartH - h} width={barW} height={h} rx={4} fill={`url(#bar-${i})`}>
                <animate attributeName="height" from="0" to={h} dur="0.5s" fill="freeze" />
                <animate attributeName="y" from={chartH} to={chartH - h} dur="0.5s" fill="freeze" />
              </rect>
              {d.punches > 0 && (
                <text x={x + barW / 2} y={chartH - h - 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text-secondary)">
                  {d.punches}
                </text>
              )}
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{d.dayName}</text>
              <text x={x + barW / 2} y={chartH + 26} textAnchor="middle" fontSize="8" fill="var(--text-muted)">{d.date}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Donut Chart Component
function DonutChart({ segments, centerLabel, centerValue }: {
  segments: Array<{ value: number; color: string; label: string }>;
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 40;
  const cx = 55, cy = 55;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circumference;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
              strokeWidth={12} strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset} transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'all 0.5s ease' }} />
          );
        })}
        {total === 0 || segments.every(s => s.value === 0) ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={12} />
        ) : null}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text-primary)">{centerValue}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="var(--text-muted)">{centerLabel}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
            <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Erro ao carregar');
      setData(await res.json());
    } catch { setError('Erro ao carregar dados'); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);

  const syncAll = async () => {
    setSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      await load();
    } catch { /* ignore */ }
    setSyncing(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const result = await res.json();
      setImportResult(result);
      await load();
    } catch {
      setImportResult({ success: false, format: '', totalPunches: 0, punchesInserted: 0, punchesSkipped: 0, employeesFound: 0, companyName: '', companyCnpj: '', dateStart: '', dateEnd: '' });
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (error) return <div className="page-body"><div className="card" style={{ textAlign: 'center', padding: '40px' }}><AlertCircle size={32} style={{ color: 'var(--red)', marginBottom: '8px' }} /><p>{error}</p><button className="btn btn-primary" onClick={load} style={{ marginTop: '12px' }}>Tentar Novamente</button></div></div>;
  if (!data) return <div className="page-body"><p className="pulse" style={{ color: 'var(--text-secondary)' }}>Carregando dashboard...</p></div>;

  const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Visão geral do controle de ponto</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload size={15} />
            {importing ? 'Importando...' : 'Importar AFD'}
          </button>
          <input ref={fileRef} type="file" accept=".txt,.afd" onChange={handleImport} style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={syncAll} disabled={syncing}>
            <RefreshCw size={15} className={syncing ? 'pulse' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Import Result Banner */}
        {importResult && (
          <div style={{
            padding: '14px 18px', borderRadius: '10px', marginBottom: '16px',
            background: importResult.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${importResult.success ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <CheckCircle size={18} style={{ color: importResult.success ? 'var(--green)' : 'var(--red)' }} />
              <div>
                <strong style={{ fontSize: '13px' }}>
                  {importResult.success ? 'Importação concluída!' : 'Erro na importação'}
                </strong>
                {importResult.success && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {importResult.punchesInserted} marcações importadas • {importResult.punchesSkipped} duplicadas ignoradas • {importResult.employeesFound} funcionários detectados
                    {importResult.companyName && ` • ${importResult.companyName}`}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setImportResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link href="/equipamentos" className="quick-action"><Cpu size={28} /><span>Equipamentos</span></Link>
          <Link href="/cadastros" className="quick-action"><Users size={28} /><span>Funcionários</span></Link>
          <Link href="/apuracao" className="quick-action"><BarChart3 size={28} /><span>Apuração de Ponto</span></Link>
          <div className="quick-action" onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }}>
            <Upload size={28} /><span>Importar AFD</span>
          </div>
          <Link href="/cartao-de-ponto" className="quick-action"><FileText size={28} /><span>Cartão de Ponto</span></Link>
          <Link href="/espelho-de-ponto" className="quick-action"><CalendarDays size={28} /><span>Espelho de Ponto</span></Link>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon accent"><Users size={22} /></div>
            <div className="stat-info">
              <div className="stat-value">{data.totalEmployees}</div>
              <div className="stat-label">Funcionários</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Cpu size={22} /></div>
            <div className="stat-info">
              <div className="stat-value">{data.totalClocks}</div>
              <div className="stat-label">Equipamentos</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><UserCheck size={22} /></div>
            <div className="stat-info">
              <div className="stat-value">{data.punchedToday}</div>
              <div className="stat-label">Presentes Hoje</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><Activity size={22} /></div>
            <div className="stat-info">
              <div className="stat-value">{data.totalPunches.toLocaleString()}</div>
              <div className="stat-label">Marcações Totais</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Bar Chart — Last 7 Days */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <span className="card-title">Marcações — Últimos 7 Dias</span>
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
            </div>
            {data.last7Days && data.last7Days.length > 0 ? (
              <BarChart data={data.last7Days} label="" />
            ) : (
              <div className="empty-state" style={{ padding: '30px' }}>
                <BarChart3 size={28} /><p>Sem dados para exibir</p>
              </div>
            )}
          </div>

          {/* Donut Chart — Monthly Attendance */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <span className="card-title">Resumo {MONTHS[data.monthlySummary?.month || 1]}</span>
            </div>
            {data.monthlySummary ? (
              <DonutChart
                segments={[
                  { value: data.monthlySummary.workedDays, color: '#22c55e', label: 'Dias trabalhados' },
                  { value: data.monthlySummary.absentDays, color: '#ef4444', label: 'Faltas' },
                  { value: data.monthlySummary.lateDays, color: '#f59e0b', label: 'Atrasos' },
                ]}
                centerLabel="total"
                centerValue={String(data.monthlySummary.workedDays + data.monthlySummary.absentDays)}
              />
            ) : (
              <div className="empty-state" style={{ padding: '30px' }}>
                <TrendingDown size={28} /><p>Sem dados</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Punches + Equipment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Today's punches */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Últimas Marcações</span>
              <span className="badge badge-green">{data.todayPunches.length}</span>
            </div>
            {data.todayPunches.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <Fingerprint size={28} /><p>Nenhuma marcação hoje</p>
              </div>
            ) : (
              <div className="live-feed">
                {data.todayPunches.map((p, i) => (
                  <div className="feed-item" key={p.id || i}>
                    <div className={`feed-dot ${i % 2 === 0 ? 'in' : 'out'}`} />
                    <span className="feed-name">{p.employeeName}</span>
                    <span className="feed-time">
                      {new Date(p.punchTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clock Status */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Equipamentos</span>
            </div>
            {data.clocks.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <Cpu size={28} /><p>Nenhum equipamento cadastrado</p>
                <Link href="/equipamentos" className="btn btn-primary btn-sm">Adicionar</Link>
              </div>
            ) : (
              <div>
                {data.clocks.map(c => (
                  <div className="feed-item" key={c.id}>
                    <div className={`sync-dot ${c.lastSyncStatus === 'success' || c.lastSyncStatus === 'connected' ? 'online' : c.lastSyncStatus === 'error' ? 'offline' : 'syncing'}`} />
                    <div>
                      <div className="feed-name">{c.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.ip}</div>
                    </div>
                    <span className="feed-time">
                      {c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
