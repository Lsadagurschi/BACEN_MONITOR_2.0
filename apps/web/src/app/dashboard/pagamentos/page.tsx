'use client'
import { useState } from 'react'

const C = { grn:'#0a7c5c',grnb:'rgba(10,124,92,.08)',grnbrd:'rgba(10,124,92,.2)',txt:'#0d1117',txt2:'#1e3a5f',txt3:'#5a6e8a',bg:'#f5f6f8',bg2:'#fff',bg3:'#eef0f3',brd:'#dde1e9',brd2:'#c8cdd8',blu:'#1d5fcc',blub:'rgba(29,95,204,.08)',blubrd:'rgba(29,95,204,.18)',amb:'#b45309',ambb:'rgba(180,83,9,.08)',ambbrd:'rgba(180,83,9,.2)',red:'#c0392b',redb:'rgba(192,57,43,.06)',redbrd:'rgba(192,57,43,.18)',pnk:'#7c3aed',pnkb:'rgba(124,58,237,.06)',pnkbrd:'rgba(124,58,237,.18)',cyn:'#0e7490',cynb:'rgba(14,116,144,.06)',cynbrd:'rgba(14,116,144,.18)',org:'#c2410c' }

const INST_TYPES = [
  {id:'adquirente',label:'Adquirente / Credenciador',sublabel:'Maquininha, habilitação ECs',color:C.amb,grupo:'Pagamentos'},
  {id:'emissor_pre',label:'Emissor Pré-pago',sublabel:'Cartão pré-pago, conta digital',color:C.grn,grupo:'Pagamentos'},
  {id:'emissor_pos',label:'Emissor Pós-pago',sublabel:'Cartão de crédito',color:C.blu,grupo:'Pagamentos'},
  {id:'itp',label:'Iniciador (ITP)',sublabel:'Open Finance, sem deter fundos',color:C.pnk,grupo:'Pagamentos'},
  {id:'subcreden',label:'Subcredenciador',sublabel:'Habilitação de lojistas',color:C.org,grupo:'Pagamentos'},
  {id:'scd',label:'SCD — Crédito Direto',sublabel:'Fintech de crédito próprio',color:C.cyn,grupo:'Crédito'},
  {id:'banco',label:'Banco / IF Plena',sublabel:'Banco múltiplo, comercial',color:C.red,grupo:'Banco'},
  {id:'psav',label:'PSAV — Ativos Virtuais',sublabel:'Exchange, custodiante cripto',color:'#374151',grupo:'PSAV'},
]

type ObrigItem = { code:string; nome:string; per:string; obrig:'SIM'|'COND'|'NAO'; nota?:string; dispensa?:{pode:boolean;motivo:string} }

