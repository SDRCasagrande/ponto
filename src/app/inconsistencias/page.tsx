'use client';
import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, UserX, AlertCircle, CheckCircle } from 'lucide-react';
import type { EmployeeReport } from '@/lib/calculator';

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface Inconsistency {
  type: 'absent' | 'incomplete' | 'late' | 'overtime_high';
  severity: 'critical' | 'warning' | 'info';
  employee: string;
  pis: string;
  date: string;
  description: string;
}

export default function InconsistenciasPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [inconsistencies, setInconsistencies] = useState<Inconsistency[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        const issues: Inconsistency[] = [];

        for (const emp of (data.employees as EmployeeReport[] || [])) {
          for (const wd of emp.workdays) {
            // Absent on workday
            if (wd.isAbsent && wd.isWorkday) {
              issues.push({
                type: 'absent', severity: 'critical',
                employee: emp.name, pis: emp.pis,
                date: wd.date,
                description: `Sem marcações em dia útil (${wd.dayName})`,
              });
            }
            // Incomplete punches (odd number)
            if (wd.isIncomplete && wd.punches.length > 0) {
              issues.push({
                type: 'incomplete', severity: 'warning',
                employee: emp.name, pis: emp.pis,
                date: wd.date,
                description: `Marcação ímpar (${wd.punches.length} batida${wd.punches.length > 1 ? 's' : ''}) — ${wd.punches.map(p => p.time).join(', ')}`,
              });
            }
            // Late arrival
            if (wd.isLate) {
              issues.push({
                type: 'late', severity: 'info',
                employee: emp.name, pis: emp.pis,
                date: wd.date,
                description: `Atraso de ${wd.lateMinutes} minutos (entrada: ${wd.punches[0]?.time || '?'})`,
              });
            }
            // Excessive overtime (>2h in a day)
            if (wd.overtimeHours > 2) {
              issues.push({
                type: 'overtime_high', severity: 'warning',
                employee: emp.name, pis: emp.pis,
                date: wd.date,
                description: `Hora extra acima de 2h (${wd.overtimeHours.toFixed(1)}h)`,
              });
            }
          }
        }

        // Sort by date desc, then severity
        const sevOrder = { critical: 0, warning: 1, info: 2 };
        issues.sort((a, b) => {
          const dateCmp = b.date.localeCompare(a.date);
          if (dateCmp !== 0) return dateCmp;
          return sevOrder[a.severity] - sevOrder[b.severity];
        });

        setInconsistencies(issues);
      }
    } catch { /* */ }
    setLoading(false);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const filtered = filter === 'all' ? inconsistencies : inconsistencies.filter(i => i.type === filter);

  const criticalCount = inconsistencies.filter(i => i.severity === 'critical').length;
  const warningCount = inconsistencies.filter(i => i.severity === 'warning').length;
  const infoCount = inconsistencies.filter(i => i.severity === 'info').length;

  const sevIcon = (s: string) => {
    if (s === 'critical') return <UserX size={14} style={{ color: '#ef4444' }} />;
    if (s === 'warning') return <AlertTriangle size={14} style={{ color: '#f59e0b' }} />;
    return <Clock size={14} style={{ color: '#3b82f6' }} />;
  };

  const sevColor = (s: string) => {
    if (s === 'critical') return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
    if (s === 'warning') return { bg: '#fffbeb', border: '#fde68a', text: '#d97706' };
    return { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' };
  };

  const formatDate = (d: string) => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Inconsistências</h2>
          <p>Marcações faltantes, duplicadas ou fora do horário</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}><ChevronLeft size={15} /></button>
          <span style={{ fontWeight: 700, fontSize: '14px', minWidth: '150px', textAlign: 'center' }}>
            {MONTHS[month]} {year}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}><ChevronRight size={15} /></button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p className="pulse" style={{ color: 'var(--text-secondary)' }}>Analisando inconsistências...</p>
          </div>
        ) : inconsistencies.length === 0 ? (
          <div className="card"><div className="empty-state">
            <CheckCircle size={36} style={{ color: 'var(--green)' }} />
            <h3>Nenhuma inconsistência</h3>
            <p>Todas as marcações de {MONTHS[month]} estão corretas.</p>
          </div></div>
        ) : (
          <>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div className="card" style={{ padding: '16px', cursor: 'pointer', border: filter === 'all' ? '2px solid var(--accent)' : '' }} onClick={() => setFilter('all')}>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>{inconsistencies.length}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total</div>
              </div>
              <div className="card" style={{ padding: '16px', cursor: 'pointer', border: filter === 'absent' ? '2px solid #ef4444' : '' }} onClick={() => setFilter('absent')}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>{criticalCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Faltas</div>
              </div>
              <div className="card" style={{ padding: '16px', cursor: 'pointer', border: filter === 'incomplete' ? '2px solid #f59e0b' : '' }} onClick={() => setFilter('incomplete')}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>{warningCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Marcações Incompletas</div>
              </div>
              <div className="card" style={{ padding: '16px', cursor: 'pointer', border: filter === 'late' ? '2px solid #3b82f6' : '' }} onClick={() => setFilter('late')}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>{infoCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Atrasos</div>
              </div>
            </div>

            {/* List */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {filtered.map((issue, i) => {
                  const c = sevColor(issue.severity);
                  return (
                    <div key={i} style={{
                      padding: '12px 16px', borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)',
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: c.bg, border: `1px solid ${c.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {sevIcon(issue.severity)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{issue.employee}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>PIS: {issue.pis}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {issue.description}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0, fontWeight: 500 }}>
                        {formatDate(issue.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
