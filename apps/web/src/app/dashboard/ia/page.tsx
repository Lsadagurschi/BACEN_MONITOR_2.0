'use client'
import { useEffect, useState } from 'react'

const LS_AI_KEY = 'bm_ai_config_v1'
const LS_SETTINGS_KEY = 'bm_company_settings_v1'
const LS_AUDIT_KEY = 'bm_audit_v1'

interface AiConfig {
  provider: string
  apiKey: string
  model: string
}

interface AuditEntry {
  id: string
  ts: string
  acao: string
  cadoc: string
  cnpj: string
  dtBase: string
  status: string
  nErros: number
  nAvisos: number
  totalCli: number
  totalOps: number
}

const ANALISES_MOCK = [
  {
    id: 'comp-1',
    tipo: 'Conformidade',
    titulo: 'Status de Conformidade Regulatória',
    icon: '✅',
    cor: '#15803d',
    conteudo: (seg: string, jobs: number, erros: number) =>
      `Com base nos dados da sua instituição (segmento ${seg.toUpperCase()}), foram identificados ${jobs} registros de geração de CADOC. ` +
      `${erros === 0
        ? 'Não há erros pendentes — a conformidade está satisfatória. Recomenda-se manter o acompanhamento mensal do calendário de entregas.'
        : `${erros} arquivo(s) com erros precisam de atenção imediata. Falhas no envio de CADOCs ao BCB podem gerar notificações e multas regulatórias.`
      }`,
  },
  {
    id: 'risk-1',
    tipo: 'Risco',
    titulo: 'Análise de Risco de Atraso',
    icon: '⚠️',
    cor: '#d97706',
    conteudo: (seg: string) => {
      const hoje = new Date()
      const dia = hoje.getDate()
      let alerta = ''
      if (dia >= 1 && dia <= 9) alerta = 'Período crítico: você está nos primeiros 9 dias úteis do mês. Verifique se o CADOC 4010 (Balancete COSIF) está sendo preparado para envio.'
      else if (dia >= 10 && dia <= 18) alerta = 'Atenção: prazo do CADOC 3040 (SCR) se aproxima — entrega até o 18º dia do mês.'
      else alerta = 'Período seguro para planejamento. Inicie a coleta de dados para o próximo ciclo de entrega.'
      return `${alerta} Segmento ${seg.toUpperCase()} possui obrigações ${['s1','s2'].includes(seg) ? 'completas (DLO diário + CADOCs mensais)' : 'mensais e por evento'}.`
    },
  },
  {
    id: 'optim-1',
    tipo: 'Otimização',
    titulo: 'Oportunidades de Melhoria Operacional',
    icon: '🚀',
    cor: '#0891b2',
    conteudo: (seg: string) =>
      `Para instituições do segmento ${seg.toUpperCase()}, recomenda-se: ` +
      `(1) automatizar a extração dos dados de crédito (CADOC 3040) diretamente do sistema core banking; ` +
      `(2) configurar alertas automáticos 5 dias antes dos prazos de entrega; ` +
      `(3) validar localmente os arquivos XML antes do envio ao STA para reduzir rejeições.`,
  },
  {
    id: 'reg-1',
    tipo: 'Regulatório',
    titulo: 'Impacto das Últimas Normas BCB',
    icon: '📋',
    cor: '#7c3aed',
    conteudo: () =>
      `Normas recentes com impacto no seu reporte: ` +
      `(1) Res. BCB 362/2025 — verifique adequação do capital mínimo para S4/S5 e IPs; ` +
      `(2) Res. BCB 348/2025 (Open Finance Fase 4) — novas APIs de investimentos podem exigir ajustes no CADOC 3040; ` +
      `(3) Circ. BCB 4.012/2024 (Pix) — atualize o processo de contestação de fraudes e reporte no CADOC 2055.`,
  },
]

const PROVIDERS = [
  { id: 'openai',    label: 'OpenAI (GPT-4o / GPT-4)',  placeholder: 'sk-...',   models: ['gpt-4o','gpt-4-turbo','gpt-3.5-turbo'] },
  { id: 'anthropic', label: 'Anthropic (Claude)',        placeholder: 'sk-ant-...', models: ['claude-opus-4-6','claude-sonnet-4-6','claude-haiku-4-5'] },
  { id: 'google',    label: 'Google Gemini',             placeholder: 'AIza...',  models: ['gemini-2.0-flash','gemini-1.5-pro'] },
]

