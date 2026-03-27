'use client'
import { useState, useEffect } from 'react'

// ── CADOC matrix baseada no PDF Cadocs_por_Instituição BCB ────────────────────
type CRow = { cod:string; nome:string; per:string; obrig:'SIM'|'COND'; obs?:string }
type CMatrix = { desc:string; obrig:CRow[]; cond:CRow[] }

const MATRIZ: Record<string, CMatrix> = {
  s1: {
    desc: 'Banco sistemicamente importante (PR ≥ R$245bi ou G-SIB). Basileia III completo com TLAC, LCR e NSFR individuais.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF',          per:'Mensal',     obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',           per:'Semestral',  obrig:'SIM'},
      {cod:'4111', nome:'Posição Financeira Diária — DLO',         per:'Diária',     obrig:'SIM'},
      {cod:'2020', nome:'Capital — PR e Índices Basileia III',     per:'Mensal',     obrig:'SIM'},
      {cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',      per:'Mensal',     obrig:'SIM'},
      {cod:'2025', nome:'LCR — Liquidity Coverage Ratio',          per:'Mensal',     obrig:'SIM'},
      {cod:'2030', nome:'NSFR — Net Stable Funding Ratio',         per:'Mensal',     obrig:'SIM'},
      {cod:'3040', nome:'SCR — Dados Individualizados de Crédito', per:'Mensal',     obrig:'SIM'},
      {cod:'3044', nome:'SCR — Eventos de Crédito',                per:'Por evento', obrig:'SIM'},
      {cod:'2055', nome:'Pix — Informações Operacionais',          per:'Mensal',     obrig:'SIM'},
    ],
    cond: [
      {cod:'6334', nome:'Cartões Credenciadores (ASPB034)', per:'Trimestral', obrig:'COND', obs:'Apenas se atuar como credenciador'},
      {cod:'6308', nome:'Cartões Emissores',                per:'Trimestral', obrig:'COND', obs:'Apenas se emitir cartões em arranjo'},
    ],
  },
  s2: {
    desc: 'Banco médio com atividade internacional (PR R$100–244bi). Basileia III completo (sem TLAC), LCR e NSFR.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF',          per:'Mensal',     obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',           per:'Semestral',  obrig:'SIM'},
      {cod:'4111', nome:'Posição Financeira Diária — DLO',         per:'Diária',     obrig:'SIM'},
      {cod:'2020', nome:'Capital — PR e Índices Basileia III',     per:'Mensal',     obrig:'SIM'},
      {cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',      per:'Mensal',     obrig:'SIM'},
      {cod:'2025', nome:'LCR — Liquidity Coverage Ratio',          per:'Mensal',     obrig:'SIM'},
      {cod:'2030', nome:'NSFR — Net Stable Funding Ratio',         per:'Mensal',     obrig:'SIM'},
      {cod:'3040', nome:'SCR — Dados Individualizados de Crédito', per:'Mensal',     obrig:'SIM'},
      {cod:'3044', nome:'SCR — Eventos de Crédito',                per:'Por evento', obrig:'SIM'},
      {cod:'2055', nome:'Pix — Informações Operacionais',          per:'Mensal',     obrig:'SIM'},
    ],
    cond: [
      {cod:'6334', nome:'Cartões Credenciadores', per:'Trimestral', obrig:'COND', obs:'Apenas se credenciador'},
    ],
  },
  s3: {
    desc: 'IF de médio porte (PR R$2,3–99,9bi). Basileia III simplificado com ILC em vez de LCR, sem NSFR individual.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF',          per:'Mensal',     obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',           per:'Semestral',  obrig:'SIM'},
      {cod:'4111', nome:'Posição Financeira Diária — DLO',         per:'Diária',     obrig:'SIM'},
      {cod:'2020', nome:'Capital — PR e Índices (Basileia simpl.)',per:'Mensal',     obrig:'SIM'},
      {cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',      per:'Mensal',     obrig:'SIM'},
      {cod:'3040', nome:'SCR — Dados Individualizados de Crédito', per:'Mensal',     obrig:'SIM'},
      {cod:'3044', nome:'SCR — Eventos de Crédito',                per:'Por evento', obrig:'SIM'},
    ],
    cond: [
      {cod:'2055', nome:'Pix — Informações Operacionais', per:'Mensal',     obrig:'COND', obs:'Se participante direto com ISPB'},
      {cod:'6334', nome:'Cartões Credenciadores',         per:'Trimestral', obrig:'COND', obs:'Se atuar como credenciador'},
    ],
  },
  s4: {
    desc: 'IF de menor porte (PR R$500M–2,29bi). ICP simplificado no lugar do RWA. SCR e Pix condicionais.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal',    obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',  per:'Semestral', obrig:'SIM'},
      {cod:'2020', nome:'Capital — Índice de Capital Próprio (ICP)', per:'Mensal', obrig:'SIM'},
    ],
    cond: [
      {cod:'4111', nome:'Posição Financeira Diária — DLO',         per:'Diária',     obrig:'COND', obs:'Apenas se mantiver conta reservas BCB'},
      {cod:'3040', nome:'SCR — Dados Individualizados de Crédito', per:'Mensal',     obrig:'COND', obs:'Apenas se possuir carteira de crédito'},
      {cod:'3044', nome:'SCR — Eventos de Crédito',                per:'Por evento', obrig:'COND', obs:'Condicional ao SCR 3040'},
      {cod:'2055', nome:'Pix — Informações Operacionais',          per:'Mensal',     obrig:'COND', obs:'Apenas se participante direto com ISPB'},
    ],
  },
  s5: {
    desc: 'Microinstituição (PR < R$500M). Menor carga regulatória do SFN. Sem LCR, NSFR nem DLO.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal (D+15)', obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',  per:'Semestral',    obrig:'SIM'},
      {cod:'2020', nome:'Capital — ICP Simplificado',     per:'Trimestral',   obrig:'SIM'},
    ],
    cond: [
      {cod:'3040', nome:'SCR — Dados de Crédito', per:'Mensal', obrig:'COND', obs:'Apenas se possuir exposições de crédito ≥ R$200'},
    ],
  },
  adquirente: {
    desc: 'Credenciador/Adquirente: habilita ECs e participa da liquidação. Capital mínimo R$2M (Res. BCB 407/2024).',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)',    per:'Mensal',    obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',          per:'Semestral', obrig:'SIM'},
      {cod:'6334', nome:'Cartões Credenciadores — ASPB034 (10 TXTs)', per:'Trimestral', obrig:'SIM'},
    ],
    cond: [
      {cod:'4111', nome:'Posição Financeira Diária — DLO', per:'Diária',     obrig:'COND', obs:'Se mantiver conta de liquidação relevante no BCB'},
      {cod:'2055', nome:'Pix — Informações Operacionais',  per:'Mensal',     obrig:'COND', obs:'Apenas se participante direto do Pix com ISPB'},
      {cod:'2050', nome:'Arranjos de Pagamento',           per:'Trimestral', obrig:'COND', obs:'Apenas se também for instituidor do arranjo'},
      {cod:'3040', nome:'SCR — Dados de Crédito',          per:'Mensal',     obrig:'COND', obs:'Apenas se oferecer crédito (antecipação, BNPL)'},
    ],
  },
  subadquirente: {
    desc: 'Habilita ECs sem participar diretamente da liquidação. Atenção: Res. BCB 522/2025 obriga liquidação centralizada a partir de 09/05/2026.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',       per:'Semestral', obrig:'SIM'},
    ],
    cond: [
      {cod:'2055', nome:'Pix — Informações Operacionais', per:'Mensal',     obrig:'COND', obs:'Se participante direto com ISPB próprio'},
      {cod:'3040', nome:'SCR — Dados de Crédito',         per:'Mensal',     obrig:'COND', obs:'Se oferecer crédito próprio'},
    ],
  },
  emissor_pre: {
    desc: 'Emissor de instrumento de pagamento pré-pago: conta digital, cartão pré-pago, carteira eletrônica.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',       per:'Semestral', obrig:'SIM'},
      {cod:'4111', nome:'Posição Financeira Diária — DLO',     per:'Diária',    obrig:'SIM'},
      {cod:'2055', nome:'Pix — Informações Operacionais',      per:'Mensal',    obrig:'SIM', obs:'Se participante direto do SPI'},
    ],
    cond: [
      {cod:'3040', nome:'SCR — Dados de Crédito', per:'Mensal', obrig:'COND', obs:'Apenas se oferecer crédito (SCD cumulativa)'},
    ],
  },
  emissor_pos: {
    desc: 'Emissor de instrumento pós-pago: cartão de crédito, conta pós-paga. Obrigatoriamente sujeito ao SCR.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',       per:'Semestral', obrig:'SIM'},
      {cod:'4111', nome:'Posição Financeira Diária — DLO',     per:'Diária',    obrig:'SIM'},
      {cod:'3040', nome:'SCR — Dados Individualizados de Crédito', per:'Mensal', obrig:'SIM'},
      {cod:'3044', nome:'SCR — Eventos de Crédito',            per:'Por evento', obrig:'SIM'},
      {cod:'6308', nome:'Cartões de Pagamento — Emissores',    per:'Trimestral', obrig:'SIM'},
    ],
    cond: [
      {cod:'2055', nome:'Pix — Informações Operacionais', per:'Mensal', obrig:'COND', obs:'Se participante direto do Pix'},
    ],
  },
  itp: {
    desc: 'Iniciador de Transação de Pagamento via Open Finance. Não detém fundos. Menor carga regulatória entre as IPs.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',       per:'Semestral', obrig:'SIM'},
    ],
    cond: [
      {cod:'2055', nome:'Pix — Informações Operacionais', per:'Mensal', obrig:'COND', obs:'Apenas se possuir ISPB próprio'},
    ],
  },
  scd: {
    desc: 'Sociedade de Crédito Direto: fintech de crédito com recursos próprios. IF autorizada pelo BCB. Sem Basileia III.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal',     obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',  per:'Semestral',  obrig:'SIM'},
      {cod:'4111', nome:'Posição Financeira Diária — DLO',per:'Diária',    obrig:'SIM'},
      {cod:'3040', nome:'SCR — Dados de Crédito',         per:'Mensal',     obrig:'SIM'},
      {cod:'3044', nome:'SCR — Eventos de Crédito',       per:'Por evento', obrig:'SIM'},
    ],
    cond: [
      {cod:'2055', nome:'Pix — Informações Operacionais', per:'Mensal', obrig:'COND', obs:'Apenas se for também EME com ISPB'},
    ],
  },
  psav: {
    desc: 'PSAV: exchange, custodiante ou intermediária de ativos virtuais. Marco regulatório vigente desde 02/02/2026.',
    obrig: [
      {cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal',    obrig:'SIM'},
      {cod:'4016', nome:'Balanço Patrimonial Semestral',  per:'Semestral', obrig:'SIM'},
      {cod:'C212', nome:'Serviços de Ativos Virtuais',   per:'Mensal',    obrig:'SIM', obs:'A partir de mai/2026 — IN BCB 693/2025'},
    ],
    cond: [],
  },
}

