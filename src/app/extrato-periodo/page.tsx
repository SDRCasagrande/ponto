'use client';
import { useState, useCallback, useEffect } from 'react';
import { FileText, Download, ChevronLeft, Search } from 'lucide-react';
import type { EmployeeReport } from '@/lib/calculator';
import { formatHours } from '@/lib/calculator';

export default function ExtratoPeriodoPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [endDate, setEndDate] = useState(now.toISOString().substring(0, 10));
  const [employees, setEmployees] = useState<EmployeeReport[]>([]);
  const [loading, setLoading] = useState(false);

  const month = parseInt(startDate.substring(5, 7));
  const year = parseInt(startDate.substring(0, 4));

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

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Extrato por Período</h2>
          <p>Resumo consolidado de marcações por intervalo de datas</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Data Início</label>
              <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Data Fim</label>
              <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={load} disabled={loading}>
              {loading ? 'Buscando...' : 'Pesquisar'}
            </button>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="card"><div className="empty-state">
            <FileText size={36} />
            <h3>Sem dados no período</h3>
            <p>Sincronize os equipamentos para obter marcações.</p>
          </div></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>PIS</th>
                  <th style={{ textAlign: 'center' }}>Horas Trabalhadas</th>
                  <th style={{ textAlign: 'center' }}>Horas Extras</th>
                  <th style={{ textAlign: 'center' }}>Atrasos</th>
                  <th style={{ textAlign: 'center' }}>Faltas</th>
                  <th style={{ textAlign: 'center' }}>Banco de Horas</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.pis}>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{emp.pis}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{formatHours(emp.totalWorkedHours)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--green)', fontWeight: 600 }}>+{formatHours(emp.totalOvertimeHours)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--orange)' }}>{formatHours(emp.totalDeficitHours)}</td>
                    <td style={{ textAlign: 'center' }}><span className={`badge ${emp.totalAbsentDays > 0 ? 'badge-red' : 'badge-green'}`}>{emp.totalAbsentDays}</span></td>
                    <td style={{ textAlign: 'center' }}><span className={`badge ${emp.bankBalance >= 0 ? 'badge-green' : 'badge-red'}`}>{emp.bankBalance >= 0 ? '+' : ''}{formatHours(emp.bankBalance)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