const CADOC_MATRIX: Record<string,{desc:string;notas:string;obrigatorios:ObrigItem[];nao_obrig:{code:string;nome:string;per:string;nota:string}[]}> = {
  adquirente: {
    desc:'Credenciadores e adquirentes: habilitação de estabelecimentos comerciais, processamento e liquidação de transações com cartões e outros instrumentos.',
    notas:'Obrigatoriedade baseada em Res. BCB 150/2021 (ASPB034), Res. BCB 80/2021 e regulamentação de arranjos. Credenciadores com volume > R$500M/tri devem enviar todos os arquivos 6334.',
    obrigatorios:[
      {code:'6334',nome:'Cartões — Credenciadores (ASPB034)',per:'Trimestral',obrig:'SIM',nota:'10 arquivos TXT posicionais. Credenciadores ativos no arr. de pagamento.'},
      {code:'2050',nome:'Informações de Arranjos de Pagamento',per:'Trimestral',obrig:'SIM',nota:'Para credenciadores participantes de arranjos BCB-regulados.'},
      {code:'4010',nome:'Balancete COSIF',per:'Mensal',obrig:'SIM',nota:'Para credenciadores com autorização BCB (não aplicável a credenciadores não-regulados).'},
      {code:'2055',nome:'Contas de Pagamento — Volume',per:'Trimestral',obrig:'COND',nota:'Apenas se operar contas de pagamento pré-pagas.'},
    ],
    nao_obrig:[
      {code:'3040',nome:'SCR Dados Individualizados de Crédito',per:'Mensal',nota:'Não aplicável — credenciadores não concedem crédito direto'},
      {code:'3044',nome:'SCR Eventos de Crédito',per:'Por evento',nota:'Não aplicável — credenciadores não concedem crédito direto'},
      {code:'2010',nome:'Patrimônio de Referência',per:'Mensal',nota:'Não exigido de credenciadores (exigido de bancos e SCDs)'},
    ]
  },
  emissor_pre: {
    desc:'Emissores de moeda eletrônica: conta de pagamento pré-paga, cartão pré-pago, carteira digital. Inclui IPs que mantêm recursos de usuários.',
    notas:'Baseado em Res. BCB 80/2021, Circular 3.885/2018 e regulamentação de contas de pagamento. Emissores Pix devem reportar CADOC 4010 mensalmente.',
    obrigatorios:[
      {code:'4010',nome:'Balancete COSIF',per:'Mensal',obrig:'SIM',nota:'Emissores com autorização BCB.'},
      {code:'2055',nome:'Contas de Pagamento — Volume e Saldo',per:'Trimestral',obrig:'SIM',nota:'Para todo emissor de conta pré-paga ou carteira eletrônica.'},
      {code:'2050',nome:'Arranjos de Pagamento',per:'Trimestral',obrig:'COND',nota:'Se participante de arranjo regulado pelo BCB.'},
      {code:'3044',nome:'SCR Eventos de Crédito',per:'Por evento',obrig:'COND',nota:'Apenas se conceder crédito (ex: cheque especial, limite rotativo).'},
    ],
    nao_obrig:[
      {code:'6334',nome:'Cartões Credenciadores (ASPB034)',per:'Trimestral',nota:'Exclusivo de credenciadores'},
      {code:'2010',nome:'Patrimônio de Referência',per:'Mensal',nota:'Não exigido de IPs (exigido de bancos)'},
      {code:'3040',nome:'SCR Dados de Crédito',per:'Mensal',nota:'Não aplicável se não houver carteira de crédito'},
    ]
  },
  emissor_pos: {
    desc:'Emissores pós-pagos: cartão de crédito, financiamento rotativo, contas pós-pagas. Operam sob regime de crédito com reporte obrigatório ao SCR.',
    notas:'Obrigatoriedade de SCR para IFs com carteira de crédito. Resolução CMN 3.658/2008 (SCR), Circ. BCB 4.019 (taxas), Res. BCB 403/2025 (CADOC 3044 fase 2).',
    obrigatorios:[
      {code:'3040',nome:'SCR Dados Individualizados de Crédito',per:'Mensal',obrig:'SIM',nota:'Para todo emissor de cartão de crédito.'},
      {code:'3044',nome:'SCR Eventos de Crédito',per:'Por evento',obrig:'SIM',nota:'Pagamentos, concessões e cessões. Fase 2 (cessões): mai/2026.'},
      {code:'3060',nome:'SCR Taxas de Juros',per:'Semanal',obrig:'SIM',nota:'Percentis de taxas por modalidade. D+5.'},
      {code:'4010',nome:'Balancete COSIF',per:'Mensal',obrig:'SIM',nota:'Para emissores com autorização BCB.'},
      {code:'2055',nome:'Contas de Pagamento',per:'Trimestral',obrig:'COND',nota:'Apenas se também operar conta pré-paga.'},
    ],
    nao_obrig:[
      {code:'6334',nome:'Cartões Credenciadores (ASPB034)',per:'Trimestral',nota:'Exclusivo de credenciadores — emissores não reportam este CADOC'},
      {code:'2050',nome:'Arranjos de Pagamento',per:'Trimestral',nota:'Apenas credenciadores participantes'},
    ]
  },
  itp: {
    desc:'Iniciadores de Transação de Pagamento: acessam dados e iniciam pagamentos via Open Finance. Não detêm fundos do usuário.',
    notas:'Res. BCB 1/2020 (Open Finance), IN BCB 510/2025 (Fase 4). ITPs precisam de autorização BCB mas têm exigências simplificadas vs emissores.',
    obrigatorios:[
      {code:'4010',nome:'Balancete COSIF',per:'Mensal',obrig:'SIM',nota:'Para ITPs com autorização BCB.'},
      {code:'7011',nome:'Open Finance — Dados Cadastrais',per:'Mensal',obrig:'SIM',nota:'Reporte via API Open Finance. Fase 4 inclui investimentos.'},
      {code:'2055',nome:'Contas de Pagamento',per:'Trimestral',obrig:'COND',nota:'Se também emitir conta pré-paga.'},
    ],
    nao_obrig:[
      {code:'3040',nome:'SCR Dados de Crédito',per:'Mensal',nota:'Não aplicável — ITP não detém carteira de crédito'},
      {code:'6334',nome:'Cartões Credenciadores',per:'Trimestral',nota:'Não aplicável — ITP não credencia ECs'},
      {code:'2010',nome:'Patrimônio de Referência',per:'Mensal',nota:'Não exigido de ITPs (exigido de bancos)'},
    ]
  },
  subcreden: {
    desc:'Subcredenciadores: habilitam lojistas/ECs em nome de credenciadores. Com a Res. BCB 522/2025, devem participar diretamente da liquidação financeira.',
    notas:'Res. BCB 522/2025: prazo de adequação 18 meses. Subcredenciadores passam a ter obrigações diretas de reporte e liquidação.',
    obrigatorios:[
      {code:'4010',nome:'Balancete COSIF',per:'Mensal',obrig:'SIM',nota:'Após autorização BCB obrigatória pela Res. 522.'},
      {code:'2050',nome:'Arranjos de Pagamento',per:'Trimestral',obrig:'COND',nota:'Se participante de arranjo regulado.'},
      {code:'6334',nome:'Cartões Credenciadores (ASPB034)',per:'Trimestral',obrig:'COND',nota:'Apenas subcredenciadores com volume acima do limiar BCB.',dispensa:{pode:true,motivo:'Subcredenciadores com volume < limiar BCB podem requerer dispensa'}},
    ],
    nao_obrig:[
      {code:'3040',nome:'SCR Dados de Crédito',per:'Mensal',nota:'Não aplicável se não conceder crédito'},
      {code:'2010',nome:'Patrimônio de Referência',per:'Mensal',nota:'Não exigido de subcredenciadores'},
    ]
  },
  scd: {
    desc:'Sociedade de Crédito Direto: concedem crédito com recursos próprios. Não captam depósitos. Alta exigência de SCR e capital.',
    notas:'Res. CMN 4.656/2018 (SCD). Exigência integral de SCR. Capital mínimo: R$ 1 milhão. PR exigido pois sujeita a Basileia simplificado.',
    obrigatorios:[
      {code:'3040',nome:'SCR Dados Individualizados de Crédito',per:'Mensal',obrig:'SIM',nota:'Obrigatório para qualquer SCD com carteira de crédito.'},
      {code:'3044',nome:'SCR Eventos de Crédito',per:'Por evento',obrig:'SIM',nota:'Pagamentos, concessões, cessões e aquisições.'},
      {code:'3060',nome:'SCR Taxas de Juros',per:'Semanal',obrig:'SIM',nota:'Percentis de taxas por modalidade.'},
      {code:'4010',nome:'Balancete COSIF',per:'Mensal',obrig:'SIM'},
      {code:'2010',nome:'Patrimônio de Referência (PR)',per:'Mensal',obrig:'SIM',nota:'SCD está sujeita a Basileia III simplificado.'},
    ],
    nao_obrig:[
      {code:'6334',nome:'Cartões Credenciadores',per:'Trimestral',nota:'Não aplicável — SCD não credencia ECs'},
      {code:'2055',nome:'Contas de Pagamento',per:'Trimestral',nota:'Não aplicável se não emitir contas de pagamento'},
    ]
  },
  banco: {
    desc:'Banco múltiplo, comercial ou de investimento: captam depósitos, concedem crédito, realizam câmbio. Maior abrangência regulatória.',
    notas:'Plena aplicação de Basileia III (PR, NSFR, LCR). Todos os CADOCs SCR são obrigatórios. Res. CMN 3.658/2008, 4.966/2021, 5.088/2024.',
    obrigatorios:[
      {code:'3040',nome:'SCR Dados Individualizados de Crédito',per:'Mensal',obrig:'SIM'},
      {code:'3044',nome:'SCR Eventos de Crédito',per:'Por evento',obrig:'SIM'},
      {code:'3060',nome:'SCR Taxas de Juros',per:'Semanal',obrig:'SIM'},
      {code:'4010',nome:'Balancete COSIF',per:'Mensal',obrig:'SIM'},
      {code:'2010',nome:'Patrimônio de Referência (PR)',per:'Mensal',obrig:'SIM',nota:'Basileia III integral.'},
      {code:'2020',nome:'Adequação do Capital — RWA',per:'Mensal',obrig:'SIM',nota:'Risco de crédito, mercado e operacional.'},
      {code:'2055',nome:'Contas de Pagamento',per:'Trimestral',obrig:'COND',nota:'Apenas se emitir contas pré-pagas.'},
    ],
    nao_obrig:[
      {code:'6334',nome:'Cartões Credenciadores',per:'Trimestral',nota:'Apenas se também for credenciador autorizado'},
    ]
  },
  psav: {
    desc:'Prestadores de Serviços em Ativos Virtuais: exchanges, custodiantes, intermediárias de cripto. Marco regulatório: Res. BCB 519-521/2023 e 396/2025.',
    notas:'Res. BCB 519-521/2023, 396/2025. Autorização BCB obrigatória desde set/2025. Capital mínimo: R$ 1 mi. Exige compliance AML/KYC estrito.',
    obrigatorios:[
      {code:'4010',nome:'Balancete COSIF',per:'Mensal',obrig:'SIM',nota:'Para PSAVs com autorização BCB.'},
      {code:'C212',nome:'Registro de Ativos Virtuais (C212)',per:'Mensal',obrig:'SIM',nota:'Reporte específico de posições em ativos virtuais.'},
      {code:'2010',nome:'Patrimônio de Referência',per:'Mensal',obrig:'COND',nota:'Se sujeito a requerimento de capital pela Res. 396/2025.',dispensa:{pode:false,motivo:'Não há dispensa — exigência da Res. BCB 396/2025'}},
    ],
    nao_obrig:[
      {code:'3040',nome:'SCR Dados de Crédito',per:'Mensal',nota:'Não aplicável — PSAV não concede crédito regulado'},
      {code:'6334',nome:'Cartões Credenciadores',per:'Trimestral',nota:'Não aplicável — PSAV não credencia ECs'},
    ]
  },
}

