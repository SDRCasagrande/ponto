'use client';
import { useState } from 'react';
import { Clock, Plus, Edit3, Trash2, Save, X, Check } from 'lucide-react';

interface Jornada {
  id: string;
  name: string;
  type: string; // CLT_44, CLT_36, ESCALA_12x36, CUSTOM
  weeklyHours: number;
  dailyHours: number;
  entryTime: string;
  breakStart: string;
  breakEnd: string;
  exitTime: string;
  saturdayEntry: string;
  saturdayExit: string;
  saturdayHours: number;
  workDays: number[]; // 0=DOM, 1=SEG...
  isDefault: boolean;
}

const PRESETS: Record<string, Partial<Jornada>> = {
  'CLT_44': {
    name: 'Comercial 44h', type: 'CLT_44', weeklyHours: 44, dailyHours: 8.8,
    entryTime: '08:00', breakStart: '12:00', breakEnd: '13:00', exitTime: '17:48',
    saturdayEntry: '08:00', saturdayExit: '12:00', saturdayHours: 4,
    workDays: [1, 2, 3, 4, 5, 6],
  },
  'CLT_40': {
    name: 'Comercial 40h', type: 'CLT_40', weeklyHours: 40, dailyHours: 8,
    entryTime: '08:00', breakStart: '12:00', breakEnd: '13:00', exitTime: '17:00',
    saturdayEntry: '', saturdayExit: '', saturdayHours: 0,
    workDays: [1, 2, 3, 4, 5],
  },
  'CLT_36': {
    name: 'Reduzida 36h', type: 'CLT_36', weeklyHours: 36, dailyHours: 6,
    entryTime: '08:00', breakStart: '12:00', breakEnd: '12:15', exitTime: '14:15',
    saturdayEntry: '08:00', saturdayExit: '14:00', saturdayHours: 6,
    workDays: [1, 2, 3, 4, 5, 6],
  },
  'ESCALA_12x36': {
    name: 'Escala 12x36', type: 'ESCALA_12x36', weeklyHours: 42, dailyHours: 12,
    entryTime: '07:00', breakStart: '12:00', breakEnd: '13:00', exitTime: '19:00',
    saturdayEntry: '', saturdayExit: '', saturdayHours: 0,
    workDays: [0, 1, 2, 3, 4, 5, 6],
  },
};

