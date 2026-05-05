'use client';
import { useState } from 'react';
import { Calculator, X, Plus, Minus, Clock, RotateCcw } from 'lucide-react';

function parseTime(val: string): number {
  // Parse HH:MM to minutes
  const m = val.match(/^(\d{1,3}):(\d{2})$/);
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);
  // Parse decimal hours
  const n = parseFloat(val);
  if (!isNaN(n)) return Math.round(n * 60);
  return 0;
}

function formatMin(min: number): string {
  const sign = min < 0 ? '-' : '';
  const abs = Math.abs(Math.round(min));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

type CalcMode = 'add' | 'diff' | 'extra';

export default function HoursCalculator() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CalcMode>('add');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [extra, setExtra] = useState('50');
  const [history, setHistory] = useState<string[]>([]);

  const calculate = (): string => {
    if (!a) return '--:--';
    const ma = parseTime(a);
    const mb = parseTime(b);

    switch (mode) {
      case 'add':
        return formatMin(ma + mb);
      case 'diff':
        return formatMin(mb - ma);
      case 'extra': {
        const pct = parseFloat(extra) / 100;
        const extraMin = ma * pct;
        return `${formatMin(ma)} + ${formatMin(extraMin)} = ${formatMin(ma + extraMin)}`;
      }
    }
  };

  const result = calculate();

  const addToHistory = () => {
    if (result && result !== '--:--') {
      setHistory(prev => [`${modeLabel(mode)}: ${result}`, ...prev].slice(0, 8));
    }
  };

  const modeLabel = (m: CalcMode) => {
    switch (m) { case 'add': return 'Soma'; case 'diff': return 'Diferença'; case 'extra': return 'H.Extra'; }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Calculadora de Horas"
        style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: 'var(--accent-light)', color: 'var(--accent)',
          border: '1px solid var(--border)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; }}
      >
        <Calculator size={16} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: '60px', right: '20px', zIndex: 300,
      width: '300px', background: '#fff', borderRadius: '12px',
      border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px' }}>
          <Calculator size={15} style={{ color: 'var(--accent)' }} />
          Calculadora de Horas
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={14} />
        </button>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {(['add', 'diff', 'extra'] as CalcMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1, padding: '8px', fontSize: '11px', fontWeight: 600,
              background: mode === m ? 'var(--accent-light)' : 'transparent',
              color: mode === m ? 'var(--accent)' : 'var(--text-secondary)',
              border: 'none', borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            {m === 'add' && <><Plus size={10} /> Somar</>}
            {m === 'diff' && <><Minus size={10} /> Diferença</>}
            {m === 'extra' && <><Clock size={10} /> H. Extra</>}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {mode === 'diff' ? 'INÍCIO' : mode === 'extra' ? 'HORAS' : 'VALOR A'}
            </label>
            <input
              type="text"
              value={a}
              onChange={e => setA(e.target.value)}
              placeholder="08:00"
              style={{
                width: '100%', padding: '8px 10px', border: '1px solid var(--border)',
                borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace',
                textAlign: 'center', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          {mode !== 'extra' && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                {mode === 'diff' ? 'FIM' : 'VALOR B'}
              </label>
              <input
                type="text"
                value={b}
                onChange={e => setB(e.target.value)}
                placeholder="17:00"
                style={{
                  width: '100%', padding: '8px 10px', border: '1px solid var(--border)',
                  borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace',
                  textAlign: 'center', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          )}
          {mode === 'extra' && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                PERCENTUAL
              </label>
              <select
                value={extra}
                onChange={e => setExtra(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', border: '1px solid var(--border)',
                  borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace',
                  textAlign: 'center', outline: 'none', background: '#fff',
                }}
              >
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100">100%</option>
                <option value="110">110%</option>
              </select>
            </div>
          )}
        </div>

        {/* Result */}
        <div style={{
          background: 'var(--accent-light)', borderRadius: '8px', padding: '12px',
          textAlign: 'center', marginBottom: '10px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>RESULTADO</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>
            {result}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={addToHistory} style={{
            flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
            background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}>
            Salvar
          </button>
          <button onClick={() => { setA(''); setB(''); }} style={{
            padding: '6px 10px', borderRadius: '6px', fontSize: '11px',
            background: 'var(--bg-input)', color: 'var(--text-secondary)',
            border: '1px solid var(--border)', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}>
            <RotateCcw size={10} />
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Histórico</div>
            {history.map((h, i) => (
              <div key={i} style={{ fontSize: '11px', padding: '3px 0', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {h}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
