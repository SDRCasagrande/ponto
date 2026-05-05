'use client';
import { useState } from 'react';
import { History, ChevronDown, ChevronRight, Sparkles, Bug, Wrench, Shield, Rocket, Package } from 'lucide-react';

interface ChangeEntry {
  type: 'feature' | 'fix' | 'improvement' | 'security' | 'breaking';
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  title: string;
  changes: ChangeEntry[];
}

// ══════════════════════════════════════════════════════════════
// CHANGELOG — Atualizar aqui a cada deploy novo.
// A versão mais recente fica primeiro. Formato semver.
// ══════════════════════════════════════════════════════════════
const CHANGELOG: VersionEntry[] = [
  {
    version: '1.1.0',
    date: '2026-05-05',
    title: 'Segurança & Gestão de Pessoas',
    changes: [
      { type: 'feature', text: 'Notificações — centro de alertas com badge na sidebar' },
      { type: 'feature', text: 'Férias e Afastamentos — CRUD com 5 tipos (férias, atestado, licença, falta justificada, folga compensatória)' },
      { type: 'feature', text: 'Perfil Individual do Funcionário — estatísticas de presença e histórico de marcações' },
      { type: 'feature', text: 'Gestão de Usuários — CRUD com 3 níveis de permissão (Admin, Operador, Visualizador)' },
      { type: 'security', text: 'Autenticação migrada para bcrypt com hash no banco de dados' },
      { type: 'security', text: 'Rate Limiting — 5 tentativas / 15min de lockout por IP' },
      { type: 'security', text: 'Tokens HMAC-SHA256 com cookies HttpOnly e validade de 24h' },
      { type: 'improvement', text: 'Sidebar reorganizada em 4 seções colapsáveis (Gestão, Apuração, Relatórios, Sistema)' },
      { type: 'improvement', text: 'Schema de banco de dados com versionamento automático' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-04',
    title: 'Lançamento Inicial — Plataforma Completa',
    changes: [
      { type: 'feature', text: 'Dashboard com gráficos SVG (bar chart 7 dias + donut resumo mensal)' },
      { type: 'feature', text: 'Cadastro de Funcionários — CRUD completo' },
      { type: 'feature', text: 'Gerenciamento de Equipamentos (relógios de ponto)' },
      { type: 'feature', text: 'Jornadas de Trabalho — 6 escalas CLT' },
      { type: 'feature', text: 'Apuração de Ponto — cálculo CLT automático' },
      { type: 'feature', text: 'Banco de Horas — crédito/débito/saldo com cards' },
      { type: 'feature', text: 'Inconsistências — detecção automática de faltas, marcações ímpares e atrasos' },
      { type: 'feature', text: 'Espelho de Ponto — relatório mensal' },
      { type: 'feature', text: 'Cartão de Ponto — exportação em PDF (jsPDF + autotable)' },
      { type: 'feature', text: 'Extrato por Período — consulta flexível' },
      { type: 'feature', text: 'Calculadora de Horas — widget flutuante com 3 modos' },
      { type: 'feature', text: 'Import de arquivo AFD — Portaria 671 + ControlID ISO' },
      { type: 'feature', text: 'Sync Engine — integração com relógios ControlID via API' },
      { type: 'improvement', text: 'Interface dark theme profissional com gradientes' },
      { type: 'improvement', text: 'Login com fingerprint animation (identidade visual)' },
    ],
  },
];

const typeConfig = {
  feature:     { icon: Sparkles, label: 'Novidade',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  fix:         { icon: Bug,      label: 'Correção',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  improvement: { icon: Wrench,   label: 'Melhoria',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  security:    { icon: Shield,   label: 'Segurança', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  breaking:    { icon: Rocket,   label: 'Importante', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
};

export const APP_VERSION = CHANGELOG[0]?.version ?? '0.0.0';

export default function AtualizacoesPage() {
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    [CHANGELOG[0]?.version ?? '']: true,
  });

  const toggle = (version: string) =>
    setExpandedVersions(prev => ({ ...prev, [version]: !prev[version] }));

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Histórico de Atualizações</h2>
          <p>Versão atual: <strong>v{APP_VERSION}</strong> — Acompanhe todas as melhorias do sistema</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
          border: '1px solid rgba(139,92,246,0.3)',
          fontSize: '13px', fontWeight: 600, color: '#a78bfa',
        }}>
          <Package size={16} />
          v{APP_VERSION}
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: '800px' }}>
        {/* Timeline */}
        <div style={{ position: 'relative', paddingLeft: '32px' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: '11px', top: '8px', bottom: '8px',
            width: '2px', background: 'linear-gradient(to bottom, rgba(139,92,246,0.5), rgba(59,130,246,0.2))',
            borderRadius: '1px',
          }} />

          {CHANGELOG.map((entry, idx) => {
            const isExpanded = expandedVersions[entry.version] ?? false;
            const isLatest = idx === 0;

            return (
              <div key={entry.version} style={{ marginBottom: '24px', position: 'relative' }}>
                {/* Dot */}
                <div style={{
                  position: 'absolute', left: '-27px', top: '14px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: isLatest
                    ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
                    : 'rgba(100,116,139,0.3)',
                  border: isLatest ? '3px solid rgba(139,92,246,0.3)' : '2px solid rgba(100,116,139,0.2)',
                  boxShadow: isLatest ? '0 0 12px rgba(139,92,246,0.4)' : 'none',
                }} />

                {/* Card */}
                <div className="card" style={{
                  border: isLatest ? '1px solid rgba(139,92,246,0.3)' : undefined,
                  boxShadow: isLatest ? '0 0 20px rgba(139,92,246,0.1)' : undefined,
                }}>
                  {/* Header */}
                  <div
                    onClick={() => toggle(entry.version)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px', cursor: 'pointer', userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                        background: isLatest
                          ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))'
                          : 'rgba(100,116,139,0.1)',
                        color: isLatest ? '#a78bfa' : '#94a3b8',
                        border: `1px solid ${isLatest ? 'rgba(139,92,246,0.3)' : 'rgba(100,116,139,0.15)'}`,
                      }}>
                        v{entry.version}
                        {isLatest && (
                          <span style={{
                            fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
                            background: '#22c55e', color: 'white', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                          }}>atual</span>
                        )}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0' }}>{entry.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{entry.date}</div>
                      </div>
                    </div>
                    <div style={{ color: '#64748b' }}>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </div>

                  {/* Changes list */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 16px', borderTop: '1px solid rgba(100,116,139,0.1)' }}>
                      <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {entry.changes.map((change, ci) => {
                          const cfg = typeConfig[change.type];
                          const Icon = cfg.icon;
                          return (
                            <div key={ci} style={{
                              display: 'flex', alignItems: 'flex-start', gap: '10px',
                              padding: '8px 12px', borderRadius: '8px',
                              background: cfg.bg,
                              border: `1px solid ${cfg.color}22`,
                            }}>
                              <Icon size={14} style={{ color: cfg.color, marginTop: '2px', flexShrink: 0 }} />
                              <div>
                                <span style={{
                                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                  letterSpacing: '0.5px', color: cfg.color,
                                }}>{cfg.label}</span>
                                <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px', lineHeight: '1.4' }}>
                                  {change.text}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="card" style={{ marginTop: '8px', padding: '20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#a78bfa' }}>{CHANGELOG.length}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Versões</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#22c55e' }}>
                {CHANGELOG.reduce((sum, v) => sum + v.changes.filter(c => c.type === 'feature').length, 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Funcionalidades</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>
                {CHANGELOG.reduce((sum, v) => sum + v.changes.filter(c => c.type === 'security').length, 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Melhorias de Segurança</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
