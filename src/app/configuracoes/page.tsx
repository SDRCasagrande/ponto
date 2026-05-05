'use client';
import { useEffect, useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';

interface ConfigData {
  companyName: string; companyCnpj: string; companyAddress: string;
  companyCity: string; companyState: string; companyPhone: string;
  scheduleType: string; entryTime: string; exitTime: string;
  breakStart: string; breakEnd: string; breakDuration: number;
  toleranceMinutes: number; weeklyHours: number; dailyHours: number;
  saturdayHours: number; workdays: string;
  autoSyncEnabled: boolean; syncIntervalMin: number;
}

const SCHEDULE_OPTIONS = [
  { value: 'padrao', label: 'Padrão CLT (8h seg-sex + 4h sáb = 44h/sem)' },
  { value: '5x2', label: '5x2 (8h48/dia seg-sex = 44h/sem)' },
  { value: '6x1', label: '6x1 (8h seg-sex + 4h sáb = 44h/sem)' },
  { value: '12x36', label: '12x36 (12h trabalho / 36h descanso)' },
  { value: 'parcial_30', label: 'Parcial 30h (até 30h/sem)' },
  { value: 'parcial_26', label: 'Parcial 26h (até 26h/sem)' },
];

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig);
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const update = (key: keyof ConfigData, value: string | number | boolean) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  if (!config) return <div className="page-body"><p className="pulse">Carregando...</p></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Configurações</h2>
          <p>Dados da empresa e escala de trabalho</p>
        </div>
        <button className="btn btn-success" onClick={save} disabled={saving}>
          {saved ? <><Check size={16} /> Salvo!</> : saving ? 'Salvando...' : <><Save size={16} /> Salvar</>}
        </button>
      </div>

      <div className="page-body" style={{ maxWidth: '700px' }}>
        {/* Company */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header"><span className="card-title">Dados da Empresa</span></div>
          <div className="form-group">
            <label>Nome / Razão Social</label>
            <input className="form-input" value={config.companyName} onChange={e => update('companyName', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>CNPJ</label>
              <input className="form-input" value={config.companyCnpj} onChange={e => update('companyCnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input className="form-input" value={config.companyPhone} onChange={e => update('companyPhone', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Endereço</label>
            <input className="form-input" value={config.companyAddress} onChange={e => update('companyAddress', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cidade</label>
              <input className="form-input" value={config.companyCity} onChange={e => update('companyCity', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Estado (UF)</label>
              <input className="form-input" value={config.companyState} onChange={e => update('companyState', e.target.value)} maxLength={2} />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header"><span className="card-title">Escala de Trabalho</span></div>
          <div className="form-group">
            <label>Tipo de Escala</label>
            <select className="form-select" value={config.scheduleType} onChange={e => update('scheduleType', e.target.value)}>
              {SCHEDULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Entrada</label>
              <input className="form-input" type="time" value={config.entryTime} onChange={e => update('entryTime', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Saída</label>
              <input className="form-input" type="time" value={config.exitTime} onChange={e => update('exitTime', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Horas/dia</label>
              <input className="form-input" type="number" step="0.1" value={config.dailyHours} onChange={e => update('dailyHours', parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Horas Sábado</label>
              <input className="form-input" type="number" step="0.1" value={config.saturdayHours} onChange={e => update('saturdayHours', parseFloat(e.target.value))} />
            </div>
          </div>
          <div className="form-group">
            <label>Tolerância para atraso (minutos — CLT art. 58)</label>
            <input className="form-input" type="number" value={config.toleranceMinutes} onChange={e => update('toleranceMinutes', parseInt(e.target.value))} />
          </div>
        </div>

        {/* Sync */}
        <div className="card">
          <div className="card-header"><span className="card-title">Sincronização Automática</span></div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={config.autoSyncEnabled} onChange={e => update('autoSyncEnabled', e.target.checked)} />
              Sincronizar relógios automaticamente
            </label>
          </div>
          <div className="form-group">
            <label>Intervalo de sync (minutos)</label>
            <input className="form-input" type="number" value={config.syncIntervalMin} onChange={e => update('syncIntervalMin', parseInt(e.target.value))} min={1} max={60} style={{ maxWidth: '120px' }} />
          </div>
        </div>
      </div>
    </>
  );
}
