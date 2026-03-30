'use client'
import { useState, useEffect } from 'react'

type CRow = { cod: string; nome: string; per: string; obrig: 'SIM' | 'COND'; obs?: string }
type CMatrix = { desc: string; obrig: CRow[]; cond: CRow[]; nao?: {cod:string;nome:string;per:string;motivo:string}[]; alerta?: string }

const MATRIZ: Record<string, CMatrix> = {
  s1: {
    desc: 'Banco sistemicamente importante — PR ≥ R$245bi ou designado G-SIB. Exemplos: BB, Itaú, Bradesco, Santander, CEF. Basileia III pleno com TLAC, LCR e NSFR individuais.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',          per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',           per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posição Financeira Diária — DLO',         per:'Diária',     obrig:'SIM' },
      { cod:'2020', nome:'Capital — PR e Índices Basileia III',     per:'Mensal',     obrig:'SIM' },
      { cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',      per:'Mensal',     obrig:'SIM' },
      { cod:'2025', nome:'LCR — Liquidity Coverage Ratio',          per:'Mensal',     obrig:'SIM' },
      { cod:'2030', nome:'NSFR — Net Stable Funding Ratio',         per:'Mensal',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Crédito', per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Crédito',                per:'Por evento', obrig:'SIM' },
      { cod:'2055', nome:'Pix — Informações Operacionais',          per:'Mensal',     obrig:'SIM' },
    ],
    cond: [
      { cod:'6334', nome:'Cartões Credenciadores (ASPB034)', per:'Trimestral', obrig:'COND', obs:'Se atuar como credenciador — solicitar dispensa via CRD caso não atue (art. 1º §único IN BCB 247)' },
      { cod:'6308', nome:'Cartões Emissores',                per:'Trimestral', obrig:'COND', obs:'Se emitir cartões em arranjo de pagamento' },
    ],
    nao: [{ cod:'C212', nome:'Ativos Virtuais — Câmbio', per:'Mensal', motivo:'Aplicável exclusivamente a PSAVs autorizadas' }],
    alerta: 'Base legal: Res. BCB 197/2022 (segmentação) · Res. CMN 4.955-4.966/2021 (Basileia III) · Res. CMN 4.401/2015 (LCR) · Res. CMN 4.616/2017 (NSFR)',
  },
  s2: {
    desc: 'Banco médio com atividade internacional — PR R$100–244bi. Mesmo arcabouço prudencial do S1, porém sem obrigação TLAC.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',          per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',           per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posição Financeira Diária — DLO',         per:'Diária',     obrig:'SIM' },
      { cod:'2020', nome:'Capital — PR e Índices Basileia III',     per:'Mensal',     obrig:'SIM' },
      { cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',      per:'Mensal',     obrig:'SIM' },
      { cod:'2025', nome:'LCR — Liquidity Coverage Ratio',          per:'Mensal',     obrig:'SIM' },
      { cod:'2030', nome:'NSFR — Net Stable Funding Ratio',         per:'Mensal',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Crédito', per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Crédito',                per:'Por evento', obrig:'SIM' },
      { cod:'2055', nome:'Pix — Informações Operacionais',          per:'Mensal',     obrig:'SIM' },
    ],
    cond: [{ cod:'6334', nome:'Cartões Credenciadores', per:'Trimestral', obrig:'COND', obs:'Se atuar como credenciador. Solicitar dispensa CRD caso contrário.' }],
    alerta: 'S2 vs S1: mesmo arcabouço (LCR, NSFR, Basileia III), sem TLAC e com menor frequência de Pilar 3.',
  },
  s3: {
    desc: 'IF de médio porte — PR R$2,3–99,9bi. Basileia III simplificado: ILC em lugar de LCR, sem NSFR individual, sem obrigação de Pilar 3 público.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',           per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',            per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posição Financeira Diária — DLO',          per:'Diária',     obrig:'SIM' },
      { cod:'2020', nome:'Capital — PR e Índices (Basileia simpl.)', per:'Mensal',     obrig:'SIM' },
      { cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',       per:'Mensal',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Crédito',  per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Crédito',                 per:'Por evento', obrig:'SIM' },
    ],
    cond: [
      { cod:'2055', nome:'Pix — Informações Operacionais', per:'Mensal',     obrig:'COND', obs:'Se participante direto do Pix com ISPB próprio' },
      { cod:'6334', nome:'Cartões Credenciadores',         per:'Trimestral', obrig:'COND', obs:'Se atuar como credenciador' },
    ],
    nao: [
      { cod:'2025', nome:'LCR', per:'Mensal', motivo:'S3 usa ILC (Índice de Liquidez de Curto Prazo) — o LCR pleno não se aplica' },
      { cod:'2030', nome:'NSFR', per:'Mensal', motivo:'S3 usa RAS (Razão de Ativos Sobre Exigibilidades) como proxy — NSFR padrão não se aplica' },
    ],
    alerta: 'Cooperativas centrais seguem normas específicas (Res. CMN 4.434) e podem ter CADOCs adicionais.',
  },
  s4: {
    desc: 'IF de menor porte — PR R$500M–2,29bi. ICP (Índice de Capital Próprio) simplificado. SCR e Pix condicionais à carteira e participação.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',           per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',            per:'Semestral', obrig:'SIM' },
      { cod:'2020', nome:'Capital — Índice de Capital Próprio (ICP)',per:'Mensal',   obrig:'SIM' },
    ],
    cond: [
      { cod:'4111', nome:'Posição Financeira Diária — DLO',         per:'Diária',     obrig:'COND', obs:'Apenas se mantiver conta reservas no BCB/STR' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Crédito', per:'Mensal',     obrig:'COND', obs:'Apenas se possuir carteira de crédito ≥ R$200/cliente' },
      { cod:'3044', nome:'SCR — Eventos de Crédito',                per:'Por evento', obrig:'COND', obs:'Condicional ao SCR 3040' },
      { cod:'2055', nome:'Pix — Informações Operacionais',          per:'Mensal',     obrig:'COND', obs:'Apenas se participante direto com ISPB' },
    ],
    nao: [
      { cod:'2025', nome:'LCR', per:'Mensal', motivo:'Somente S1 e S2 (Res. CMN 4.401/2015)' },
      { cod:'2030', nome:'NSFR', per:'Mensal', motivo:'Somente S1 e S2 (Res. CMN 4.616/2017)' },
      { cod:'2045', nome:'RWA completo', per:'Mensal', motivo:'S4 usa ICP simplificado — CADOC 2045 com parcelas Basileia III não se aplica' },
    ],
    alerta: 'Cooperativas singulares S4 seguem adicionalmente as normas OCB/Banco Cooperativo (Res. CMN 4.434/2015).',
  },
  s5: {
    desc: 'Microinstituição — PR < R$500M. Menor carga regulatória do SFN. Sem LCR, NSFR nem DLO. ICP trimestral.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal (D+15)', obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',  per:'Semestral',    obrig:'SIM' },
      { cod:'2020', nome:'Capital — ICP Simplificado',     per:'Trimestral',   obrig:'SIM' },
    ],
    cond: [{ cod:'3040', nome:'SCR — Dados de Crédito', per:'Mensal', obrig:'COND', obs:'Apenas se possuir exposições ≥ R$200 por cliente' }],
    nao: [
      { cod:'4111', nome:'DLO', per:'Diária', motivo:'S5 geralmente não mantém conta reservas no BCB' },
      { cod:'2025', nome:'LCR', per:'Mensal', motivo:'Somente S1 e S2' },
      { cod:'2030', nome:'NSFR', per:'Mensal', motivo:'Somente S1 e S2' },
      { cod:'3044', nome:'SCR Eventos', per:'Por evento', motivo:'Aplicável apenas se ativo o SCR 3040' },
    ],
    alerta: 'Administradoras de consórcio têm CADOCs específicos de consórcio além dos listados.',
  },
  adquirente: {
    desc: 'Credenciador/Adquirente: habilita ECs e participa diretamente da liquidação. Exemplos: Cielo, Stone, Rede, GetNet. Capital mínimo R$2M (Res. BCB 407/2024).',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
      { cod:'6334', nome:'Cartões Credenciadores — ASPB034 (10 TXTs)', per:'Trimestral', obrig:'SIM' },
    ],
    cond: [
      { cod:'4111', nome:'Posição Financeira Diária — DLO', per:'Diária',     obrig:'COND', obs:'Se mantiver conta de liquidação relevante no BCB/STR' },
      { cod:'2055', nome:'Pix — Informações Operacionais',  per:'Mensal',     obrig:'COND', obs:'Apenas se participante direto do Pix com ISPB próprio' },
      { cod:'2050', nome:'Arranjos de Pagamento',           per:'Trimestral', obrig:'COND', obs:'Apenas se também for instituidor do arranjo (ex: bandeira própria)' },
      { cod:'3040', nome:'SCR — Dados de Crédito',          per:'Mensal',     obrig:'COND', obs:'Apenas se oferecer crédito (antecipação de recebíveis com risco próprio, BNPL)' },
    ],
    nao: [
      { cod:'2020', nome:'Capital/PR Basileia', per:'Mensal', motivo:'IPs não estão sujeitas ao arcabouço Basileia III' },
      { cod:'2025', nome:'LCR', per:'Mensal', motivo:'Não aplicável a IPs' },
      { cod:'6308', nome:'Cartões Emissores', per:'Trimestral', motivo:'O 6308 é para emissores. Adquirente puro não envia.' },
    ],
    alerta: 'ALERTA Res. BCB 522/2025: a partir de 09/05/2026, subcredenciadores vinculados devem participar da câmara centralizada. O CADOC 2055 terá novo campo QTD_SUBCREDEN_TRANS.',
  },
  subadquirente: {
    desc: 'Habilita ECs sem participar diretamente da liquidação — opera sob guarda-chuva de adquirente. Exemplos: SumUp, Ton, Vend.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
    ],
    cond: [
      { cod:'2055', nome:'Pix — Informações Operacionais', per:'Mensal', obrig:'COND', obs:'Apenas se participante direto com ISPB próprio' },
      { cod:'3040', nome:'SCR — Dados de Crédito',         per:'Mensal', obrig:'COND', obs:'Se oferecer crédito próprio (antecipação, BNPL)' },
    ],
    nao: [
      { cod:'6334', nome:'Cartões Credenciadores (ASPB034)', per:'Trimestral', motivo:'Obrigação do adquirente principal — o sub NÃO envia o 6334 diretamente' },
    ],
    alerta: 'ALERTA CRÍTICO — Res. BCB 522/2025: a partir de 09/05/2026, subadquirentes que atuam como recebedores DEVEM participar da liquidação centralizada. Descumprimento = suspensão da captura. Isso pode reclassificar o sub para adquirente (com obrigação do 6334).',
  },
  emissor_pre: {
    desc: 'Emissor pré-pago: conta digital, cartão pré-pago, carteira eletrônica. Mantém saldo pré-carregado. Capital mínimo R$2M (R$5M se provedora Pix transacional).',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
      { cod:'4111', nome:'Posição Financeira Diária — DLO',     per:'Diária',    obrig:'SIM' },
      { cod:'2055', nome:'Pix — Informações Operacionais',      per:'Mensal',    obrig:'SIM', obs:'Se participante direto do SPI com ISPB' },
    ],
    cond: [{ cod:'3040', nome:'SCR — Dados de Crédito', per:'Mensal', obrig:'COND', obs:'Apenas se oferecer crédito (SCD cumulativa ou parceria)' }],
    alerta: 'Segregação patrimonial: saldo de clientes pré-pagos deve ser segregado e aplicado em ativos permitidos (Res. BCB 80).',
  },
  emissor_pos: {
    desc: 'Emissor pós-pago: cartão de crédito, conta pós-paga. Habilita crédito sem ser IF plena. Sujeito obrigatoriamente ao SCR e CADOC 3044.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)',     per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',           per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posição Financeira Diária — DLO',         per:'Diária',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Crédito', per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Crédito',                per:'Por evento', obrig:'SIM' },
      { cod:'6308', nome:'Cartões de Pagamento — Emissores',        per:'Trimestral', obrig:'SIM' },
    ],
    cond: [{ cod:'2055', nome:'Pix — Informações Operacionais', per:'Mensal', obrig:'COND', obs:'Se participante direto do Pix' }],
    nao: [{ cod:'6334', nome:'Cartões Credenciadores', per:'Trimestral', motivo:'Obrigação do credenciador, não do emissor' }],
    alerta: 'CADOC 6308 é o equivalente do 6334 para o lado emissor do arranjo.',
  },
  itp: {
    desc: 'Iniciador de Transação de Pagamento via Open Finance. Não detém fundos, não gerencia conta, não tem ISPB. Menor carga entre as IPs. Capital mínimo R$2M.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
    ],
    cond: [{ cod:'2055', nome:'Pix — Informações Operacionais', per:'Mensal', obrig:'COND', obs:'Apenas se possuir ISPB próprio (muito raro para ITPs)' }],
    nao: [
      { cod:'4111', nome:'DLO', per:'Diária', motivo:'ITP não detém fundos de terceiros — sem conta no BCB' },
      { cod:'3040', nome:'SCR', per:'Mensal',  motivo:'ITP não tem carteira de crédito' },
      { cod:'6334', nome:'Cartões Credenciadores', per:'Trimestral', motivo:'ITP não é credenciador' },
    ],
    alerta: 'ITP é a modalidade de menor carga de CADOC entre todas as IPs autorizadas.',
  },
  scd: {
    desc: 'Sociedade de Crédito Direto: fintech de crédito com recursos próprios via plataforma eletrônica, sem captação do público. Pode emitir CCB. IF autorizada pelo BCB. Sem Basileia III.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',  per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posição Financeira Diária — DLO',per:'Diária',    obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados de Crédito',         per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Crédito',       per:'Por evento', obrig:'SIM' },
    ],
    cond: [{ cod:'2055', nome:'Pix — Informações Operacionais', per:'Mensal', obrig:'COND', obs:'Apenas se for também EME com ISPB próprio' }],
    nao: [
      { cod:'2020', nome:'Capital/PR Basileia', per:'Mensal', motivo:'SCDs usam capital mínimo regulamentar fixo — sem Basileia III' },
      { cod:'6334', nome:'Cartões Credenciadores', per:'Trimestral', motivo:'SCD não é credenciadora' },
    ],
    alerta: 'SCDs com conta transacional Pix (EME cumulativo): capital mínimo R$5M (Res. BCB 407/2024).',
  },
  psav: {
    desc: 'PSAV: exchange, custodiante ou intermediária de criptoativos. Marco regulatório vigente desde 02/02/2026 (Res. BCB 519/520/521). Capital mínimo R$10,8M a R$37,2M conforme modalidade.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanço Patrimonial Semestral',  per:'Semestral', obrig:'SIM' },
      { cod:'C212', nome:'Serviços de Ativos Virtuais — Câmbio', per:'Mensal', obrig:'SIM', obs:'Vigência: a partir de mai/2026 — IN BCB 693/2025' },
    ],
    cond: [],
    nao: [
      { cod:'3040', nome:'SCR', per:'Mensal', motivo:'Não aplicável salvo parceria com IF de crédito' },
      { cod:'6334', nome:'Cartões Credenciadores', per:'Trimestral', motivo:'Salvo se operar meio de pagamento credenciado' },
    ],
    alerta: 'Prazo de autorização: empresas ativas em 02/02/2026 têm até 30/10/2026 para protocolar pedido. Câmbio: stablecoins e pagamentos internacionais = operações de câmbio (Res. BCB 521).',
  },
}