const TIPOS = [
  {id:'s1',          l:'S1 — Banco Sistêmico',         g:'Segmentos Prudenciais'},
  {id:'s2',          l:'S2 — Banco Médio Internacional',g:'Segmentos Prudenciais'},
  {id:'s3',          l:'S3 — IF Médio Porte',           g:'Segmentos Prudenciais'},
  {id:'s4',          l:'S4 — IF Menor Porte',           g:'Segmentos Prudenciais'},
  {id:'s5',          l:'S5 — Microinstituição',         g:'Segmentos Prudenciais'},
  {id:'adquirente',  l:'Adquirente / Credenciador',     g:'Instituições de Pagamento'},
  {id:'subadquirente',l:'Subadquirente',                g:'Instituições de Pagamento'},
  {id:'emissor_pre', l:'Emissor Pré-pago',              g:'Instituições de Pagamento'},
  {id:'emissor_pos', l:'Emissor Pós-pago',              g:'Instituições de Pagamento'},
  {id:'itp',         l:'ITP — Iniciador',               g:'Instituições de Pagamento'},
  {id:'scd',         l:'SCD — Crédito Direto',          g:'Crédito'},
  {id:'psav',        l:'PSAV — Ativos Virtuais',        g:'Outros'},
]

const SEGS = [
  {id:'S1',l:'S1 — Porte Sistêmico (PR ≥ R$245bi)'},
  {id:'S2',l:'S2 — Porte Grande (PR R$100–244bi)'},
  {id:'S3',l:'S3 — Porte Médio (PR R$2,3–99,9bi)'},
  {id:'S4',l:'S4 — Porte Menor (PR R$500M–2,29bi)'},
  {id:'S5',l:'S5 — Microinstituição (PR < R$500M)'},
  {id:'N', l:'Não sujeito a segmento prudencial'},
]