export default function IAPage() {
  const [config, setConfig] = useState<AiConfig>({ provider: 'openai', apiKey: '', model: 'gpt-4o' })
  const [settings, setSettings] = useState<{ segmento: string; nomeEmpresa: string } | null>(null)
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [analiseAtiva, setAnaliseAtiva] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<string>('')
  const [savedKey, setSavedKey] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_AI_KEY)
      if (raw) setConfig(JSON.parse(raw))
    } catch {}
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY)
      if (raw) setSettings(JSON.parse(raw))
    } catch {}
    try {
      const raw = localStorage.getItem(LS_AUDIT_KEY)
      if (raw) setAudit(JSON.parse(raw) || [])
    } catch {}
  }, [])

  function saveConfig() {
    localStorage.setItem(LS_AI_KEY, JSON.stringify(config))
    setSavedKey(true)
    setTimeout(() => setSavedKey(false), 3000)
  }

  async function runAnalise(id: string) {
    if (!config.apiKey) {
      alert('Configure sua chave de API primeiro.')
      return
    }
    setAnaliseAtiva(id)
    setLoading(true)
    setResultado('')

    const seg = settings?.segmento || 's3'
    const jobs = audit.length
    const erros = audit.filter(a => a.status === 'REPROVADO').length
    const analise = ANALISES_MOCK.find(a => a.id === id)!

    // Simulate API call with mock response (real implementation would call the provider)
    await new Promise(r => setTimeout(r, 1500))
    const texto = analise.conteudo(seg, jobs, erros)
    setResultado(texto)
    setLoading(false)
  }

  const provider = PROVIDERS.find(p => p.id === config.provider) || PROVIDERS[0]
  const erros = audit.filter(a => a.status === 'REPROVADO').length

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid #d1c9b8',
    fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#0a0f1e', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0f1e', marginBottom: 4 }}>
          Análise com Inteligência Artificial
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Use IA para análises de conformidade, risco regulatório e recomendações de otimização para suas obrigações CADOC.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Configuração da API */}
        <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0a0f1e', marginBottom: 4 }}>
            Configurar API de IA
          </h2>
          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 18, lineHeight: 1.6 }}>
            Insira sua chave de API. Ela é armazenada apenas localmente no seu navegador e nunca enviada a servidores externos.
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>
              Provedor de IA
            </label>
            <select style={inp} value={config.provider}
              onChange={e => setConfig(c => ({ ...c, provider: e.target.value, model: PROVIDERS.find(p=>p.id===e.target.value)?.models[0] || '' }))}>
              {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>
              Chave de API
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showKey ? 'text' : 'password'}
                style={{ ...inp, fontFamily: 'Courier New, monospace', fontSize: 12 }}
                placeholder={provider.placeholder}
                value={config.apiKey}
                onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #d1c9b8', background: '#f9fafb', cursor: 'pointer', fontSize: 13 }}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>
              Modelo
            </label>
            <select style={inp} value={config.model}
              onChange={e => setConfig(c => ({ ...c, model: e.target.value }))}>
              {provider.models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={saveConfig} style={{
              padding: '8px 20px', borderRadius: 8, background: '#0a7c5c', color: '#fff',
              border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}>
              Salvar Configuração
            </button>
            {savedKey && (
              <span style={{ fontSize: 11.5, color: '#0a7c5c', fontWeight: 600 }}>
                ✓ Configuração salva!
              </span>
            )}
          </div>

          {!config.apiKey && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 11, color: '#92400e' }}>
              Configure uma chave de API para habilitar as análises de IA abaixo.
            </div>
          )}

          {config.apiKey && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 11, color: '#15803d' }}>
              ✓ API configurada — <strong>{provider.label}</strong> · {config.model}
            </div>
          )}
        </div>

        {/* Status da instituição */}
        <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0a0f1e', marginBottom: 14 }}>
            Contexto da Instituição
          </h2>
          {settings ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Instituição',  value: settings.nomeEmpresa || '—' },
                { label: 'Segmento',    value: settings.segmento?.toUpperCase() || '—' },
                { label: 'Jobs Gerados', value: String(audit.length) },
                { label: 'Com erros',   value: String(erros), destaque: erros > 0 },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: 7 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: item.destaque ? '#dc2626' : '#0a0f1e', fontFamily: 'Courier New, monospace' }}>
                    {item.value}
                  </span>
                </div>
              ))}
              <div style={{ padding: '10px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 11, color: '#1d4ed8', lineHeight: 1.5 }}>
                As análises de IA utilizam estes dados para gerar recomendações personalizadas para seu segmento regulatório.
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏦</div>
              <div style={{ fontSize: 12 }}>Configure sua instituição primeiro.</div>
              <a href="/dashboard/settings" style={{ fontSize: 11, color: '#0a7c5c', textDecoration: 'none', fontWeight: 600 }}>
                → Ir para Configurações
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Análises disponíveis */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0a0f1e', marginBottom: 16 }}>
          Análises Disponíveis
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {ANALISES_MOCK.map(a => (
            <div key={a.id} style={{
              background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, padding: 20,
              borderTop: `3px solid ${a.cor}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: a.cor, fontFamily: 'Courier New', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>
                    {a.tipo}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0f1e' }}>
                    {a.titulo}
                  </div>
                </div>
              </div>

              {analiseAtiva === a.id && (
                <div style={{ marginBottom: 12, padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280', fontSize: 12 }}>
                      <span>⏳</span> Analisando dados com IA...
                    </div>
                  ) : (
                    <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                      {resultado}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => runAnalise(a.id)}
                disabled={!config.apiKey || (analiseAtiva === a.id && loading)}
                style={{
                  width: '100%', padding: '8px 0', borderRadius: 7,
                  background: config.apiKey ? a.cor : '#e5e7eb',
                  color: config.apiKey ? '#fff' : '#9ca3af',
                  border: 'none', fontSize: 12, fontWeight: 700, cursor: config.apiKey ? 'pointer' : 'not-allowed',
                  transition: 'opacity .15s',
                }}
              >
                {analiseAtiva === a.id && loading ? 'Analisando...' : '🤖 Executar Análise'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Nota sobre privacidade */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 11, color: '#6b7280' }}>
        <strong style={{ color: '#374151' }}>Privacidade:</strong> Sua chave de API é armazenada apenas no localStorage do seu navegador. As análises enviadas à API de IA não contêm dados sensíveis de clientes — apenas métricas agregadas e o segmento da sua instituição.
      </div>
    </div>
  )
}
