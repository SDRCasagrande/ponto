'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, ChevronLeft, ChevronRight, Fingerprint, Calendar, Clock, TrendingUp, TrendingDown, BarChart3, Award } from 'lucide-react';
import { formatHours } from '@/lib/calculator';
import type { EmployeeReport } from '@/lib/calculator';
import Link from 'next/link';

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface EmployeeInfo {
  pis: string; name: string; employeeId: string; cargo: string;
  department: string; phone: string; email: string; admissionDate: string | null;
}

export default function PerfilFuncionarioPage() {
  const searchParams = useSearchParams();
  const pis = searchParams.get('pis');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [info, setInfo] = useState<EmployeeInfo | null>(null);
  const [report, setReport] = useState<EmployeeReport | null>(null);
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (pis) {
        const [rptRes, empRes] = await Promise.all([
          fetch(`/api/reports?month=${month}&year=${year}&pis=${pis}`),
          fetch('/api/employees'),
        ]);
        if (rptRes.ok) {
          const d = await rptRes.json();
          setReport(d.employees?.[0] || null);
        }
        if (empRes.ok) {
          const d = await empRes.json();
          const emps = d.employees || d || [];
          setInfo(emps.find((e: EmployeeInfo) => e.pis === pis) || null);
        }
      } else {
        const res = await fetch('/api/employees');
        if (res.ok) {
          const d = await res.json();
          setEmployees(d.employees || d || []);
        }
      }
    } catch { /* */ }
    setLoading(false);
  }, [pis, month, year]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // If no PIS selected, show employee list
  if (!pis) {
    return (
      <>
        <div className="page-header">
          <div><h2>Perfil do Funcionário</h2><p>Selecione um funcionário para ver detalhes</p></div>
        </div>
        <div className="page-body">
          {loading ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}><p className="pulse">Carregando...</p></div>
          ) : employees.length === 0 ? (
            <div className="card"><div className="empty-state"><User size={36} /><h3>Nenhum funcionário</h3><p>Cadastre funcionários ou importe um arquivo AFD.</p></div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {employees.map(emp => (
                <Link href={`/perfil-funcionario?pis=${emp.pis}`} key={emp.pis} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px' }}>
                        {emp.name[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{emp.name || `PIS ${emp.pis}`}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.cargo || 'Sem cargo'} • {emp.department || 'Sem depto'}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>PIS: {emp.pis}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  // Employee profile view
  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/perfil-funcionario" className="btn btn-ghost btn-sm"><ChevronLeft size={15} /></Link>
          <div><h2>{info?.name || `PIS ${pis}`}</h2><p>Perfil individual e histórico de ponto</p></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}><ChevronLeft size={15} /></button>
          <span style={{ fontWeight: 700, fontSize: '14px', minWidth: '150px', textAlign: 'center' }}>{MONTHS[month]} {year}</span>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}><ChevronRight size={15} /></button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}><p className="pulse">Carregando perfil...</p></div>
        ) : (
          <>
            {/* Profile card */}
            <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '28px', flexShrink: 0 }}>
                  {info?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{info?.name}</h3>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span><Fingerprint size={12} style={{ marginRight: '4px' }} /> PIS: {info?.pis}</span>
                    {info?.employeeId && <span>Matrícula: {info.employeeId}</span>}
                    {info?.cargo && <span><Award size={12} style={{ marginRight: '4px' }} /> {info.cargo}</span>}
                    {info?.department && <span>{info.department}</span>}
                    {info?.phone && <span>📞 {info.phone}</span>}
                    {info?.email && <span>✉️ {info.email}</span>}
                    {info?.admissionDate && <span><Calendar size={12} style={{ marginRight: '4px' }} /> Admissão: {new Date(info.admissionDate).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            {report ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <Clock size={18} style={{ color: 'var(--accent)', marginBottom: '4px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 800 }}>{formatHours(report.totalWorkedHours)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Trabalhadas</div>
                  </div>
                  <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <BarChart3 size={18} style={{ color: '#6b7280', marginBottom: '4px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 800 }}>{formatHours(report.totalExpectedHours)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Previstas</div>
                  </div>
                  <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <TrendingUp size={18} style={{ color: 'var(--green)', marginBottom: '4px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green)' }}>+{formatHours(report.totalOvertimeHours)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Horas Extras</div>
                  </div>
                  <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <TrendingDown size={18} style={{ color: 'var(--red)', marginBottom: '4px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--red)' }}>{report.totalAbsentDays}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Faltas</div>
                  </div>
                  <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <Clock size={18} style={{ color: report.bankBalance >= 0 ? 'var(--green)' : 'var(--red)', marginBottom: '4px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 800, color: report.bankBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {report.bankBalance >= 0 ? '+' : ''}{formatHours(report.bankBalance)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Saldo Banco</div>
                  </div>
                </div>

                {/* Attendance chart (mini bar chart) */}
                <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                  <div className="card-title" style={{ marginBottom: '12px' }}>Presença Diária — {MONTHS[month]}</div>
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '60px' }}>
                    {report.workdays.map((wd, i) => {
                      const h = wd.workedHours > 0 ? Math.max(8, (wd.workedHours / 10) * 60) : 4;
                      const color = wd.isAbsent && wd.isWorkday ? '#ef4444' : wd.workedHours > 0 ? '#7c3aed' : wd.isWorkday ? '#e5e7eb' : '#f3f4f6';
                      return (
                        <div key={i} title={`${wd.date}: ${wd.workedHours > 0 ? formatHours(wd.workedHours) : wd.isAbsent ? 'Falta' : 'Folga'}`}
                          style={{ flex: 1, height: `${h}px`, background: color, borderRadius: '2px', minWidth: '6px', transition: 'height 0.3s ease' }} />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', color: 'var(--text-muted)' }}>
                    <span>Dia 1</span><span>Dia {report.workdays.length}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#7c3aed' }} /> Trabalhou</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444' }} /> Falta</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#e5e7eb' }} /> Folga</span>
                  </div>
                </div>

                {/* Workday detail table */}
                <div className="card" style={{ overflow: 'hidden' }}>
                  <table className="data-table" style={{ fontSize: '11px' }}>
                    <thead>
                      <tr>
                        <th>Dia</th>
                        <th style={{ textAlign: 'center' }}>Marcações</th>
                        <th style={{ textAlign: 'center' }}>Trabalhado</th>
                        <th style={{ textAlign: 'center' }}>Extra</th>
                        <th style={{ textAlign: 'center' }}>Déficit</th>
                        <th>Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.workdays.map(wd => (
                        <tr key={wd.date} className={wd.isAbsent && wd.isWorkday ? 'absent' : !wd.isWorkday && wd.punches.length === 0 ? 'weekend' : ''}>
                          <td style={{ fontWeight: 600 }}>{wd.date.substring(8)}/{wd.date.substring(5, 7)} {wd.dayName}</td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                            {wd.punches.map(p => p.time).join(' · ') || (wd.isAbsent ? '—' : '')}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{wd.workedHours > 0 ? formatHours(wd.workedHours) : ''}</td>
                          <td style={{ textAlign: 'center', color: 'var(--green)', fontWeight: 600 }}>{wd.overtimeHours > 0 ? `+${formatHours(wd.overtimeHours)}` : ''}</td>
                          <td style={{ textAlign: 'center', color: 'var(--red)', fontWeight: 600 }}>{wd.deficitHours > 0 ? `-${formatHours(wd.deficitHours)}` : ''}</td>
                          <td style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{wd.observation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="card"><div className="empty-state"><BarChart3 size={36} /><h3>Sem dados</h3><p>Nenhuma marcação encontrada para este período.</p></div></div>
            )}
          </>
        )}
      </div>
    </>
  );
}
