'use client';
import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Printer, Download, Check, X as XIcon, AlertTriangle, Search } from 'lucide-react';
import type { EmployeeReport } from '@/lib/calculator';
import { formatHours } from '@/lib/calculator';

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export default function ApuracaoPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState<EmployeeReport[]>([]);
  const [selectedPis, setSelectedPis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

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

  const selected = employees.find(e => e.pis === selectedPis);
  const filtered = employees.filter(e => (e.name || e.pis).toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Apuração de Ponto</h2>
          <p>{filtered.length} de {employees.length} colaboradores</p>
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
            <p className="pulse" style={{ color: 'var(--text-secondary)' }}>Calculando apuração de ponto...</p>
          </div>
        ) : !selectedPis ? (
          /* === LISTA DE FUNCIONÁRIOS === */
          <>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input className="form-input" placeholder="Buscar colaborador..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="card"><div className="empty-state">
                <AlertTriangle size={32} />
                <h3>Sem dados de apuração</h3>
                <p>Sincronize os equipamentos para obter marcações.</p>
              </div></div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Colaborador</th>
                      <th>PIS</th>
                      <th style={{ textAlign: 'center' }}>Banco de Horas</th>
                      <th style={{ textAlign: 'center' }}>Total Trabalhado</th>
                      <th style={{ textAlign: 'center' }}>Horas Extras</th>
                      <th style={{ textAlign: 'center' }}>Atrasos</th>
                      <th style={{ textAlign: 'center' }}>Faltas</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(emp => (
                      <tr key={emp.pis} style={{ cursor: 'pointer' }} onClick={() => setSelectedPis(emp.pis)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8e0f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: 'var(--accent)', flexShrink: 0 }}>
                              {(emp.name || '?')[0]?.toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{emp.name}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{emp.pis}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${emp.bankBalance >= 0 ? 'badge-green' : 'badge-red'}`}>
                            {emp.bankBalance >= 0 ? '+' : ''}{formatHours(emp.bankBalance)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{formatHours(emp.totalWorkedHours)}</td>
                        <td style={{ textAlign: 'center' }}>
                          {emp.totalOvertimeHours > 0 ? (
                            <span style={{ color: 'var(--green)', fontWeight: 600 }}>+{formatHours(emp.totalOvertimeHours)}</span>
                          ) : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {emp.totalDeficitHours > 0 ? (
                            <span style={{ color: 'var(--orange)', fontWeight: 600 }}>{formatHours(emp.totalDeficitHours)}</span>
                          ) : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {emp.totalAbsentDays > 0 ? (
                            <span className="badge badge-red">{emp.totalAbsentDays}</span>
                          ) : <span className="badge badge-green">0</span>}
                        </td>
                        <td><ChevronRight size={14} style={{ color: 'var(--text-muted)' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : selected ? (
          /* === DETALHE DO FUNCIONÁRIO — ESTILO RHiD === */
          <>
            {/* Back + Employee Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPis(null)}>
                <ChevronLeft size={15} /> Voltar
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#e8e0f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: 'var(--accent)' }}>
                  {selected.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{selected.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PIS: {selected.pis}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm"><Printer size={14} /> Imprimir</button>
              <button className="btn btn-ghost btn-sm"><Download size={14} /> Exportar</button>
            </div>

            {/* Summary Stats — RHiD Style (Banco de horas, Total Trabalhado, etc.) */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '16px' }}>
              {[
                { label: 'Banco de Horas', value: `${selected.bankBalance >= 0 ? '+' : ''}${formatHours(selected.bankBalance)}`, color: selected.bankBalance >= 0 ? 'var(--green)' : 'var(--red)' },
                { label: 'Total Trabalhado', value: `${formatHours(selected.totalWorkedHours)}/${formatHours(selected.totalExpectedHours)}`, color: '' },
                { label: 'Horas Extras Dia.', value: formatHours(selected.totalOvertimeHours), color: 'var(--green)' },
                { label: 'Atrasos', value: formatHours(selected.totalDeficitHours), color: 'var(--orange)' },
                { label: 'Faltas', value: `${selected.totalAbsentDays} dias`, color: selected.totalAbsentDays > 0 ? 'var(--red)' : '' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ textAlign: 'center', padding: '14px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '6px' }}>{s.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Punch Table — RHiD Style */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Dia</th>
                    <th></th>
                    <th>Previsto</th>
                    <th style={{ textAlign: 'center' }}>Ent. 1</th>
                    <th style={{ textAlign: 'center' }}>Saí. 1</th>
                    <th style={{ textAlign: 'center' }}>Ent. 2</th>
                    <th style={{ textAlign: 'center' }}>Saí. 2</th>
                    <th style={{ textAlign: 'center' }}>Total Normais</th>
                    <th style={{ textAlign: 'center' }}>Dia Falta</th>
                    <th style={{ textAlign: 'center' }}>Falta e Atraso</th>
                    <th style={{ textAlign: 'center' }}>Extra Diurna</th>
                    <th style={{ textAlign: 'center' }}>Banco Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.workdays.map(wd => {
                    const isWeekend = !wd.isWorkday && wd.punches.length === 0;
                    const isAbsent = wd.isAbsent && wd.isWorkday;
                    const cls = isAbsent ? 'absent' : isWeekend ? 'weekend' : '';

                    const p = wd.punches;
                    const cells = ['', '', '', ''];
                    if (p.length >= 4) { cells[0] = p[0].time; cells[1] = p[1].time; cells[2] = p[2].time; cells[3] = p[3].time; }
                    else if (p.length === 2) {
                      const h = parseInt(p[0].time);
                      if (h >= 11) { cells[2] = p[0].time; cells[3] = p[1].time; }
                      else { cells[0] = p[0].time; cells[3] = p[1].time; }
                    } else { for (let i = 0; i < Math.min(4, p.length); i++) cells[i] = p[i].time; }

                    const dayNum = parseInt(wd.date.substring(8, 10));
                    const d = new Date(parseInt(wd.date.substring(0, 4)), parseInt(wd.date.substring(5, 7)) - 1, dayNum);
                    const dayName = DAYS[d.getDay()];

                    // Determine status icon
                    let statusIcon = null;
                    if (isWeekend) {
                      statusIcon = <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Folga</span>;
                    } else if (isAbsent) {
                      statusIcon = <XIcon size={14} style={{ color: 'var(--red)' }} />;
                    } else if (wd.workedHours > 0) {
                      statusIcon = <Check size={14} style={{ color: 'var(--green)' }} />;
                    }

                    return (
                      <tr key={wd.date} className={cls}>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: '12px' }}>
                          {String(dayNum).padStart(2, '0')}/{String(month).padStart(2, '0')} - {dayName}
                        </td>
                        <td style={{ width: '30px' }}>{statusIcon}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {wd.expectedHours > 0 ? '08:00-12:00 13:00-17:48' : ''}
                        </td>
                        {cells.map((c, i) => (
                          <td key={i} style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', fontWeight: c ? 500 : 400 }}>
                            {isAbsent && !c ? (
                              <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: '11px' }}>Falta</span>
                            ) : isWeekend && !c ? (
                              <span style={{ color: 'var(--green)', fontSize: '11px' }}>Folga</span>
                            ) : c || ''}
                          </td>
                        ))}
                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>
                          {wd.workedHours > 0 ? formatHours(wd.workedHours) : ''}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isAbsent ? <span style={{ fontWeight: 700, color: 'var(--red)' }}>1</span> : ''}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '12px' }}>
                          {wd.deficitHours > 0 && <span className="deficit">{formatHours(wd.deficitHours)}</span>}
                          {wd.isLate && <span className="late" style={{ fontSize: '10px' }}> ↓{Math.round(wd.lateMinutes)}min</span>}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '12px' }}>
                          {wd.overtimeHours > 0 && <span className="overtime">{formatHours(wd.overtimeHours)}</span>}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '12px' }}>
                          {wd.workedHours > 0 || isAbsent ? (
                            <span style={{ color: (wd.overtimeHours - wd.deficitHours) >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                              {(wd.overtimeHours - wd.deficitHours) >= 0 ? '+' : ''}{formatHours(wd.overtimeHours - wd.deficitHours)}
                            </span>
                          ) : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