export default function PagamentosPage() {
  const [sel, setSel] = useState('adquirente')
  const [aiText, setAiText] = useState<Record<string,string>>({})
  const [aiLoading, setAiLoading] = useState<Record<string,boolean>>({})

  const inst = INST_TYPES.find(i=>i.id===sel)!
  const data = CADOC_MATRIX[sel]

  const grupos = INST_TYPES.reduce((acc,t)=>{ (acc[t.grupo]=acc[t.grupo]||[]).push(t); return acc }, {} as Record<string,typeof INST_TYPES>)

  const getApiKey = () => typeof window !== 'undefined' ? (localStorage.getItem('bm_api_key')||'') : ''

  const gerarAI = async (id: string) => {
    const apiKey = getApiKey()
    if (!apiKey) { alert('Configure sua API key em Configurações'); return }
    const d = CADOC_MATRIX[id]; const i = INST_TYPES.find(x=>x.id===id)!
    setAiLoading(prev=>({...prev,[id]:true}))
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:500,
          system:'Você é especialista em regulação BCB. Analise obrigações regulatórias de IFs de forma objetiva e prática.',
          messages:[{role:'user',content:`Analise as obrigações regulatórias para ${i.label} em 3 pontos curtos:\n1. Principais desafios de compliance\n2. Pontos de atenção críticos em 2026\n3. Recomendação prática\n\nCADOCs obrigatórios: ${d.obrigatorios.filter(c=>c.obrig==='SIM').map(c=>c.code).join(', ')}\nNota: ${d.notas}`}]
        })
      })
      const data2 = await r.json(); const txt = data2.content?.[0]?.text || ''
      setAiText(prev=>({...prev,[id]:txt}))
    } catch(e:any) { setAiText(prev=>({...prev,[id]:'Erro: '+e.message})) }
    setAiLoading(prev=>({...prev,[id]:false}))
  }

  const obrigColor = (o:string) => o==='SIM'?{bg:'#f0fdf4',color:C.grn,brd:'#bbf7d0'}:o==='COND'?{bg:'#fffbeb',color:C.amb,brd:'#fde68a'}:{bg:'#f9fafb',color:C.txt3,brd:C.brd}

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:C.bg }}>
      {/* Left: institution types */}
      <div style={{ width:220, flexShrink:0, borderRight:`1px solid ${C.brd}`, background:'#f9fafb', overflowY:'auto', padding:'12px 0' }}>
        <div style={{ padding:'0 14px 8px', fontSize:8.5, letterSpacing:2, textTransform:'uppercase', color:C.txt3, fontFamily:'monospace', fontWeight:600 }}>TIPO DE INSTITUIÇÃO</div>
        {Object.entries(grupos).map(([grupo, tipos])=>(
          <div key={grupo}>
            <div style={{ padding:'6px 14px 2px', fontSize:8, letterSpacing:1.5, textTransform:'uppercase', color:C.txt3, fontFamily:'monospace', fontWeight:600, opacity:.7 }}>{grupo}</div>
            {tipos.map(t=>(
              <button key={t.id} onClick={()=>setSel(t.id)} style={{
                display:'flex', flexDirection:'column', alignItems:'flex-start', width:'100%',
                padding:'8px 14px', cursor:'pointer', border:'none', outline:'none',
                background: sel===t.id?t.color+'18':'transparent',
                borderLeft:`3px solid ${sel===t.id?t.color:'transparent'}`,
                transition:'all .15s'
              }}>
                <span style={{ fontSize:11.5, fontWeight:sel===t.id?700:400, color:sel===t.id?t.color:C.txt2 }}>{t.label}</span>
                {t.sublabel && <span style={{ fontSize:9, color:C.txt3, marginTop:1 }}>{t.sublabel}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Main: CADOC matrix */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
        <div style={{ marginBottom:16 }}>
          <h1 style={{ fontSize:18, fontWeight:800, color:C.txt, marginBottom:4 }}>💳 Meios de Pagamento — CADOCs Obrigatórios</h1>
          <p style={{ fontSize:12, color:C.txt3 }}>Selecione o tipo de instituição para ver quais CADOCs são obrigatórios, condicionais ou não aplicáveis.</p>
        </div>

        {/* Institution header */}
        <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, padding:'16px 20px', marginBottom:12, borderTop:`3px solid ${inst.color}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:800, color:inst.color, marginBottom:4 }}>{inst.label}</div>
              <div style={{ fontSize:12, color:C.txt3, lineHeight:1.6 }}>{data.desc}</div>
            </div>
            <div style={{ display:'flex', gap:14 }}>
              {([['obrig','SIM',C.grn],['cond','COND',C.amb],['nao','NAO',C.txt3],['dispensa','dispensa',C.blu]] as [string,string,string][]).map(([k,v,c])=>{
                const cnt = k==='dispensa' ? data.obrigatorios.filter(r=>r.dispensa?.pode).length : data.obrigatorios.filter(r=>r.obrig===v).length
                return (
                  <div key={k} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:900, color:c, fontFamily:'monospace' }}>{cnt}</div>
                    <div style={{ fontSize:9, color:C.txt3 }}>{k==='dispensa'?'c/ dispensa':k==='obrig'?'obrigatórios':k==='cond'?'condicionais':'não aplicáveis'}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* AI analysis bar */}
        <div style={{ background:inst.color+'12', border:`1px solid ${inst.color}40`, borderRadius:8, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:600, color:C.txt, flex:1 }}>✦ Análise regulatória gerada por IA para {inst.label}</span>
          {aiLoading[sel] ? (
            <div style={{ display:'flex', gap:4 }}>{[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:'50%', background:C.grn, animation:`ald 1.2s ${i*.2}s infinite` }}/>)}</div>
          ) : aiText[sel] ? (
            <button onClick={()=>gerarAI(sel)} style={{ fontSize:10, padding:'4px 10px', borderRadius:5, border:`1px solid ${inst.color}60`, background:'transparent', cursor:'pointer', color:inst.color, outline:'none', fontWeight:600 }}>↻ Regenerar</button>
          ) : (
            <button onClick={()=>gerarAI(sel)} style={{ fontSize:10, padding:'4px 10px', borderRadius:5, border:`1px solid ${inst.color}60`, background:inst.color, cursor:'pointer', color:'#fff', outline:'none', fontWeight:600 }}>✦ Gerar Análise IA</button>
          )}
        </div>
        {aiText[sel] && (
          <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:8, padding:'12px 14px', marginBottom:12, fontSize:11.5, color:C.txt, lineHeight:1.8 }}
            dangerouslySetInnerHTML={{__html:aiText[sel].replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/>
        )}

        {/* Obrigatórios */}
        <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, overflow:'hidden', marginBottom:12 }}>
          <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.brd}`, fontSize:11, fontWeight:700, color:C.txt, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:C.grn, display:'inline-block' }}/>
            Obrigatórios & Condicionais
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead><tr style={{ background:'#f9fafb' }}>
                {['CADOC','Documento','Periodicidade','Obrig.','Dispensa'].map(h=><th key={h} style={{ padding:'7px 12px', textAlign:'left', fontSize:9, fontWeight:600, color:C.txt3, letterSpacing:'.5px', textTransform:'uppercase', borderBottom:`1px solid ${C.brd}`, whiteSpace:'nowrap' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {data.obrigatorios.map((r,i)=>{
                  const oc = obrigColor(r.obrig)
                  return (
                    <tr key={r.code+i} style={{ borderTop:`1px solid #f5f5f5` }}>
                      <td style={{ padding:'9px 12px', fontFamily:'monospace', fontWeight:700, fontSize:12, color:C.cyn }}>{r.code}</td>
                      <td style={{ padding:'9px 12px' }}>
                        <div style={{ fontSize:11.5, fontWeight:600, color:C.txt }}>{r.nome}</div>
                        {r.nota && <div style={{ fontSize:9.5, color:C.txt3, marginTop:2 }}>{r.nota}</div>}
                      </td>
                      <td style={{ padding:'9px 12px', fontSize:10, fontFamily:'monospace', color:C.txt3, whiteSpace:'nowrap' }}>{r.per}</td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4, fontFamily:'monospace', background:oc.bg, color:oc.color, border:`1px solid ${oc.brd}` }}>{r.obrig}</span>
                      </td>
                      <td style={{ padding:'9px 12px' }}>
                        {r.dispensa ? (
                          <div>
                            <div style={{ fontSize:10, color:r.dispensa.pode?C.grn:C.red, fontWeight:600 }}>{r.dispensa.pode?'📋 Possível':'🚫 Não'}</div>
                            <div style={{ fontSize:9, color:C.txt3 }}>{r.dispensa.motivo}</div>
                          </div>
                        ) : <span style={{ fontSize:9, color:C.txt3 }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Não aplicáveis */}
        {data.nao_obrig.length > 0 && (
          <div style={{ background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, overflow:'hidden', marginBottom:12 }}>
            <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.brd}`, fontSize:11, fontWeight:700, color:C.txt3, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:C.txt3, display:'inline-block' }}/>
              Não Aplicáveis
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead><tr style={{ background:'#f9fafb' }}>
                {['CADOC','Documento','Periodicidade','Motivo'].map(h=><th key={h} style={{ padding:'6px 12px', textAlign:'left', fontSize:9, fontWeight:600, color:C.txt3, letterSpacing:'.5px', textTransform:'uppercase', borderBottom:`1px solid ${C.brd}` }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {data.nao_obrig.map((r,i)=>(
                  <tr key={r.code+i} style={{ borderTop:`1px solid #f5f5f5`, opacity:.6 }}>
                    <td style={{ padding:'7px 12px', fontFamily:'monospace', fontWeight:700, fontSize:11, color:C.txt3 }}>{r.code}</td>
                    <td style={{ padding:'7px 12px', fontSize:11, color:C.txt3 }}>{r.nome}</td>
                    <td style={{ padding:'7px 12px', fontSize:10, fontFamily:'monospace', color:C.txt3 }}>{r.per}</td>
                    <td style={{ padding:'7px 12px', fontSize:10, color:C.txt3 }}>{r.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notas */}
        <div style={{ padding:'10px 14px', background:'#fffbeb', border:`1px solid ${C.ambbrd}`, borderRadius:8, fontSize:10.5, color:C.amb, lineHeight:1.6 }}>
          ⚠ {data.notas}
        </div>
      </div>
      <style>{`@keyframes ald{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )
}
