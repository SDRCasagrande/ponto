'use client';
import { useEffect, useState } from 'react';
import { Cpu, Plus, RefreshCw, Trash2, Wifi, WifiOff, X } from 'lucide-react';

interface ClockData {
  id: string; name: string; ip: string; port: number; protocol: string;
  login: string; password: string; deviceName: string; serial: string;
  lastSyncAt: string | null; lastSyncStatus: string; lastSyncError: string;
  syncEnabled: boolean; syncInterval: number;
}

export default function EquipamentosPage() {
  const [clocks, setClocks] = useState<ClockData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', ip: '', port: '443', login: 'admin', password: 'admin', protocol: 'https' });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/clocks');
      if (res.ok) setClocks(await res.json());
    } catch { /* */ }
  };

  useEffect(() => { load(); }, []);

  const testConn = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('/api/clocks/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      setTestResult(await res.json());
    } catch { setTestResult({ success: false, message: 'Erro de conexão' }); }
    setTesting(false);
  };

  const addClock = async () => {
    setSaving(true);
    await fetch('/api/clocks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, port: parseInt(form.port) }),
    });
    setSaving(false); setShowModal(false);
    setForm({ name: '', ip: '', port: '443', login: 'admin', password: 'admin', protocol: 'https' });
    setTestResult(null); load();
  };

  const deleteClock = async (id: string) => {
    if (!confirm('Remover este equipamento?')) return;
    await fetch(`/api/clocks?id=${id}`, { method: 'DELETE' }); load();
  };

  const syncOne = async (id: string) => {
    setSyncingId(id);
    await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clockId: id }) });
    await load(); setSyncingId(null);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Equipamentos</h2>
          <p>Relógios de ponto ControlID cadastrados no sistema</p>
        </div>
        <button className="btn btn-red" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Adicionar
        </button>
      </div>

      <div className="page-body">
        {clocks.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Cpu size={40} />
              <h3>Nenhum equipamento cadastrado</h3>
              <p>Cadastre seu primeiro relógio ControlID para começar a sincronizar as marcações automaticamente.</p>
              <button className="btn btn-red btn-lg" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Adicionar Equipamento
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {clocks.map(c => (
              <div className="card" key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>{c.name}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.ip}:{c.port}</span>
                  </div>
                  <div className="sync-status">
                    <div className={`sync-dot ${c.lastSyncStatus === 'success' || c.lastSyncStatus === 'connected' ? 'online' : c.lastSyncStatus === 'error' ? 'offline' : 'syncing'}`} />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {c.lastSyncStatus === 'success' || c.lastSyncStatus === 'connected' ? 'Online' : c.lastSyncStatus === 'error' ? 'Erro' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {c.deviceName && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {c.deviceName} {c.serial && `• S/N: ${c.serial}`}
                  </div>
                )}

                {c.lastSyncError && (
                  <div style={{ fontSize: '11px', color: 'var(--red)', marginBottom: '6px', padding: '4px 8px', background: 'var(--red-bg)', borderRadius: '4px' }}>
                    {c.lastSyncError.substring(0, 80)}
                  </div>
                )}

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Último sync: {c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString('pt-BR') : 'Nunca'}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => syncOne(c.id)} disabled={syncingId === c.id}>
                    <RefreshCw size={13} className={syncingId === c.id ? 'pulse' : ''} />
                    {syncingId === c.id ? 'Sync...' : 'Sincronizar'}
                  </button>
                  <button className="btn btn-sm" onClick={() => deleteClock(c.id)} style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adicionar Equipamento</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome do Equipamento</label>
                <input className="form-input" placeholder="Ex: Entrada Principal" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>IP do Equipamento</label>
                <input className="form-input" placeholder="Ex: 192.168.18.228" value={form.ip} onChange={e => setForm({...form, ip: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Usuário</label>
                  <input className="form-input" value={form.login} onChange={e => setForm({...form, login: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Senha</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </div>
              {testResult && (
                <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '10px', background: testResult.success ? 'var(--green-bg)' : 'var(--red-bg)', color: testResult.success ? 'var(--green)' : 'var(--red)', fontSize: '12px' }}>
                  {testResult.success ? <Wifi size={13} style={{ marginRight: '4px' }} /> : <WifiOff size={13} style={{ marginRight: '4px' }} />}
                  {testResult.message}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={testConn} disabled={testing || !form.ip}>
                {testing ? 'Testando...' : 'Testar Conexão'}
              </button>
              <button className="btn btn-red" onClick={addClock} disabled={saving || !form.name || !form.ip}>
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
