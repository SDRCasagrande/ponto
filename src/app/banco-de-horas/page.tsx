'use client';
import { useEffect, useState, useCallback } from 'react';
import { Timer, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatHours } from '@/lib/calculator';
import type { EmployeeReport } from '@/lib/calculator';

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function BancoDeHorasPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState<EmployeeReport[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch { /* */ }
    setLoading(false);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const totalOvertime = employees.reduce((s, e) => s + e.totalOvertimeHours, 0);
  const totalDeficit = employees.reduce((s, e) => s + e.totalDeficitHours, 0);
  const totalBalance = totalOvertime - totalDeficit;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Banco de Horas</h2>
          <p>Saldo acumulado de horas extras e débitos por funcionário</p>
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
            <p className="pulse" style={{ color: 'var(--text-secondary)' }}>Calculando banco de horas...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="card"><div className="empty-state">
            <Timer size={36} />
            <h3>Sem dados de ponto</h3>
            <p>Importe um arquivo AFD ou sincronize um equipamento para calcular o banco de horas.</p>
          </div></div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <TrendingUp size={24} style={{ color: 'var(--green)', marginBottom: '8px' }} />
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green)' }}>+{formatHours(totalOvertime)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Horas Extras</div>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <TrendingDown size={24} style={{ color: 'var(--red)', marginBottom: '8px' }} />
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--red)' }}>-{formatHours(totalDeficit)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Débitos</div>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <Timer size={24} style={{ color: totalBalance >= 0 ? 'var(--green)' : 'var(--red)', marginBottom: '8px' }} />
                <div style={{ fontSize: '24px', fontWeight: 800, color: totalBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {totalBalance >= 0 ? '+' : ''}{formatHours(totalBalance)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Saldo Total</div>
              </div>
            </div>

            {/* Employee table */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th style={{ textAlign: 'center' }}>Horas Previstas</th>
                    <th style={{ textAlign: 'center' }}>Horas Trabalhadas</th>
                    <th style={{ textAlign: 'center' }}>Horas Extras</th>
                    <th style={{ textAlign: 'center' }}>Débitos</th>
                    <th style={{ textAlign: 'center' }}>Saldo</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const balance = emp.totalOvertimeHours - emp.totalDeficitHours;
                    return (
                      <tr key={emp.pis}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              background: balance >= 0 ? '#dcfce7' : '#fef2f2',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '13px',
                              color: balance >= 0 ? 'var(--green)' : 'var(--red)',
                            }}>
                              {emp.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px' }}>{emp.name}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>PIS: {emp.pis}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 500 }}>{formatHours(emp.totalExpectedHours)}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>{formatHours(emp.totalWorkedHours)}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: 'var(--green)' }}>
                          {emp.totalOvertimeHours > 0 ? `+${formatHours(emp.totalOvertimeHours)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: 'var(--red)' }}>
                          {emp.totalDeficitHours > 0 ? `-${formatHours(emp.totalDeficitHours)}` : '—'}
                        </td>
                        <td style={{
                          textAlign: 'center', fontFamily: 'monospace', fontWeight: 800, fontSize: '14px',
                          color: balance >= 0 ? 'var(--green)' : 'var(--red)',
                        }}>
                          {balance >= 0 ? '+' : ''}{formatHours(balance)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {balance > 0.5 ? (
                            <span className="badge badge-green" style={{ gap: '4px' }}><TrendingUp size={11} /> Crédito</span>
                          ) : balance < -0.5 ? (
                            <span className="badge badge-red" style={{ gap: '4px' }}><TrendingDown size={11} /> Débito</span>
                          ) : (
                            <span className="badge" style={{ background: '#f0f0f0', color: '#666', gap: '4px' }}><Minus size={11} /> Neutro</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