export default function SettingsPage() {
  const [key, setKey]     = useState('')
  const [showK, setShowK] = useState(false)
  const [cnpj, setCnpj]   = useState('')
  const [nome, setNome]   = useState('')
  const [tipo, setTipo]   = useState('')
  const [seg,  setSeg]    = useState('')
  const [ispb, setIspb]   = useState('')
  const [saved, setSaved] = useState(false)
  const [testing,setTest] = useState(false)
  const [testRes,setTRes] = useState<{ok:boolean;msg:string}|null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setKey(localStorage.getItem('bm_api_key')||'')
      setCnpj(localStorage.getItem('bm_cnpj')||'')
      setNome(localStorage.getItem('bm_nome')||'')
      setTipo(localStorage.getItem('bm_tipo')||'')
      setSeg(localStorage.getItem('bm_segmento')||'')
      setIspb(localStorage.getItem('bm_ispb')||'')
    }
  }, [])

  const save = () => {
    localStorage.setItem('bm_api_key',  key.trim())
    localStorage.setItem('bm_cnpj',     cnpj.trim())
    localStorage.setItem('bm_nome',     nome.trim())
    localStorage.setItem('bm_tipo',     tipo)
    localStorage.setItem('bm_segmento', seg)
    localStorage.setItem('bm_ispb',     ispb.trim())
    setSaved(true); setTimeout(()=>setSaved(false), 2800)
  }

  const testar = async () => {
    if (!key.trim()) { setTRes({ok:false,msg:'Insira a API key antes de testar'}); return }
    setTest(true); setTRes(null)
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json','x-api-key':key.trim(),'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:20,messages:[{role:'user',content:'OK'}]})
      })
      if (r.ok) setTRes({ok:true, msg:'✓ API key válida — conexão com Anthropic estabelecida'})
      else { const e=await r.json().catch(()=>({})); setTRes({ok:false,msg:'✗ Erro '+r.status+': '+(e.error?.message||'Verifique a chave')}) }
    } catch(e:any) { setTRes({ok:false,msg:'✗ Erro de rede: '+e.message}) }
    setTest(false)
  }

  const matrizIF = tipo ? MATRIZ[tipo] : null
  const tipoLabel = TIPOS.find(t => t.id === tipo)?.l || ''
  const grupos = [...new Set(TIPOS.map(t=>t.g))]

  const iSt: React.CSSProperties = { width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', color:'#111827', background:'#fff', marginBottom:4 }
  const lSt: React.CSSProperties = { display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }

  const Section = ({title, children}: {title:string; children:React.ReactNode}) => (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:16 }}>
      <div style={{ padding:'13px 20px', borderBottom:'1px solid #f3f4f6', background:'#fafafa' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{title}</div>
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  )

  return (
    <div style={{ padding:'24px 28px', minHeight:'100%', background:'#f1f3f7' }}>
      <div style={{ maxWidth:780 }}>
        <div style={{ marginBottom:22 }}>
          <h1 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 4px', letterSpacing:'-.4px' }}>⊙ Configurações</h1>
          <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>Configure a instituição e a API key. Os CADOCs obrigatórios são calculados automaticamente após salvar.</p>
        </div>

        {/* API Key */}
        <Section title="🔑 Anthropic API Key — Módulos com IA">
          <p style={{ fontSize:12, color:'#6b7280', lineHeight:1.6, marginBottom:16 }}>
            A API key habilita a <strong>Análise de Normas por IA</strong> e o <strong>Assistente Regulatório</strong> no módulo Normas BCB. Não é necessária para nenhuma outra função da plataforma.<br/>
            Obtenha em <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color:'#1d4ed8' }}>console.anthropic.com</a> → API Keys. Armazenada no navegador (localStorage).
          </p>
          <label style={lSt}>API Key</label>
          <div style={{ position:'relative', marginBottom:10 }}>
            <input type={showK?'text':'password'} value={key} onChange={e=>setKey(e.target.value)} placeholder="sk-ant-api03-…"
              style={{...iSt, marginBottom:0, paddingRight:80, fontFamily:'monospace'}}/>
            <button onClick={()=>setShowK(!showK)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#9ca3af', fontFamily:'monospace', outline:'none' }}>
              {showK?'ocultar':'mostrar'}
            </button>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
            <button onClick={testar} disabled={testing} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', cursor:'pointer', fontSize:12, fontWeight:600, color:'#374151', outline:'none' }}>
              {testing ? '⏳ Testando…' : '⚡ Testar conexão'}
            </button>
            {testRes && <span style={{ fontSize:11, color:testRes.ok?'#16a34a':'#dc2626', fontFamily:'monospace' }}>{testRes.msg}</span>}
          </div>
        </Section>

        {/* Dados IF */}
        <Section title="🏦 Dados da Instituição Financeira">
          <label style={lSt}>Razão Social</label>
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="BANCO EXEMPLO S.A." style={iSt}/>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:14 }}>Exibida na barra lateral e nos templates de CADOC</div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:4 }}>
            <div>
              <label style={lSt}>CNPJ raiz (8 dígitos)</label>
              <input value={cnpj} onChange={e=>setCnpj(e.target.value.replace(/\D/g,'').slice(0,8))} placeholder="12345678" style={{...iSt, fontFamily:'monospace'}}/>
              <div style={{ fontSize:11, color:'#9ca3af', marginBottom:14 }}>Primeiros 8 dígitos do CNPJ</div>
            </div>
            <div>
              <label style={lSt}>ISPB (se diferente)</label>
              <input value={ispb} onChange={e=>setIspb(e.target.value.replace(/\D/g,'').slice(0,8))} placeholder="12345678" style={{...iSt, fontFamily:'monospace'}}/>
              <div style={{ fontSize:11, color:'#9ca3af', marginBottom:14 }}>Código ISPB para Pix e STA</div>
            </div>
          </div>

          <label style={lSt}>Tipo de Instituição</label>
          <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...iSt, cursor:'pointer'}}>
            <option value="">Selecione o tipo de instituição…</option>
            {grupos.map(g => (
              <optgroup key={g} label={g}>
                {TIPOS.filter(t=>t.g===g).map(t=><option key={t.id} value={t.id}>{t.l}</option>)}
              </optgroup>
            ))}
          </select>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:14 }}>Determina os CADOCs obrigatórios exibidos abaixo</div>

          <label style={lSt}>Segmento Prudencial (Res. BCB 197/2022)</label>
          <select value={seg} onChange={e=>setSeg(e.target.value)} style={{...iSt, cursor:'pointer'}}>
            <option value="">Selecione o segmento prudencial…</option>
            {SEGS.map(s=><option key={s.id} value={s.id}>{s.l}</option>)}
          </select>
          <div style={{ fontSize:11, color:'#9ca3af' }}>Influencia as exigências adicionais de capital e liquidez</div>
        </Section>

        {/* CADOCs obrigatórios */}
        {matrizIF && tipo && (
          <Section title={`⊠ CADOCs Obrigatórios — ${tipoLabel}`}>
            <p style={{ fontSize:12, color:'#6b7280', lineHeight:1.6, marginBottom:16, padding:'10px 14px', background:'#f9fafb', borderRadius:8, border:'1px solid #f3f4f6' }}>
              {matrizIF.desc}
            </p>

            {/* Cabeçalho de contagem */}
            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              <div style={{ padding:'8px 14px', borderRadius:8, background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:16, fontWeight:900, color:'#16a34a', fontFamily:'monospace' }}>{matrizIF.obrig.length}</span>
                <span style={{ fontSize:10, color:'#16a34a', fontWeight:600, textTransform:'uppercase', letterSpacing:'.3px' }}>Obrigatórios</span>
              </div>
              {matrizIF.cond.length > 0 && (
                <div style={{ padding:'8px 14px', borderRadius:8, background:'#fffbeb', border:'1px solid #fde68a', display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:16, fontWeight:900, color:'#d97706', fontFamily:'monospace' }}>{matrizIF.cond.length}</span>
                  <span style={{ fontSize:10, color:'#d97706', fontWeight:600, textTransform:'uppercase', letterSpacing:'.3px' }}>Condicionais</span>
                </div>
              )}
            </div>

            {/* Tabela obrigatórios */}
            <div style={{ fontSize:10, fontWeight:700, color:'#16a34a', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#16a34a' }}/> Obrigatórios — SIM
            </div>
            <div style={{ borderRadius:10, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:16 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    {['CADOC','Documento','Periodicidade','Obs.'].map(h=>(
                      <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:9.5, fontWeight:700, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrizIF.obrig.map((r,i)=>(
                    <tr key={r.cod} style={{ borderTop:i>0?'1px solid #f9fafb':'none' }}>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:800, fontSize:13, color:'#0891b2' }}>{r.cod}</td>
                      <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600, color:'#111827' }}>{r.nome}</td>
                      <td style={{ padding:'10px 14px', fontSize:11.5, fontFamily:'monospace', color:'#6b7280', whiteSpace:'nowrap' }}>{r.per}</td>
                      <td style={{ padding:'10px 14px', fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>{r.obs||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tabela condicionais */}
            {matrizIF.cond.length > 0 && (
              <>
                <div style={{ fontSize:10, fontWeight:700, color:'#d97706', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#d97706' }}/> Condicionais — conforme atividade exercida
                </div>
                <div style={{ borderRadius:10, border:'1px solid #fde68a', overflow:'hidden', marginBottom:12 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                    <thead>
                      <tr style={{ background:'#fffbeb' }}>
                        {['CADOC','Documento','Periodicidade','Condição'].map(h=>(
                          <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:9.5, fontWeight:700, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'1px solid #fde68a' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrizIF.cond.map((r,i)=>(
                        <tr key={r.cod} style={{ borderTop:i>0?'1px solid #fffbeb':'none' }}>
                          <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:800, fontSize:13, color:'#d97706' }}>{r.cod}</td>
                          <td style={{ padding:'10px 14px', fontSize:13, fontWeight:500, color:'#374151' }}>{r.nome}</td>
                          <td style={{ padding:'10px 14px', fontSize:11.5, fontFamily:'monospace', color:'#6b7280', whiteSpace:'nowrap' }}>{r.per}</td>
                          <td style={{ padding:'10px 14px', fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>{r.obs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize:11, color:'#6b7280', padding:'8px 12px', background:'#eff6ff', borderRadius:7, border:'1px solid #bfdbfe' }}>
                  ℹ️ Baseado no documento <strong>Cadocs_por_Instituição BCB</strong>. Consulte seu DPO ou área jurídica para confirmar obrigatoriedades específicas.
                </div>
              </>
            )}
          </Section>
        )}

        {/* Salvar */}
        <button onClick={save} style={{ padding:'11px 28px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#0d6e52,#1248a0)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', outline:'none', boxShadow:'0 4px 14px rgba(13,110,82,.3)' }}>
          {saved ? '✓ Configurações Salvas!' : '💾 Salvar Configurações'}
        </button>
        {saved && <p style={{ fontSize:12, color:'#16a34a', marginTop:8, fontWeight:600 }}>✓ Dados salvos. O nome da IF já aparece na barra lateral e os CADOCs foram atualizados.</p>}
      </div>
    </div>
  )
}
