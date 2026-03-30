'use client'
import { useState, useEffect } from 'react'

type CRow = { cod: string; nome: string; per: string; obrig: 'SIM' | 'COND'; obs?: string }
type CMatrix = { desc: string; obrig: CRow[]; cond: CRow[] }

export const MATRIZ: Record<string, CMatrix> = {
  s1: {
    desc: 'Banco sistemicamente importante (PR >= R$245bi ou G-SIB). Basileia III completo com TLAC, LCR e NSFR individuais.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',          per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',           per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',         per:'Diaria',     obrig:'SIM' },
      { cod:'2020', nome:'Capital — PR e Indices Basileia III',     per:'Mensal',     obrig:'SIM' },
      { cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',      per:'Mensal',     obrig:'SIM' },
      { cod:'2025', nome:'LCR — Liquidity Coverage Ratio',          per:'Mensal',     obrig:'SIM' },
      { cod:'2030', nome:'NSFR — Net Stable Funding Ratio',         per:'Mensal',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Credito', per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Credito',                per:'Por evento', obrig:'SIM' },
      { cod:'2055', nome:'Pix — Informacoes Operacionais',          per:'Mensal',     obrig:'SIM' },
    ],
    cond: [
      { cod:'6334', nome:'Cartoes Credenciadores (ASPB034)', per:'Trimestral', obrig:'COND', obs:'Apenas se atuar como credenciador' },
      { cod:'6308', nome:'Cartoes Emissores',                per:'Trimestral', obrig:'COND', obs:'Apenas se emitir cartoes em arranjo' },
    ],
  },
  s2: {
    desc: 'Banco medio com atividade internacional (PR R$100-244bi). Basileia III completo (sem TLAC), LCR e NSFR.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',          per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',           per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',         per:'Diaria',     obrig:'SIM' },
      { cod:'2020', nome:'Capital — PR e Indices Basileia III',     per:'Mensal',     obrig:'SIM' },
      { cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',      per:'Mensal',     obrig:'SIM' },
      { cod:'2025', nome:'LCR — Liquidity Coverage Ratio',          per:'Mensal',     obrig:'SIM' },
      { cod:'2030', nome:'NSFR — Net Stable Funding Ratio',         per:'Mensal',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Credito', per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Credito',                per:'Por evento', obrig:'SIM' },
      { cod:'2055', nome:'Pix — Informacoes Operacionais',          per:'Mensal',     obrig:'SIM' },
    ],
    cond: [{ cod:'6334', nome:'Cartoes Credenciadores', per:'Trimestral', obrig:'COND', obs:'Apenas se credenciador' }],
  },
  s3: {
    desc: 'IF de medio porte (PR R$2,3-99,9bi). Basileia III simplificado com ILC em vez de LCR, sem NSFR individual.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',           per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',            per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',          per:'Diaria',     obrig:'SIM' },
      { cod:'2020', nome:'Capital — PR e Indices (Basileia simpl.)', per:'Mensal',     obrig:'SIM' },
      { cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',       per:'Mensal',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Credito',  per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Credito',                 per:'Por evento', obrig:'SIM' },
    ],
    cond: [
      { cod:'2055', nome:'Pix — Informacoes Operacionais', per:'Mensal',     obrig:'COND', obs:'Se participante direto com ISPB' },
      { cod:'6334', nome:'Cartoes Credenciadores',         per:'Trimestral', obrig:'COND', obs:'Se atuar como credenciador' },
    ],
  },
  s4: {
    desc: 'IF de menor porte (PR R$500M-2,29bi). ICP simplificado no lugar do RWA. SCR e Pix condicionais.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',            per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',             per:'Semestral', obrig:'SIM' },
      { cod:'2020', nome:'Capital — Indice de Capital Proprio (ICP)', per:'Mensal',   obrig:'SIM' },
    ],
    cond: [
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',         per:'Diaria',     obrig:'COND', obs:'Apenas se mantiver conta reservas BCB' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Credito', per:'Mensal',     obrig:'COND', obs:'Apenas se possuir carteira de credito' },
      { cod:'3044', nome:'SCR — Eventos de Credito',                per:'Por evento', obrig:'COND', obs:'Condicional ao SCR 3040' },
      { cod:'2055', nome:'Pix — Informacoes Operacionais',          per:'Mensal',     obrig:'COND', obs:'Apenas se participante direto com ISPB' },
    ],
  },
  s5: {
    desc: 'Microinstituicao (PR < R$500M). Menor carga regulatoria do SFN. Sem LCR, NSFR nem DLO.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal (D+15)', obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',  per:'Semestral',    obrig:'SIM' },
      { cod:'2020', nome:'Capital — ICP Simplificado',     per:'Trimestral',   obrig:'SIM' },
    ],
    cond: [{ cod:'3040', nome:'SCR — Dados de Credito', per:'Mensal', obrig:'COND', obs:'Apenas se possuir exposicoes >= R$200' }],
  },
  adquirente: {
    desc: 'Credenciador/Adquirente: habilita ECs e participa da liquidacao. Capital minimo R$2M (Res. BCB 407/2024).',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
      { cod:'6334', nome:'Cartoes Credenciadores — ASPB034',    per:'Trimestral',obrig:'SIM' },
    ],
    cond: [
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO', per:'Diaria',     obrig:'COND', obs:'Se mantiver conta de liquidacao relevante no BCB' },
      { cod:'2055', nome:'Pix — Informacoes Operacionais',  per:'Mensal',     obrig:'COND', obs:'Apenas se participante direto do Pix com ISPB' },
      { cod:'2050', nome:'Arranjos de Pagamento',           per:'Trimestral', obrig:'COND', obs:'Apenas se tambem for instituidor do arranjo' },
      { cod:'3040', nome:'SCR — Dados de Credito',          per:'Mensal',     obrig:'COND', obs:'Apenas se oferecer credito (antecipacao, BNPL)' },
    ],
  },
  subadquirente: {
    desc: 'Habilita ECs sem participar diretamente da liquidacao. Res. BCB 522/2025: liquidacao centralizada obrigatoria a partir de 09/05/2026.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
    ],
    cond: [
      { cod:'2055', nome:'Pix — Informacoes Operacionais', per:'Mensal', obrig:'COND', obs:'Se participante direto com ISPB proprio' },
      { cod:'3040', nome:'SCR — Dados de Credito',         per:'Mensal', obrig:'COND', obs:'Se oferecer credito proprio' },
    ],
  },
  emissor_pre: {
    desc: 'Emissor de instrumento pre-pago: conta digital, cartao pre-pago, carteira eletronica.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',     per:'Diaria',    obrig:'SIM' },
      { cod:'2055', nome:'Pix — Informacoes Operacionais',      per:'Mensal',    obrig:'SIM', obs:'Se participante direto do SPI' },
    ],
    cond: [{ cod:'3040', nome:'SCR — Dados de Credito', per:'Mensal', obrig:'COND', obs:'Apenas se oferecer credito (SCD cumulativa)' }],
  },
  emissor_pos: {
    desc: 'Emissor pos-pago: cartao de credito, conta pos-paga. Obrigatoriamente sujeito ao SCR.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)',     per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',           per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',         per:'Diaria',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Credito', per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Credito',                per:'Por evento', obrig:'SIM' },
      { cod:'6308', nome:'Cartoes de Pagamento — Emissores',        per:'Trimestral', obrig:'SIM' },
    ],
    cond: [{ cod:'2055', nome:'Pix — Informacoes Operacionais', per:'Mensal', obrig:'COND', obs:'Se participante direto do Pix' }],
  },
  itp: {
    desc: 'Iniciador de Transacao de Pagamento via Open Finance. Nao detem fundos. Menor carga entre as IPs.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
    ],
    cond: [{ cod:'2055', nome:'Pix — Informacoes Operacionais', per:'Mensal', obrig:'COND', obs:'Apenas se possuir ISPB proprio' }],
  },
  scd: {
    desc: 'Sociedade de Credito Direto: fintech de credito com recursos proprios. IF autorizada pelo BCB. Sem Basileia III.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',  per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',per:'Diaria',    obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados de Credito',         per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Credito',       per:'Por evento', obrig:'SIM' },
    ],
    cond: [{ cod:'2055', nome:'Pix — Informacoes Operacionais', per:'Mensal', obrig:'COND', obs:'Apenas se for tambem EME com ISPB' }],
  },
  psav: {
    desc: 'PSAV: exchange, custodiante ou intermediaria de ativos virtuais. Marco regulatorio desde 02/02/2026.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',  per:'Semestral', obrig:'SIM' },
      { cod:'C212', nome:'Servicos de Ativos Virtuais',   per:'Mensal',    obrig:'SIM', obs:'A partir de mai/2026 — IN BCB 693/2025' },
    ],
    cond: [],
  },
}

