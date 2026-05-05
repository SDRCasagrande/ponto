'use client';
import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, X, Shield, ShieldCheck, Eye, Edit2 } from 'lucide-react';

interface UserItem {
  id: string; email: string; name: string; role: string; active: boolean; lastLogin: string | null; createdAt: string;
}

const ROLES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Administrador', icon: ShieldCheck, color: '#7c3aed' },
  operator: { label: 'Operador', icon: Shield, color: '#3b82f6' },
  viewer: { label: 'Visualizador', icon: Eye, color: '#6b7280' },
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'operator' });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) { const d = await res.json(); setUsers(d.users || []); }
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.email) return;
    if (editId) {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...form }),
      });
    } else {
      if (!form.password) return;
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    setEditId(null);
    setForm({ email: '', name: '', password: '', role: 'operator' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este usuário?')) return;
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    load();
  };

  const startEdit = (u: UserItem) => {
    setEditId(u.id);
    setForm({ email: u.email, name: u.name, password: '', role: u.role });
    setShowForm(true);
  };

  const toggleActive = async (u: UserItem) => {
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, active: !u.active }),
    });
    load();
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Gestão de Usuários</h2><p>Gerenciar acessos e permissões do sistema</p></div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm({ email: '', name: '', password: '', role: 'operator' }); setShowForm(true); }}>
          <Plus size={15} /> Novo Usuário
        </button>
      </div>

      <div className="page-body">
        {/* Role summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {Object.entries(ROLES).map(([key, r]) => {
            const Icon = r.icon;
            const count = users.filter(u => u.role === key && u.active).length;
            return (
              <div className="card" key={key} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${r.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} style={{ color: r.color }} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800 }}>{count}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.label}{count !== 1 ? 'es' : ''}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '20px', padding: '20px', border: '2px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{editId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email / Login</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={!!editId}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nome</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Senha {editId && '(deixe em branco para manter)'}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Permissão</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={submit}>Salvar</button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}><p className="pulse">Carregando...</p></div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Permissão</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Último Login</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const r = ROLES[u.role] || ROLES.viewer;
                  const Icon = r.icon;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{u.name || u.email}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                          <Icon size={13} style={{ color: r.color }} /> {r.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`} style={{ cursor: 'pointer' }} onClick={() => toggleActive(u)}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => startEdit(u)}><Edit2 size={13} /></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => remove(u.id)} style={{ color: 'var(--red)' }}><X size={13} /></button>
                        </div>
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