const GRUPOS = [
  { id:'prudencial', label:'Segmentação Prudencial (Res. BCB 197/2022)', tipos: [
    { id:'s1', label:'S1', sub:'PR ≥ R$245bi ou G-SIB', cor:'#dc2626' },
    { id:'s2', label:'S2', sub:'PR R$100–244bi',         cor:'#ea580c' },
    { id:'s3', label:'S3', sub:'PR R$2,3–99,9bi',        cor:'#d97706' },
    { id:'s4', label:'S4', sub:'PR R$500M–2,29bi',       cor:'#65a30d' },
    { id:'s5', label:'S5', sub:'PR < R$500M',            cor:'#16a34a' },
  ]},
  { id:'pagamento', label:'Instituições de Pagamento (Res. BCB 80/2021)', tipos: [
    { id:'adquirente',   label:'Adquirente',       sub:'Credenciador + liquidação',     cor:'#0891b2' },
    { id:'subadquirente',label:'Subadquirente',    sub:'Credenciador s/ liquidação',    cor:'#0284c7' },
    { id:'emissor_pre',  label:'Emissor Pré-pago', sub:'Conta digital, cartão pré',     cor:'#7c3aed' },
    { id:'emissor_pos',  label:'Emissor Pós-pago', sub:'Cartão crédito, conta pós',     cor:'#9333ea' },
    { id:'itp',          label:'ITP',              sub:'Iniciador Open Finance',         cor:'#db2777' },
  ]},
  { id:'outros', label:'Outros', tipos: [
    { id:'scd',  label:'SCD',  sub:'Crédito Direto',     cor:'#0d9488' },
    { id:'psav', label:'PSAV', sub:'Ativos Virtuais',    cor:'#4b5563' },
  ]},
]