const TIPOS = [
  { id:'s1',           l:'S1 — Banco Sistemico',          g:'Segmentos Prudenciais' },
  { id:'s2',           l:'S2 — Banco Medio Internacional', g:'Segmentos Prudenciais' },
  { id:'s3',           l:'S3 — IF Medio Porte',            g:'Segmentos Prudenciais' },
  { id:'s4',           l:'S4 — IF Menor Porte',            g:'Segmentos Prudenciais' },
  { id:'s5',           l:'S5 — Microinstituicao',          g:'Segmentos Prudenciais' },
  { id:'adquirente',   l:'Adquirente / Credenciador',      g:'Instituicoes de Pagamento' },
  { id:'subadquirente',l:'Subadquirente',                  g:'Instituicoes de Pagamento' },
  { id:'emissor_pre',  l:'Emissor Pre-pago',               g:'Instituicoes de Pagamento' },
  { id:'emissor_pos',  l:'Emissor Pos-pago',               g:'Instituicoes de Pagamento' },
  { id:'itp',          l:'ITP — Iniciador',                g:'Instituicoes de Pagamento' },
  { id:'scd',          l:'SCD — Credito Direto',           g:'Credito' },
  { id:'psav',         l:'PSAV — Ativos Virtuais',         g:'Outros' },
]

