'use client';
import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Plus, X, Palmtree, Stethoscope, FileCheck, Clock, Award } from 'lucide-react';

interface LeaveItem {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  employee?: { name: string; pis: string };
}

interface Employee { pis: string; name: string; }

const TYPES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ferias: { label: 'Férias', icon: Palmtree, color: '#22c55e' },
  atestado: { label: 'Atestado Médico', icon: Stethoscope, color: '#ef4444' },
  falta_justificada: { label: 'Falta Justificada', icon: FileCheck, color: '#f59e0b' },
  licenca: { label: 'Licença', icon: Clock, color: '#3b82f6' },
  folga_compensatoria: { label: 'Folga Compensatória', icon: Award, color: '#8b5cf6' },
};

export default function FeriasPage() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', type: 'ferias', startDate: '', endDate: '', reason: '' });

  const load = useCallback(async () => {
    try {
      const [lRes, eRes] = await Promise.all([
        fetch('/api/leaves'),
        fetch('/api/employees'),
      ]);
      if (lRes.ok) { const d = await lRes.json(); setLeaves(d.leaves || []); }
      if (eRes.ok) { const d = await eRes.json(); setEmployees(d.employees || d || []); }
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.employeeId || !form.startDate || !form.endDate) return;
    await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ employeeId: '', type: 'ferias', startDate: '', endDate: '', reason: '' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este afastamento?')) return;
    await fetch(`/api/leaves?id=${id}`, { method: 'DELETE' });
    load();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const byType = Object.keys(TYPES).map(t => ({
    type: t,
    ...TYPES[t],
    count: leaves.filter(l => l.type === t).length,
    totalDays: leaves.filter(l => l.type === t).reduce((s, l) => s + l.days, 0),
  }));

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Férias e Afastamentos</h2>
          <p>Controle de férias, atestados e licenças</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Novo Afastamento
        </button>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {byType.map(t => {
            const Icon = t.icon;
            return (
              <div className="card" key={t.type} style={{ padding: '16px', textAlign: 'center' }}>
                <Icon size={22} style={{ color: t.color, marginBottom: '6px' }} />
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{t.count}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.label}</div>
                {t.totalDays > 0 && <div style={{ fontSize: '10px', color: t.color, fontWeight: 600, marginTop: '2px' }}>{t.totalDays} dias</div>}
              </div>
            );
          })}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="card" style={{ marginBottom: '20px', padding: '20px', border: '2px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Novo Afastamento</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Funcionário</label>
                <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <option value="">Selecione...</option>
                  {employees.map(e => <option key={e.pis} value={e.pis}>{e.name} (PIS: {e.pis})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Data Início</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Data Fim</label>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Motivo / Observações</label>
                <input type="text" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Ex: CID A09 ..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={submit}>Salvar</button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p className="pulse" style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="card"><div className="empty-state">
            <CalendarDays size={36} />
            <h3>Nenhum afastamento registrado</h3>
            <p>Clique em "Novo Afastamento" para registrar férias, atestados ou licenças.</p>
          </div></div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'center' }}>Início</th>
                  <th style={{ textAlign: 'center' }}>Fim</th>
                  <th style={{ textAlign: 'center' }}>Dias</th>
                  <th>Motivo</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => {
                  const t = TYPES[l.type] || { label: l.type, color: '#999', icon: Clock };
                  const Icon = t.icon;
                  return (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.employee?.name || l.employeeId}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <Icon size={13} style={{ color: t.color }} /> {t.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{formatDate(l.startDate)}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{formatDate(l.endDate)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{l.days}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{l.reason || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => remove(l.id)} style={{ color: 'var(--red)' }}>
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