export default function PagamentosPage() {
  const [sel, setSel]         = useState('adquirente')
  const [cfgTipo, setCfgTipo] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') setCfgTipo(localStorage.getItem('bm_tipo') || '')
  }, [])

  const m = MATRIZ[sel]
  const allTipos = GRUPOS.flatMap(g => g.tipos)
  const tipoInfo = allTipos.find(t => t.id === sel)

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:'#f1f3f7', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── Sidebar seletor ── */}
      <div style={{ width:220, flexShrink:0, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:'#111827', marginBottom:2 }}>Matriz Regulatória</div>
          <div style={{ fontSize:10.5, color:'#9ca3af' }}>Selecione o tipo de IF</div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          {GRUPOS.map(g => (
            <div key={g.id} style={{ marginBottom:6 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.2, color:'#9ca3af', textTransform:'uppercase', padding:'6px 14px 4px' }}>{g.label}</div>
              {g.tipos.map(t => {
                const active = sel === t.id
                const isCfg  = cfgTipo === t.id
                return (
                  <div key={t.id} onClick={() => setSel(t.id)} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 14px', cursor:'pointer', borderLeft:`2px solid ${active?t.cor:'transparent'}`, background:active?t.cor+'10':'transparent', transition:'all .1s' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:t.cor, flexShrink:0 }}/>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:active?700:400, color:active?'#111827':'#374151', display:'flex', gap:6, alignItems:'center' }}>
                        {t.label}
                        {isCfg && <span style={{ fontSize:8, background:'#0d9166', color:'#fff', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>SUA IF</span>}
                      </div>
                      <div style={{ fontSize:10, color:'#9ca3af', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div style={{ padding:'10px 14px', borderTop:'1px solid #f3f4f6', flexShrink:0 }}>
          <div style={{ fontSize:10, color:'#9ca3af', lineHeight:1.5 }}>Fonte: PDF BCB — Cadocs_por_Instituicao</div>
          <a href="/dashboard/settings" style={{ fontSize:10.5, color:'#0d9166', textDecoration:'none', fontWeight:600 }}>Configurar minha IF →</a>
        </div>
      </div>

      {/* ── Painel detalhe ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:tipoInfo?.cor||'#6b7280' }}/>
              <h1 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:0, letterSpacing:'-.4px' }}>{tipoInfo?.label||sel}</h1>
              {cfgTipo === sel && (
                <span style={{ fontSize:10, background:'#0d9166', color:'#fff', padding:'2px 8px', borderRadius:4, fontWeight:700 }}>SUA IF CONFIGURADA</span>
              )}
            </div>
            <p style={{ fontSize:12, color:'#6b7280', margin:0, lineHeight:1.65, maxWidth:640 }}>{m.desc}</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ padding:'8px 14px', borderRadius:9, background:'#f0fdf4', border:'1px solid #bbf7d0', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:900, color:'#16a34a', fontFamily:'monospace' }}>{m.obrig.length}</div>
              <div style={{ fontSize:9.5, color:'#16a34a', fontWeight:700, textTransform:'uppercase' }}>Obrigatórios</div>
            </div>
            {m.cond.length > 0 && (
              <div style={{ padding:'8px 14px', borderRadius:9, background:'#fffbeb', border:'1px solid #fde68a', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:900, color:'#d97706', fontFamily:'monospace' }}>{m.cond.length}</div>
                <div style={{ fontSize:9.5, color:'#d97706', fontWeight:700, textTransform:'uppercase' }}>Condicionais</div>
              </div>
            )}
            {m.nao && m.nao.length > 0 && (
              <div style={{ padding:'8px 14px', borderRadius:9, background:'#f9fafb', border:'1px solid #e5e7eb', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:900, color:'#9ca3af', fontFamily:'monospace' }}>{m.nao.length}</div>
                <div style={{ fontSize:9.5, color:'#9ca3af', fontWeight:700, textTransform:'uppercase' }}>N/A</div>
              </div>
            )}
          </div>
        </div>

        {/* Alerta */}
        {m.alerta && (
          <div style={{ padding:'10px 14px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:9, marginBottom:16, fontSize:12, color:'#92400e', lineHeight:1.6 }}>
            ⚠ {m.alerta}
          </div>
        )}

        {/* Tabela obrigatórios */}
        <div style={{ marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#16a34a' }}/>
          <span style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'.5px' }}>Obrigatórios — envio mandatório</span>
        </div>
        <div style={{ borderRadius:10, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:16, background:'#fff' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead>
              <tr style={{ background:'#f9fafb' }}>
                {['CADOC','Documento','Periodicidade','Obs.'].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:9.5, fontWeight:700, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.obrig.map((r,i) => (
                <tr key={r.cod} style={{ borderTop:i>0?'1px solid #f9fafb':'none' }}>
                  <td style={{ padding:'11px 14px', fontFamily:'monospace', fontWeight:800, fontSize:13, color:'#0891b2' }}>{r.cod}</td>
                  <td style={{ padding:'11px 14px', fontSize:13, fontWeight:600, color:'#111827' }}>{r.nome}</td>
                  <td style={{ padding:'11px 14px', fontSize:11, fontFamily:'monospace', color:'#6b7280', whiteSpace:'nowrap' }}>{r.per}</td>
                  <td style={{ padding:'11px 14px', fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>{r.obs||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabela condicionais */}
        {m.cond.length > 0 && (
          <>
            <div style={{ marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#d97706' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:'#d97706', textTransform:'uppercase', letterSpacing:'.5px' }}>Condicionais — conforme atividade</span>
            </div>
            <div style={{ borderRadius:10, border:'1px solid #fde68a', overflow:'hidden', marginBottom:16, background:'#fff' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                <thead>
                  <tr style={{ background:'#fffbeb' }}>
                    {['CADOC','Documento','Periodicidade','Condição'].map(h => (
                      <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:9.5, fontWeight:700, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'1px solid #fde68a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {m.cond.map((r,i) => (
                    <tr key={r.cod} style={{ borderTop:i>0?'1px solid #fffbeb':'none' }}>
                      <td style={{ padding:'11px 14px', fontFamily:'monospace', fontWeight:800, fontSize:13, color:'#d97706' }}>{r.cod}</td>
                      <td style={{ padding:'11px 14px', fontSize:13, fontWeight:500, color:'#374151' }}>{r.nome}</td>
                      <td style={{ padding:'11px 14px', fontSize:11, fontFamily:'monospace', color:'#6b7280', whiteSpace:'nowrap' }}>{r.per}</td>
                      <td style={{ padding:'11px 14px', fontSize:11, color:'#9ca3af' }}>{r.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tabela não aplicáveis */}
        {m.nao && m.nao.length > 0 && (
          <>
            <div style={{ marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#d1d5db' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.5px' }}>Não Aplicáveis — N/A</span>
            </div>
            <div style={{ borderRadius:10, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:16, background:'#fff' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    {['CADOC','Documento','Periodicidade','Motivo'].map(h => (
                      <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:9.5, fontWeight:700, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {m.nao.map((r,i) => (
                    <tr key={r.cod} style={{ borderTop:i>0?'1px solid #f9fafb':'none', opacity:.7 }}>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:800, fontSize:12.5, color:'#9ca3af', textDecoration:'line-through' }}>{r.cod}</td>
                      <td style={{ padding:'10px 14px', fontSize:12.5, color:'#9ca3af' }}>{r.nome}</td>
                      <td style={{ padding:'10px 14px', fontSize:11, fontFamily:'monospace', color:'#9ca3af' }}>{r.per}</td>
                      <td style={{ padding:'10px 14px', fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>{r.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div style={{ padding:'8px 12px', background:'#f9fafb', borderRadius:7, border:'1px solid #f3f4f6', fontSize:11, color:'#9ca3af' }}>
          Fonte: <strong>Cadocs_por_Instituição BCB</strong> · Res. BCB 197/2022 · Res. BCB 80/2021 · IN BCB 247/2022 · Res. BCB 407/2024 · Res. BCB 519-522/2025
        </div>
      </div>
    </div>
  )
}