const SEGS = [
  { id:'S1', l:'S1 — Porte Sistemico (PR >= R$245bi)' },
  { id:'S2', l:'S2 — Porte Grande (PR R$100-244bi)' },
  { id:'S3', l:'S3 — Porte Medio (PR R$2,3-99,9bi)' },
  { id:'S4', l:'S4 — Porte Menor (PR R$500M-2,29bi)' },
  { id:'S5', l:'S5 — Microinstituicao (PR < R$500M)' },
  { id:'N',  l:'Nao sujeito a segmento prudencial' },
]

// SectionBox fora do componente para nao recriar a cada render (evita perda de foco)
function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:16 }}>
      <div style={{ padding:'13px 20px', borderBottom:'1px solid #f3f4f6', background:'#fafafa' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{title}</div>
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  )
}

const iSt: React.CSSProperties = {
  width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:8,
  fontSize:13, outline:'none', fontFamily:'inherit', color:'#111827', background:'#fff',
}
const lSt: React.CSSProperties = {
  display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5,
}

export default function SettingsPage() {
  const [key,    setKey]   = useState('')
  const [nome,   setNome]  = useState('')
  const [cnpj,   setCnpj]  = useState('')
  const [ispb,   setIspb]  = useState('')
  const [tipo,   setTipo]  = useState('')
  const [seg,    setSeg]   = useState('')
  const [showK,  setShowK] = useState(false)
  const [saved,  setSaved] = useState(false)
  const [testing,setTest]  = useState(false)
  const [testRes,setTRes]  = useState<{ok:boolean;msg:string}|null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setKey(localStorage.getItem('bm_api_key')  || '')
    setNome(localStorage.getItem('bm_nome')     || '')
    setCnpj(localStorage.getItem('bm_cnpj')     || '')
    setIspb(localStorage.getItem('bm_ispb')     || '')
    setTipo(localStorage.getItem('bm_tipo')     || '')
    setSeg(localStorage.getItem('bm_segmento') || '')
  }, [])

  const save = () => {
    localStorage.setItem('bm_api_key',  key.trim())
    localStorage.setItem('bm_nome',     nome.trim())
    localStorage.setItem('bm_cnpj',     cnpj.replace(/\D/g,'').slice(0,8))
    localStorage.setItem('bm_ispb',     ispb.replace(/\D/g,'').slice(0,8))
    localStorage.setItem('bm_tipo',     tipo)
    localStorage.setItem('bm_segmento', seg)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const testar = async () => {
    if (!key.trim()) { setTRes({ok:false,msg:'Insira a API key antes de testar'}); return }
    setTest(true); setTRes(null)
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key':key.trim(), 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
        body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:10, messages:[{role:'user',content:'OK'}] }),
      })
      if (r.ok) setTRes({ok:true, msg:'Conexao com Anthropic estabelecida'})
      else { const e=await r.json().catch(()=>({})); setTRes({ok:false, msg:'Erro '+r.status+': '+(e.error?.message||'Chave invalida')}) }
    } catch(e:any) { setTRes({ok:false, msg:'Erro de rede: '+e.message}) }
    setTest(false)
  }

  const matrizIF  = tipo ? MATRIZ[tipo] : null
  const tipoLabel = TIPOS.find(t => t.id === tipo)?.l || ''
  const grupos    = [...new Set(TIPOS.map(t => t.g))]

  return (
    <div style={{ padding:'24px 28px', minHeight:'100%', background:'#f1f3f7', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ maxWidth:800 }}>
        <div style={{ marginBottom:22 }}>
          <h1 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 4px', letterSpacing:'-.4px' }}>Configuracoes</h1>
          <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>Configure sua instituicao. O Dashboard e os templates de CADOC serao atualizados automaticamente.</p>
        </div>

        <SectionBox title="API Key — Analise de Normas por IA">
          <p style={{ fontSize:12, color:'#6b7280', lineHeight:1.65, marginBottom:16 }}>
            Habilita a Analise de Normas e o Assistente Regulatorio na aba Normas BCB.
            Nao e necessaria para geracao de CADOCs, calendario nem matriz de IFs.{' '}
            Obtenha em <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{color:'#1d4ed8'}}>console.anthropic.com</a>.
          </p>
          <label style={lSt}>API Key Anthropic</label>
          <div style={{ position:'relative', marginBottom:10 }}>
            <input
              type={showK?'text':'password'}
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              autoComplete="off"
              style={{...iSt, paddingRight:84, fontFamily:'monospace', marginBottom:0}}
            />
            <button onClick={() => setShowK(!showK)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#9ca3af', fontFamily:'monospace', outline:'none' }}>
              {showK?'ocultar':'mostrar'}
            </button>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
            <button onClick={testar} disabled={testing} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', cursor:'pointer', fontSize:12, fontWeight:600, color:'#374151', outline:'none' }}>
              {testing ? 'Testando...' : 'Testar conexao'}
            </button>
            {testRes && <span style={{ fontSize:11, color:testRes.ok?'#16a34a':'#dc2626', fontFamily:'monospace' }}>{testRes.ok?'checkmark':'x'} {testRes.msg}</span>}
          </div>
        </SectionBox>

        <SectionBox title="Dados da Instituicao Financeira">
          <label style={lSt}>Razao Social</label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="BANCO EXEMPLO S.A."
            style={{...iSt, marginBottom:4}}
          />
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:16 }}>Exibida na barra lateral e pre-preenchida nos templates de CADOC</div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={lSt}>CNPJ raiz (8 digitos)</label>
              <input
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                onBlur={e => setCnpj(e.target.value.replace(/\D/g,'').slice(0,8))}
                placeholder="12345678"
                maxLength={14}
                style={{...iSt, fontFamily:'monospace', marginBottom:4}}
              />
              <div style={{ fontSize:11, color:'#9ca3af' }}>Primeiros 8 digitos do CNPJ</div>
            </div>
            <div>
              <label style={lSt}>ISPB</label>
              <input
                value={ispb}
                onChange={e => setIspb(e.target.value)}
                onBlur={e => setIspb(e.target.value.replace(/\D/g,'').slice(0,8))}
                placeholder="12345678"
                maxLength={8}
                style={{...iSt, fontFamily:'monospace', marginBottom:4}}
              />
              <div style={{ fontSize:11, color:'#9ca3af' }}>Codigo ISPB para Pix e STA</div>
            </div>
          </div>

          <div style={{ marginTop:16 }}>
            <label style={lSt}>Tipo de Instituicao</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} style={{...iSt, cursor:'pointer', marginBottom:4}}>
              <option value="">Selecione o tipo de instituicao...</option>
              {grupos.map(g => (
                <optgroup key={g} label={g}>
                  {TIPOS.filter(t => t.g === g).map(t => <option key={t.id} value={t.id}>{t.l}</option>)}
                </optgroup>
              ))}
            </select>
            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:16 }}>Determina os CADOCs obrigatorios no Dashboard e nesta pagina</div>

            <label style={lSt}>Segmento Prudencial (Res. BCB 197/2022)</label>
            <select value={seg} onChange={e => setSeg(e.target.value)} style={{...iSt, cursor:'pointer', marginBottom:4}}>
              <option value="">Selecione o segmento prudencial...</option>
              {SEGS.map(s => <option key={s.id} value={s.id}>{s.l}</option>)}
            </select>
            <div style={{ fontSize:11, color:'#9ca3af' }}>Influencia exigencias adicionais de capital e liquidez</div>
          </div>
        </SectionBox>

        {matrizIF && tipo && (
          <SectionBox title={'CADOCs Obrigatorios — ' + tipoLabel}>
            <div style={{ padding:'10px 14px', background:'#f9fafb', borderRadius:8, border:'1px solid #f3f4f6', marginBottom:16, fontSize:12, color:'#6b7280', lineHeight:1.65 }}>
              {matrizIF.desc}
            </div>
            <div style={{ display:'flex', gap:12, marginBottom:16 }}>
              <div style={{ padding:'8px 16px', borderRadius:8, background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:20, fontWeight:900, color:'#16a34a', fontFamily:'monospace', lineHeight:1 }}>{matrizIF.obrig.length}</span>
                <span style={{ fontSize:10, color:'#16a34a', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px' }}>Obrigatorios</span>
              </div>
              {matrizIF.cond.length > 0 && (
                <div style={{ padding:'8px 16px', borderRadius:8, background:'#fffbeb', border:'1px solid #fde68a', display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:20, fontWeight:900, color:'#d97706', fontFamily:'monospace', lineHeight:1 }}>{matrizIF.cond.length}</span>
                  <span style={{ fontSize:10, color:'#d97706', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px' }}>Condicionais</span>
                </div>
              )}
            </div>

            <div style={{ fontSize:10, fontWeight:700, color:'#16a34a', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#16a34a' }}/> Obrigatorios — SIM
            </div>
            <div style={{ borderRadius:10, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:16 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    {['CADOC','Documento','Periodicidade','Obs.'].map(h => (
                      <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:9.5, fontWeight:700, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrizIF.obrig.map((r, i) => (
                    <tr key={r.cod} style={{ borderTop:i>0?'1px solid #f9fafb':'none' }}>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:800, fontSize:12.5, color:'#0891b2' }}>{r.cod}</td>
                      <td style={{ padding:'10px 14px', fontSize:12.5, fontWeight:600, color:'#111827' }}>{r.nome}</td>
                      <td style={{ padding:'10px 14px', fontSize:11, fontFamily:'monospace', color:'#6b7280', whiteSpace:'nowrap' }}>{r.per}</td>
                      <td style={{ padding:'10px 14px', fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>{r.obs||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {matrizIF.cond.length > 0 && (
              <>
                <div style={{ fontSize:10, fontWeight:700, color:'#d97706', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'#d97706' }}/> Condicionais
                </div>
                <div style={{ borderRadius:10, border:'1px solid #fde68a', overflow:'hidden', marginBottom:12 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                    <thead>
                      <tr style={{ background:'#fffbeb' }}>
                        {['CADOC','Documento','Periodicidade','Condicao'].map(h => (
                          <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:9.5, fontWeight:700, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'1px solid #fde68a' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrizIF.cond.map((r, i) => (
                        <tr key={r.cod} style={{ borderTop:i>0?'1px solid #fffbeb':'none' }}>
                          <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:800, fontSize:12.5, color:'#d97706' }}>{r.cod}</td>
                          <td style={{ padding:'10px 14px', fontSize:12.5, fontWeight:500, color:'#374151' }}>{r.nome}</td>
                          <td style={{ padding:'10px 14px', fontSize:11, fontFamily:'monospace', color:'#6b7280', whiteSpace:'nowrap' }}>{r.per}</td>
                          <td style={{ padding:'10px 14px', fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>{r.obs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SectionBox>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={save} style={{ padding:'11px 28px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#0d6e52,#1248a0)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', outline:'none', boxShadow:'0 4px 14px rgba(13,110,82,.3)' }}>
            {saved ? 'Salvo!' : 'Salvar Configuracoes'}
          </button>
          {saved && <span style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>Configuracoes salvas — Dashboard atualizado.</span>}
        </div>
      </div>
    </div>
  )
}
