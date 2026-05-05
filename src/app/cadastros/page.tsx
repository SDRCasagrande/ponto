'use client';
import { useEffect, useState } from 'react';
import { Users, Search, Edit3, Save, X } from 'lucide-react';

interface EmployeeData {
  pis: string; name: string; cargo: string; department: string;
  punchCount: number; lastPunch: string | null;
}

export default function CadastrosPage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', cargo: '', department: '' });

  const load = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) setEmployees(await res.json());
    } catch { /* */ }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (emp: EmployeeData) => {
    setEditing(emp.pis);
    setEditForm({ name: emp.name || '', cargo: emp.cargo || '', department: emp.department || '' });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await fetch('/api/employees', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pis: editing, ...editForm }),
    });
    setEditing(null); load();
  };

  const filtered = employees.filter(e =>
    (e.name || e.pis).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Cadastros</h2>
          <p>Funcionários detectados automaticamente via AFD</p>
        </div>
        <span className="badge badge-accent">{employees.length} funcionários</span>
      </div>

      <div className="page-body">
        <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '360px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Buscar por nome ou PIS..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>

        {filtered.length === 0 ? (
          <div className="card"><div className="empty-state">
            <Users size={36} />
            <h3>Nenhum funcionário encontrado</h3>
            <p>Sincronize um equipamento para detectar funcionários automaticamente.</p>
          </div></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>PIS</th>
                  <th>Cargo</th>
                  <th>Departamento</th>
                  <th style={{ textAlign: 'center' }}>Marcações</th>
                  <th>Último Ponto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.pis}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8e0f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: 'var(--accent)', flexShrink: 0 }}>
                          {(emp.name || '?')[0]?.toUpperCase()}
                        </div>
                        {editing === emp.pis ? (
                          <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '160px', padding: '4px 8px', fontSize: '12px' }} />
                        ) : (
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{emp.name || `PIS ${emp.pis}`}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{emp.pis}</td>
                    <td>
                      {editing === emp.pis ? (
                        <input className="form-input" value={editForm.cargo} onChange={e => setEditForm({...editForm, cargo: e.target.value})} placeholder="Cargo" style={{ width: '120px', padding: '4px 8px', fontSize: '12px' }} />
                      ) : (emp.cargo || '—')}
                    </td>
                    <td>
                      {editing === emp.pis ? (
                        <input className="form-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="Departamento" style={{ width: '120px', padding: '4px 8px', fontSize: '12px' }} />
                      ) : (emp.department || '—')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-blue">{emp.punchCount}</span>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {emp.lastPunch ? new Date(emp.lastPunch).toLocaleString('pt-BR') : 'Nunca'}
                    </td>
                    <td>
                      {editing === emp.pis ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-sm btn-primary" onClick={saveEdit}><Save size={12} /></button>
                          <button className="btn btn-sm btn-ghost" onClick={() => setEditing(null)}><X size={12} /></button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-ghost" onClick={() => startEdit(emp)}><Edit3 size={12} /></button>
                      )}
                    </td>
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
