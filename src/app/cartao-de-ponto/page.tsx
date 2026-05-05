'use client';
import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Printer, Download, FileText } from 'lucide-react';
import type { EmployeeReport } from '@/lib/calculator';
import { formatHours } from '@/lib/calculator';

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

async function generatePDF(emp: EmployeeReport, company: { name: string; cnpj: string }, month: number, year: number) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(124, 58, 237); // Purple brand
  doc.rect(0, 0, pw, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Cartão de Ponto', 10, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${MONTHS[month]} ${year}`, 10, 18);
  doc.text('BitConverter — Controle de Ponto', pw - 10, 12, { align: 'right' });

  // Employee info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  const y0 = 28;
  doc.setFont('helvetica', 'bold');
  doc.text('Empresa:', 10, y0);
  doc.setFont('helvetica', 'normal');
  doc.text(company.name || 'Não configurado', 32, y0);
  doc.setFont('helvetica', 'bold');
  doc.text('CNPJ:', 140, y0);
  doc.setFont('helvetica', 'normal');
  doc.text(company.cnpj || '—', 155, y0);
  doc.setFont('helvetica', 'bold');
  doc.text('Funcionário:', 10, y0 + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(emp.name, 37, y0 + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('PIS:', 140, y0 + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(emp.pis, 150, y0 + 5);

  // Table data
  const tableData = emp.workdays.map(wd => {
    const dayNum = parseInt(wd.date.substring(8, 10));
    const d = new Date(parseInt(wd.date.substring(0, 4)), parseInt(wd.date.substring(5, 7)) - 1, dayNum);
    const dayName = DAYS[d.getDay()];
    const p = wd.punches;
    const cells = ['', '', '', ''];
    if (p.length >= 4) { cells[0] = p[0].time; cells[1] = p[1].time; cells[2] = p[2].time; cells[3] = p[3].time; }
    else if (p.length === 2) {
      const h = parseInt(p[0].time);
      if (h >= 11) { cells[2] = p[0].time; cells[3] = p[1].time; }
      else { cells[0] = p[0].time; cells[3] = p[1].time; }
    } else { for (let i = 0; i < Math.min(4, p.length); i++) cells[i] = p[i].time; }

    return [
      `${String(dayNum).padStart(2, '0')}/${String(month).padStart(2, '0')} ${dayName}`,
      cells[0], cells[1], cells[2], cells[3],
      wd.workedHours > 0 ? formatHours(wd.workedHours) : wd.isAbsent ? 'FALTA' : '',
      wd.overtimeHours > 0 ? `+${formatHours(wd.overtimeHours)}` : '',
      wd.deficitHours > 0 ? `-${formatHours(wd.deficitHours)}` : '',
    ];
  });

  autoTable(doc, {
    startY: y0 + 10,
    head: [['Dia', 'Ent. 1', 'Saí. 1', 'Ent. 2', 'Saí. 2', 'Total', 'Extra', 'Déficit']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    didParseCell: (data: { row: { index: number }; column: { index: number }; cell: { styles: { textColor: number[] } } }) => {
      if (data.row.index >= 0) {
        const row = tableData[data.row.index];
        if (row && data.column.index === 5 && row[5] === 'FALTA') {
          data.cell.styles.textColor = [220, 38, 38];
        }
        if (data.column.index === 6 && row && row[6]) data.cell.styles.textColor = [34, 197, 94];
        if (data.column.index === 7 && row && row[7]) data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  // Footer totals
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 180;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const summaryY = finalY + 6;
  doc.text(`Total Trabalhado: ${formatHours(emp.totalWorkedHours)}`, 10, summaryY);
  doc.setTextColor(34, 197, 94);
  doc.text(`Horas Extras: +${formatHours(emp.totalOvertimeHours)}`, 80, summaryY);
  doc.setTextColor(220, 38, 38);
  doc.text(`Déficit: -${formatHours(emp.totalDeficitHours)}`, 140, summaryY);
  doc.text(`Faltas: ${emp.totalAbsentDays} dias`, 200, summaryY);
  doc.setTextColor(0, 0, 0);
  doc.text(`Saldo: ${emp.bankBalance >= 0 ? '+' : ''}${formatHours(emp.bankBalance)}`, 250, summaryY);

  // Signature lines
  doc.setDrawColor(0);
  doc.line(10, summaryY + 20, 90, summaryY + 20);
  doc.line(pw - 90, summaryY + 20, pw - 10, summaryY + 20);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Empregador', 50, summaryY + 24, { align: 'center' });
  doc.text('Assinatura do Funcionário', pw - 50, summaryY + 24, { align: 'center' });

  doc.save(`cartao-ponto-${emp.name.replace(/\s+/g, '-').toLowerCase()}-${MONTHS[month].toLowerCase()}-${year}.pdf`);
}

export default function CartaoDePontoPage() {
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
          <h2>Cartão de Ponto</h2>
          <p>Relatório individual para impressão</p>
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
            <p className="pulse" style={{ color: 'var(--text-secondary)' }}>Gerando cartão de ponto...</p>
          </div>
        ) : !selectedPis ? (
          /* Select employee */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {employees.map(emp => (
              <div className="card" key={emp.pis} onClick={() => setSelectedPis(emp.pis)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e8e0f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>
                    {emp.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{emp.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>PIS: {emp.pis}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '11px' }}>
                  <div><div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Trabalhadas</div><div style={{ fontWeight: 600 }}>{formatHours(emp.totalWorkedHours)}</div></div>
                  <div><div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Extras</div><div style={{ fontWeight: 600, color: 'var(--green)' }}>+{formatHours(emp.totalOvertimeHours)}</div></div>
                  <div><div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Faltas</div><div style={{ fontWeight: 600, color: emp.totalAbsentDays > 0 ? 'var(--red)' : '' }}>{emp.totalAbsentDays}</div></div>
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="card" style={{ gridColumn: '1 / -1' }}><div className="empty-state">
                <FileText size={36} />
                <h3>Sem dados</h3>
                <p>Sincronize os equipamentos para gerar cartões de ponto.</p>
              </div></div>
            )}
          </div>
        ) : selected ? (
          /* === CARTÃO DE PONTO IMPRIMÍVEL (Estilo RHiD Vermelho) === */
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPis(null)}><ChevronLeft size={15} /> Voltar</button>
              <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Printer size={14} /> Imprimir</button>
              <button className="btn btn-primary btn-sm" onClick={() => selected && generatePDF(selected, company, month, year)}><Download size={14} /> Baixar PDF</button>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              {/* Red Header */}
              <div className="cartao-header">
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Cartão</h3>
                  <div style={{ fontSize: '20px', fontWeight: 300 }}>de Ponto</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="cartao-period" style={{ fontSize: '13px' }}>{periodStr}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>Bit<span style={{ fontWeight: 800 }}>Converter</span></div>
                  <div style={{ fontSize: '10px', opacity: 0.8 }}>Controle de Ponto</div>
                </div>
              </div>

              {/* Employee Info Block */}
              <div className="emp-info-block">
                <div><span className="label">NOME DA EMPRESA: </span><span className="value">{company.name || 'NÃO CONFIGURADO'}</span></div>
                <div><span className="label">CNPJ: </span><span className="value">{company.cnpj || '—'}</span></div>
                <div><span className="label">NOME DO FUNCIONÁRIO: </span><span className="value">{selected.name}</span></div>
                <div><span className="label">PIS DO FUNCIONÁRIO: </span><span className="value">{selected.pis}</span></div>
              </div>

              {/* Schedule info */}
              <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '24px' }}>
                <span><strong>HORÁRIO:</strong> SEG a SEX 08:00-12:00 / 13:00-17:48</span>
                <span><strong>JORNADA:</strong> 44h semanais</span>
              </div>

              {/* Table */}
              <table className="data-table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>DIA</th>
                    <th>PREVISTO</th>
                    <th style={{ textAlign: 'center' }}>ENT. 1</th>
                    <th style={{ textAlign: 'center' }}>SAÍ. 1</th>
                    <th style={{ textAlign: 'center' }}>ENT. 2</th>
                    <th style={{ textAlign: 'center' }}>SAÍ. 2</th>
                    <th style={{ textAlign: 'center' }}>TOTAL NORMAIS</th>
                    <th style={{ textAlign: 'center' }}>TOTAL NOTURNO</th>
                    <th style={{ textAlign: 'center' }}>DIA FALTA</th>
                    <th style={{ textAlign: 'center' }}>FALTA E ATRASO</th>
                    <th style={{ textAlign: 'center' }}>ABONO</th>
                    <th style={{ textAlign: 'center' }}>EXTRA DIURNA</th>
                    <th style={{ textAlign: 'center' }}>EXTRA NOTURNA</th>
                    <th style={{ textAlign: 'center' }}>BANCO TOTAL</th>
                    <th style={{ textAlign: 'center' }}>BANCO SALDO</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.workdays.map(wd => {
                    const isWeekend = !wd.isWorkday && wd.punches.length === 0;
                    const isAbsent = wd.isAbsent && wd.isWorkday;

                    const dayNum = parseInt(wd.date.substring(8, 10));
                    const d = new Date(parseInt(wd.date.substring(0, 4)), parseInt(wd.date.substring(5, 7)) - 1, dayNum);
                    const dayName = DAYS[d.getDay()];

                    const p = wd.punches;
                    const cells = ['', '', '', ''];
                    if (p.length >= 4) { cells[0] = p[0].time; cells[1] = p[1].time; cells[2] = p[2].time; cells[3] = p[3].time; }
                    else if (p.length === 2) {
                      const h = parseInt(p[0].time);
                      if (h >= 11) { cells[2] = p[0].time; cells[3] = p[1].time; }
                      else { cells[0] = p[0].time; cells[3] = p[1].time; }
                    } else { for (let i = 0; i < Math.min(4, p.length); i++) cells[i] = p[i].time; }

                    const cls = isAbsent ? 'absent' : isWeekend ? 'weekend' : '';

                    return (
                      <tr key={wd.date} className={cls}>
                        <td style={{ fontWeight: 600 }}>{String(dayNum).padStart(2, '0')}/{String(month).padStart(2, '0')}/{String(year).substring(2)} - {dayName}</td>
                        <td style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{wd.expectedHours > 0 ? '08:00-12:00 13:00-17:48' : isWeekend ? 'Folga' : ''}</td>
                        {cells.map((c, i) => (
                          <td key={i} style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                            {isAbsent && !c ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>Falta</span> : isWeekend && !c ? <span style={{ color: 'var(--green)' }}>Folga</span> : c}
                          </td>
                        ))}
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{wd.workedHours > 0 ? formatHours(wd.workedHours) : ''}</td>
                        <td style={{ textAlign: 'center' }}></td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--red)' }}>{isAbsent ? '1' : ''}</td>
                        <td style={{ textAlign: 'center', color: 'var(--orange)' }}>{wd.deficitHours > 0 ? formatHours(wd.deficitHours) : ''}</td>
                        <td style={{ textAlign: 'center' }}></td>
                        <td style={{ textAlign: 'center', color: 'var(--green)', fontWeight: 600 }}>{wd.overtimeHours > 0 ? formatHours(wd.overtimeHours) : ''}</td>
                        <td style={{ textAlign: 'center' }}></td>
                        <td style={{ textAlign: 'center' }}>{wd.workedHours > 0 || isAbsent ? formatHours(wd.overtimeHours - wd.deficitHours) : ''}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: (wd.overtimeHours - wd.deficitHours) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {wd.workedHours > 0 || isAbsent ? formatHours(wd.overtimeHours - wd.deficitHours) : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer totals */}
              <div style={{ padding: '12px 20px', borderTop: '2px solid var(--text-primary)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', fontSize: '12px', background: '#fafbfd' }}>
                <div><strong>Total Trabalhado:</strong><br />{formatHours(selected.totalWorkedHours)}</div>
                <div><strong>Horas Extras:</strong><br /><span style={{ color: 'var(--green)' }}>{formatHours(selected.totalOvertimeHours)}</span></div>
                <div><strong>Atrasos/Déficit:</strong><br /><span style={{ color: 'var(--red)' }}>{formatHours(selected.totalDeficitHours)}</span></div>
                <div><strong>Faltas:</strong><br /><span style={{ color: 'var(--red)' }}>{selected.totalAbsentDays} dias</span></div>
                <div><strong>Banco Saldo:</strong><br /><span style={{ color: selected.bankBalance >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{selected.bankBalance >= 0 ? '+' : ''}{formatHours(selected.bankBalance)}</span></div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