const DAYS_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export default function JornadasPage() {
  const [jornadas, setJornadas] = useState<Jornada[]>([
    { id: '1', ...PRESETS['CLT_44'], isDefault: true } as Jornada,
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Jornada>>({});

  const openNew = (presetKey?: string) => {
    const preset = presetKey ? PRESETS[presetKey] : PRESETS['CLT_44'];
    setForm({ ...preset, isDefault: false });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (j: Jornada) => {
    setForm({ ...j });
    setEditingId(j.id);
    setShowModal(true);
  };

  const saveJornada = () => {
    if (editingId) {
      setJornadas(prev => prev.map(j => j.id === editingId ? { ...j, ...form } as Jornada : j));
    } else {
      const newJ: Jornada = {
        id: Date.now().toString(),
        name: form.name || 'Nova Jornada',
        type: form.type || 'CUSTOM',
        weeklyHours: form.weeklyHours || 44,
        dailyHours: form.dailyHours || 8,
        entryTime: form.entryTime || '08:00',
        breakStart: form.breakStart || '12:00',
        breakEnd: form.breakEnd || '13:00',
        exitTime: form.exitTime || '17:00',
        saturdayEntry: form.saturdayEntry || '',
        saturdayExit: form.saturdayExit || '',
        saturdayHours: form.saturdayHours || 0,
        workDays: form.workDays || [1, 2, 3, 4, 5],
        isDefault: false,
      };
      setJornadas(prev => [...prev, newJ]);
    }
    setShowModal(false);
    setForm({});
  };

  const deleteJornada = (id: string) => {
    if (!confirm('Remover esta jornada?')) return;
    setJornadas(prev => prev.filter(j => j.id !== id));
  };

  const setDefault = (id: string) => {
    setJornadas(prev => prev.map(j => ({ ...j, isDefault: j.id === id })));
  };

  const toggleDay = (day: number) => {
    const days = form.workDays || [];
    setForm({ ...form, workDays: days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort() });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Jornadas de Trabalho</h2>
          <p>Gerenciamento de escalas e horários de trabalho</p>
        </div>
        <button className="btn btn-primary" onClick={() => openNew()}>
          <Plus size={15} /> Nova Jornada
        </button>
      </div>

      <div className="page-body">
        {/* Preset shortcuts */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} className="btn btn-ghost btn-sm" onClick={() => openNew(key)}>
              <Plus size={12} /> {p.name}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
          {jornadas.map(j => (
            <div className="card" key={j.id} style={{ position: 'relative' }}>
              {j.isDefault && (
                <span className="badge badge-green" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <Check size={10} /> Padrão
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>{j.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{j.weeklyHours}h semanais</span>
                </div>
              </div>

              {/* Schedule blocks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: '12px' }}>
                <div style={{ background: 'var(--bg-light)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>MANHÃ</div>
                  <div style={{ fontWeight: 600 }}>{j.entryTime} — {j.breakStart}</div>
                </div>
                <div style={{ background: 'var(--bg-light)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>TARDE</div>
                  <div style={{ fontWeight: 600 }}>{j.breakEnd} — {j.exitTime}</div>
                </div>
              </div>

              {/* Work days */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                {DAYS_SHORT.map((d, i) => (
                  <div key={d} style={{
                    width: '32px', height: '26px', borderRadius: '4px', fontSize: '9px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: j.workDays.includes(i) ? 'var(--accent)' : 'var(--bg-light)',
                    color: j.workDays.includes(i) ? '#fff' : 'var(--text-muted)',
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              {j.saturdayHours > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Sábado: {j.saturdayEntry} — {j.saturdayExit} ({j.saturdayHours}h)
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {!j.isDefault && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setDefault(j.id)}>
                    Definir como padrão
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(j)}>
                  <Edit3 size={12} /> Editar
                </button>
                {!j.isDefault && (
                  <button className="btn btn-sm" onClick={() => deleteJornada(j.id)} style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Editar Jornada' : 'Nova Jornada'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome da Jornada</label>
                <input className="form-input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Comercial 44h" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Carga Semanal (horas)</label>
                  <input className="form-input" type="number" value={form.weeklyHours || 44} onChange={e => setForm({ ...form, weeklyHours: +e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Carga Diária (horas)</label>
                  <input className="form-input" type="number" step="0.1" value={form.dailyHours || 8} onChange={e => setForm({ ...form, dailyHours: +e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Entrada</label>
                  <input className="form-input" type="time" value={form.entryTime || '08:00'} onChange={e => setForm({ ...form, entryTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Intervalo Início</label>
                  <input className="form-input" type="time" value={form.breakStart || '12:00'} onChange={e => setForm({ ...form, breakStart: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Intervalo Fim</label>
                  <input className="form-input" type="time" value={form.breakEnd || '13:00'} onChange={e => setForm({ ...form, breakEnd: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Saída</label>
                  <input className="form-input" type="time" value={form.exitTime || '17:00'} onChange={e => setForm({ ...form, exitTime: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Dias de Trabalho</label>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {DAYS_SHORT.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(i)}
                      style={{
                        padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                        border: '1px solid var(--border)', cursor: 'pointer',
                        background: (form.workDays || []).includes(i) ? 'var(--accent)' : '#fff',
                        color: (form.workDays || []).includes(i) ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Sábado (se diferente)</label>
                <div className="form-row">
                  <div className="form-group">
                    <label>Entrada Sáb.</label>
                    <input className="form-input" type="time" value={form.saturdayEntry || ''} onChange={e => setForm({ ...form, saturdayEntry: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Saída Sáb.</label>
                    <input className="form-input" type="time" value={form.saturdayExit || ''} onChange={e => setForm({ ...form, saturdayExit: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Horas Sáb.</label>
                    <input className="form-input" type="number" step="0.5" value={form.saturdayHours || 0} onChange={e => setForm({ ...form, saturdayHours: +e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveJornada}>
                <Save size={14} /> {editingId ? 'Salvar' : 'Criar Jornada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
