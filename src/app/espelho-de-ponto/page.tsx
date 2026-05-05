'use client';
import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, FileText, Printer, Download } from 'lucide-react';
import type { EmployeeReport } from '@/lib/calculator';
import { formatHours } from '@/lib/calculator';

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export default function EspelhoDePontoPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState<EmployeeReport[]>([]);
  const [selectedPis, setSelectedPis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState({ name: '', cnpj: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setCompany(data.company || { name: '', cnpj: '' });
      }
    } catch { /* */ }
    setLoading(false);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const selected = employees.find(e => e.pis === selectedPis);
  const startDay = new Date(year, month - 1, 1);
  const endDay = new Date(year, month, 0);
  const periodStr = `DE ${String(startDay.getDate()).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} ATÉ ${String(endDay.getDate()).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Espelho de Ponto</h2>
          <p>Espelho de Ponto Eletrônico — Formato oficial</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}><ChevronLeft size={15} /></button>
          <span style={{ fontWeight: 700, fontSize: '14px', minWidth: '150px', textAlign: 'center' }}>{MONTHS[month]} {year}</span>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}><ChevronRight size={15} /></button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}><p className="pulse" style={{ color: 'var(--text-secondary)' }}>Gerando espelho de ponto...</p></div>
        ) : !selectedPis ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {employees.map(emp => (
              <div className="card" key={emp.pis} onClick={() => setSelectedPis(emp.pis)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8e0f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: 'var(--accent)' }}>{emp.name[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{emp.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PIS: {emp.pis}</div>
                  </div>
                </div>
              </div>
            ))}
            {employees.length === 0 && <div className="card" style={{ gridColumn: '1 / -1' }}><div className="empty-state"><FileText size={36} /><h3>Sem dados</h3><p>Sincronize um equipamento.</p></div></div>}
          </div>
        ) : selected ? (
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPis(null)}><ChevronLeft size={15} /> Voltar</button>
              <button className="btn btn-ghost btn-sm"><Printer size={14} /> Imprimir</button>
              <button className="btn btn-ghost btn-sm"><Download size={14} /> PDF</button>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              {/* Header — Espelho de Ponto style */}
              <div style={{ padding: '16px 20px', borderBottom: '2px solid var(--brand-red)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Espelho</div><div style={{ fontSize: '20px', fontWeight: 800 }}>de Ponto Eletrônico</div></div>
                <div style={{ textAlign: 'right', color: 'var(--brand-red)', fontWeight: 700 }}>{periodStr}</div>
              </div>

              {/* Employee Info */}
              <div className="emp-info-block">
                <div><span className="label">EMPRESA: </span><span className="value">{company.name || '—'}</span></div>
                <div><span className="label">CNPJ: </span><span className="value">{company.cnpj || '—'}</span></div>
                <div><span className="label">NOME: </span><span className="value">{selected.name}</span></div>
                <div><span className="label">PIS/PASEP: </span><span className="value">{selected.pis}</span></div>
              </div>

              {/* Table — Official espelho format */}
              <table className="data-table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th rowSpan={2}>DIA</th>
                    <th rowSpan={2} style={{ fontSize: '9px' }}>MARCAÇÕES REGISTRADAS<br/>NO PONTO ELETRÔNICO</th>
                    <th colSpan={4} style={{ textAlign: 'center', borderBottom: '1px solid var(--border)' }}>JORNADA REALIZADA</th>
                    <th rowSpan={2} style={{ textAlign: 'center' }}>DURAÇÃO</th>
                    <th rowSpan={2} style={{ textAlign: 'center' }}>CH</th>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'center' }}>ENT. 1</th>
                    <th style={{ textAlign: 'center' }}>SAÍ. 1</th>
                    <th style={{ textAlign: 'center' }}>ENT. 2</th>
                    <th style={{ textAlign: 'center' }}>SAÍ. 2</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.workdays.map(wd => {
                    const dayNum = parseInt(wd.date.substring(8, 10));
                    const d = new Date(parseInt(wd.date.substring(0, 4)), parseInt(wd.date.substring(5, 7)) - 1, dayNum);
                    const dayName = DAYS[d.getDay()];
                    const isWeekend = !wd.isWorkday && wd.punches.length === 0;
                    const isAbsent = wd.isAbsent && wd.isWorkday;

                    const p = wd.punches;
                    const cells = ['', '', '', ''];
                    if (p.length >= 4) { cells[0] = p[0].time; cells[1] = p[1].time; cells[2] = p[2].time; cells[3] = p[3].time; }
                    else if (p.length === 2) {
                      const h = parseInt(p[0].time);
                      if (h >= 11) { cells[2] = p[0].time; cells[3] = p[1].time; }
                      else { cells[0] = p[0].time; cells[3] = p[1].time; }
                    } else { for (let i = 0; i < Math.min(4, p.length); i++) cells[i] = p[i].time; }

                    return (
                      <tr key={wd.date} className={isAbsent ? 'absent' : isWeekend ? 'weekend' : ''}>
                        <td style={{ fontWeight: 600 }}>{String(dayNum).padStart(2, '0')}/{String(month).padStart(2, '0')}/{String(year).substring(2)} - {dayName}</td>
                        <td style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {p.length > 0 ? p.map(pp => pp.time).join(', ') : ''}
                        </td>
                        {cells.map((c, i) => (
                          <td key={i} style={{ textAlign: 'center', fontFamily: 'monospace' }}>{c}</td>
                        ))}
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{wd.workedHours > 0 ? formatHours(wd.workedHours) : ''}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '10px' }}></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
