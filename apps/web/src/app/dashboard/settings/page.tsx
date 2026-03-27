'use client'
import { useState, useEffect } from 'react'

const C = {
  grn:'#0a7c5c',grnb:'rgba(10,124,92,.08)',grnbrd:'rgba(10,124,92,.2)',
  txt:'#0d1117',txt2:'#1e3a5f',txt3:'#5a6e8a',
  bg:'#f5f6f8',bg2:'#fff',bg3:'#eef0f3',brd:'#dde1e9',
  blu:'#1d5fcc',blub:'rgba(29,95,204,.08)',
  amb:'#b45309',ambb:'rgba(180,83,9,.08)',ambbrd:'rgba(180,83,9,.2)',
  red:'#c0392b',
  cyn:'#0e7490',cynb:'rgba(14,116,144,.06)',
}

type CadocRow = {cod:string,nome:string,per:string,obs?:string}
type CadocCond = {cod:string,nome:string,per:string,cond:string}

const CADOC_BY_INST: Record<string, {info:string, obrig:CadocRow[], cond:CadocCond[]}> = {
  banco_multiplo: {
    info: 'Banco múltiplo com carteiras comercial, crédito, câmbio e investimento. Maior abrangência — todos os módulos SCR, COSIF e Basileia III.',
    obrig: [
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal'},
      {cod:'3040',nome:'SCR Dados Individualizados de Crédito',per:'Mensal'},
      {cod:'3044',nome:'SCR Eventos de Crédito',per:'Por evento'},
      {cod:'3060',nome:'SCR Taxas de Juros',per:'Semanal'},
      {cod:'2010',nome:'Patrimônio de Referência (PR)',per:'Mensal'},
      {cod:'2020',nome:'Adequação do Capital — RWA',per:'Mensal'},
      {cod:'2090',nome:'ICAAP e Testes de Estresse',per:'Anual'},
      {cod:'5011',nome:'Participações Societárias',per:'Trimestral'},
      {cod:'5021',nome:'UNICAD — Correspondentes Bancários',per:'Mensal'},
      {cod:'9010',nome:'Demonstrações Financeiras Individuais',per:'Semestral'},
    ],
    cond: [
      {cod:'6209',nome:'Pagamentos de Varejo e Canais',per:'Trimestral',cond:'Se operar canais de pagamento (Pix, TED, DOC)'},
      {cod:'6308',nome:'Cartões de Pagamento — Emissores',per:'Trimestral',cond:'Se emitir cartões de crédito ou débito'},
      {cod:'4034/4035',nome:'Estatísticas Bancárias Internacionais',per:'Trimestral',cond:'Se possuir ativos ou passivos internacionais'},
      {cod:'C212',nome:'Ativos Virtuais',per:'Mensal',cond:'Se intermediar ativos digitais (cripto)'},
    ]
  },
  banco_comercial: {
    info: 'Banco comercial: capta depósitos à vista, concede crédito. Obrigações similares ao banco múltiplo sem carteiras adicionais.',
    obrig: [
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal'},
      {cod:'3040',nome:'SCR Dados Individualizados de Crédito',per:'Mensal'},
      {cod:'3044',nome:'SCR Eventos de Crédito',per:'Por evento'},
      {cod:'3060',nome:'SCR Taxas de Juros',per:'Semanal'},
      {cod:'2010',nome:'Patrimônio de Referência (PR)',per:'Mensal'},
      {cod:'2020',nome:'Adequação do Capital — RWA',per:'Mensal'},
      {cod:'9010',nome:'Demonstrações Financeiras Individuais',per:'Semestral'},
    ],
    cond: [
      {cod:'6308',nome:'Cartões de Pagamento — Emissores',per:'Trimestral',cond:'Se emitir cartões'},
      {cod:'5021',nome:'UNICAD — Correspondentes',per:'Mensal',cond:'Se contratar correspondentes bancários'},
    ]
  },
  financeira: {
    info: 'SCFI: sociedade de crédito, financiamento e investimento. Não capta depósitos à vista. Foco em SCR e capital.',
    obrig: [
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal'},
      {cod:'3040',nome:'SCR Dados Individualizados de Crédito',per:'Mensal'},
      {cod:'3044',nome:'SCR Eventos de Crédito',per:'Por evento'},
      {cod:'3060',nome:'SCR Taxas de Juros',per:'Semanal'},
      {cod:'2010',nome:'Patrimônio de Referência (PR)',per:'Mensal'},
    ],
    cond: [
      {cod:'6308',nome:'Cartões de Pagamento — Emissores',per:'Trimestral',cond:'Se emitir cartões de crédito'},
    ]
  },
  scd: {
    info: 'SCD: fintech de crédito com recursos próprios. Capital mínimo R$1M. Basileia simplificado. Exigência integral de SCR.',
    obrig: [
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal'},
      {cod:'3040',nome:'SCR Dados Individualizados de Crédito',per:'Mensal'},
      {cod:'3044',nome:'SCR Eventos de Crédito',per:'Por evento'},
      {cod:'3060',nome:'SCR Taxas de Juros',per:'Semanal'},
      {cod:'2010',nome:'Patrimônio de Referência (PR)',per:'Mensal'},
    ],
    cond: [
      {cod:'3050',nome:'Estatísticas Agregadas de Crédito',per:'Mensal',cond:'Se operar arrendamento mercantil'},
    ]
  },
  emissor_pre: {
    info: 'Emissor de moeda eletrônica: conta pré-paga, cartão pré-pago, carteira digital. Reporte trimestral de contas de pagamento.',
    obrig: [
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal'},
      {cod:'2055',nome:'Contas de Pagamento — Volume e Saldo',per:'Trimestral'},
      {cod:'6209',nome:'Pagamentos de Varejo e Canais',per:'Trimestral'},
    ],
    cond: [
      {cod:'3040',nome:'SCR Dados de Crédito',per:'Mensal',cond:'Se conceder crédito (ex: limite rotativo)'},
      {cod:'3044',nome:'SCR Eventos de Crédito',per:'Por evento',cond:'Se conceder crédito'},
      {cod:'2050',nome:'Arranjos de Pagamento',per:'Trimestral',cond:'Se participar de arranjo regulado BCB'},
    ]
  },
  adquirente: {
    info: 'Credenciador/Adquirente: habilitação de ECs, processamento e liquidação de transações com cartões.',
    obrig: [
      {cod:'6334',nome:'Cartões Credenciadores ASPB034 (10 TXTs)',per:'Trimestral'},
      {cod:'2050',nome:'Arranjos de Pagamento',per:'Trimestral'},
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal',obs:'Para credenciadores com autorização BCB'},
    ],
    cond: [
      {cod:'2055',nome:'Contas de Pagamento',per:'Trimestral',cond:'Se operar contas de pagamento pré-pagas'},
      {cod:'6308',nome:'Cartões — Emissores',per:'Trimestral',cond:'Se também emitir cartões'},
    ]
  },
  subcreden: {
    info: 'Subcredenciador: habilita lojistas em nome de credenciadores. Res. BCB 522/2025 exige adequação até dez/2026.',
    obrig: [
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal'},
      {cod:'2050',nome:'Arranjos de Pagamento',per:'Trimestral'},
    ],
    cond: [
      {cod:'6334',nome:'Cartões Credenciadores ASPB034',per:'Trimestral',cond:'Volume acima do limiar BCB (Res. 522/2025)'},
    ]
  },
  itp: {
    info: 'ITP: Iniciador de Transação de Pagamento via Open Finance. Não detém fundos. Reporte simplificado.',
    obrig: [
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal'},
      {cod:'7011',nome:'Open Finance — Dados Cadastrais',per:'Mensal'},
    ],
    cond: [
      {cod:'2055',nome:'Contas de Pagamento',per:'Trimestral',cond:'Se também emitir conta pré-paga'},
    ]
  },
  cooperativa: {
    info: 'Cooperativa de crédito: serve associados, capta depósitos e concede crédito. Regulação específica BCB.',
    obrig: [
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal'},
      {cod:'3040',nome:'SCR Dados Individualizados de Crédito',per:'Mensal'},
      {cod:'3044',nome:'SCR Eventos de Crédito',per:'Por evento'},
      {cod:'5300',nome:'Relacionamentos de Cooperativa',per:'Trimestral'},
      {cod:'7110',nome:'Programação Anual Auditoria Cooperativa',per:'Anual'},
      {cod:'7120',nome:'Relatório Geral Auditoria Cooperativa',per:'Anual'},
    ],
    cond: [
      {cod:'9010',nome:'Demonstrações Financeiras',per:'Semestral',cond:'Cooperativas de maior porte (S1/S2)'},
    ]
  },
  psav: {
    info: 'PSAV: exchange, custodiante ou intermediária de ativos virtuais. Autorização BCB obrigatória desde set/2025 (Res. 519-521/2023 e 396/2025).',
    obrig: [
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal'},
      {cod:'C212',nome:'Registro de Ativos Virtuais',per:'Mensal'},
    ],
    cond: [
      {cod:'2010',nome:'Patrimônio de Referência',per:'Mensal',cond:'Se sujeito ao requerimento de capital (Res. 396/2025)'},
    ]
  },
  consorcio: {
    info: 'Administradora de consórcios: gestão de grupos de compra coletiva. Regulação específica BCB.',
    obrig: [
      {cod:'4010',nome:'Balancete COSIF',per:'Mensal'},
      {cod:'2080',nome:'Posição de Cotas e Grupos de Consórcios',per:'Mensal'},
    ],
    cond: []
  },
}

const INST_TIPOS = [
  {id:'banco_multiplo',l:'Banco Múltiplo',g:'Bancos'},
  {id:'banco_comercial',l:'Banco Comercial',g:'Bancos'},
  {id:'financeira',l:'Financeira / SCFI',g:'Bancos'},
  {id:'cooperativa',l:'Cooperativa de Crédito',g:'Bancos'},
  {id:'scd',l:'SCD — Crédito Direto',g:'Fintechs'},
  {id:'emissor_pre',l:'Emissor de Moeda Eletrônica',g:'Pagamentos'},
  {id:'adquirente',l:'Adquirente / Credenciador',g:'Pagamentos'},
  {id:'subcreden',l:'Subcredenciador',g:'Pagamentos'},
  {id:'itp',l:'Iniciador (ITP)',g:'Pagamentos'},
  {id:'psav',l:'PSAV — Ativos Virtuais',g:'Outros'},
  {id:'consorcio',l:'Administradora de Consórcios',g:'Outros'},
]

const SEGMENTOS = [
  {id:'S1',l:'S1 — Porte Grande (PR > R$100bi ou atividade internacional)'},
  {id:'S2',l:'S2 — Porte Médio-Grande (PR R$1bi–R$100bi)'},
  {id:'S3',l:'S3 — Porte Médio (PR R$100mi–R$1bi)'},
  {id:'S4',l:'S4 — Porte Pequeno (PR R$1mi–R$100mi)'},
  {id:'S5',l:'S5 — Porte Micro (PR < R$1mi ou regime simplificado)'},
  {id:'N',l:'Não sujeito a segmento prudencial'},
]

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [cnpj, setCnpj] = useState('')
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('')
  const [segmento, setSegmento] = useState('')
  const [ispb, setIspb] = useState('')
  const [saved, setSaved] = useState(false)
  const [testResult, setTestResult] = useState<{ok:boolean,msg:string}|null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiKey(localStorage.getItem('bm_api_key') || '')
      setCnpj(localStorage.getItem('bm_cnpj') || '')
      setNome(localStorage.getItem('bm_nome') || '')
      setTipo(localStorage.getItem('bm_tipo') || '')
      setSegmento(localStorage.getItem('bm_segmento') || '')
      setIspb(localStorage.getItem('bm_ispb') || '')
    }
  }, [])

  const save = () => {
    localStorage.setItem('bm_api_key', apiKey.trim())
    localStorage.setItem('bm_cnpj', cnpj.trim())
    localStorage.setItem('bm_nome', nome.trim())
    localStorage.setItem('bm_tipo', tipo)
    localStorage.setItem('bm_segmento', segmento)
    localStorage.setItem('bm_ispb', ispb.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const testApi = async () => {
    if (!apiKey.trim()) { setTestResult({ok:false,msg:'Insira a API key antes de testar'}); return }
    setTesting(true); setTestResult(null)
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':apiKey.trim(),'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:20,messages:[{role:'user',content:'Responda OK'}]})
      })
      if (r.ok) setTestResult({ok:true,msg:'✓ API Key válida — conexão com Anthropic estabelecida'})
      else { const e = await r.json().catch(()=>({})); setTestResult({ok:false,msg:'✗ Erro '+r.status+': '+(e.error?.message||'Verifique a chave')}) }
    } catch(e:any) { setTestResult({ok:false,msg:'✗ Erro de rede: '+e.message}) }
    setTesting(false)
  }

  const cadocData = tipo ? CADOC_BY_INST[tipo] : null
  const instLabel = INST_TIPOS.find(i=>i.id===tipo)?.l || ''
  const segLabel = SEGMENTOS.find(s=>s.id===segmento)?.l || ''

  const inputSt: React.CSSProperties = {
    width:'100%',padding:'8px 12px',border:`1px solid ${C.brd}`,borderRadius:7,
    fontSize:13,outline:'none',boxSizing:'border-box',marginBottom:14,color:C.txt,background:'#fff'
  }
  const labelSt: React.CSSProperties = {display:'block',fontSize:12,fontWeight:600,color:C.txt2,marginBottom:5}
  const hintSt: React.CSSProperties = {fontSize:10.5,color:C.txt3,marginTop:-10,marginBottom:14,lineHeight:1.5}

  return (
    <div style={{padding:'24px 28px',height:'100%',overflowY:'auto',background:C.bg}}>
      <div style={{maxWidth:760}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:18,fontWeight:800,color:C.txt,marginBottom:4}}>🔧 Configurações</h1>
          <p style={{fontSize:12,color:C.txt3}}>Configure sua instituição, API key e preferências. Após salvar, os CADOCs obrigatórios aparecem automaticamente com base no tipo de IF.</p>
        </div>

        {/* ── API Key ── */}
        <div style={{background:C.bg2,border:`1px solid ${C.brd}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
          <div style={{padding:'11px 16px',borderBottom:`1px solid ${C.brd}`,background:'#f9fafb',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:14}}>🤖</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.txt}}>Anthropic API — Assistente IA</div>
              <div style={{fontSize:10,color:C.txt3}}>Habilita análise de normas, chat regulatório e análise de CADOCs com IA</div>
            </div>
          </div>
          <div style={{padding:20}}>
            <label style={labelSt}>API Key (Anthropic)</label>
            <div style={{position:'relative',marginBottom:6}}>
              <input type={showKey?'text':'password'} value={apiKey} onChange={e=>setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                style={{...inputSt,marginBottom:0,paddingRight:80,fontFamily:'monospace'}}/>
              <button onClick={()=>setShowKey(!showKey)} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:10.5,color:C.txt3,fontFamily:'monospace',outline:'none'}}>
                {showKey?'ocultar':'mostrar'}
              </button>
            </div>
            <div style={hintSt}>
              Obtenha em{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{color:C.blu}}>console.anthropic.com</a>
              {' '}→ API Keys. Armazenada no navegador (localStorage).
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',marginTop:4}}>
              <button onClick={testApi} disabled={testing} style={{padding:'7px 16px',borderRadius:7,border:`1px solid ${C.brd}`,background:'#f9fafb',cursor:'pointer',fontSize:12,fontWeight:600,color:C.txt2,outline:'none'}}>
                {testing?'⏳ Testando…':'⚡ Testar Conexão'}
              </button>
              {testResult&&<span style={{fontSize:11,color:testResult.ok?C.grn:C.red,fontFamily:'monospace'}}>{testResult.msg}</span>}
            </div>
          </div>
        </div>

        {/* ── IF Config ── */}
        <div style={{background:C.bg2,border:`1px solid ${C.brd}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
          <div style={{padding:'11px 16px',borderBottom:`1px solid ${C.brd}`,background:'#f9fafb',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:14}}>🏦</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.txt}}>Dados da Instituição Financeira</div>
              <div style={{fontSize:10,color:C.txt3}}>Usado nos templates de CADOC, no Assistente IA e na determinação dos CADOCs obrigatórios</div>
            </div>
          </div>
          <div style={{padding:20}}>
            <label style={labelSt}>Razão Social</label>
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="BANCO EXEMPLO S.A." style={inputSt}/>

            <label style={labelSt}>CNPJ raiz (8 dígitos / ISPB)</label>
            <input value={cnpj} onChange={e=>setCnpj(e.target.value.replace(/\D/g,'').slice(0,8))} placeholder="12345678" style={{...inputSt,fontFamily:'monospace'}}/>
            <div style={hintSt}>Primeiros 8 dígitos do CNPJ (raiz) — também usado como ISPB nos CADOCs</div>

            <label style={labelSt}>ISPB (se diferente do CNPJ raiz)</label>
            <input value={ispb} onChange={e=>setIspb(e.target.value.replace(/\D/g,'').slice(0,8))} placeholder="12345678" style={{...inputSt,fontFamily:'monospace'}}/>

            <label style={labelSt}>Tipo de Instituição</label>
            <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...inputSt,fontFamily:'inherit'}}>
              <option value="">Selecione o tipo de instituição…</option>
              {['Bancos','Fintechs','Pagamentos','Outros'].map(g=>(
                <optgroup key={g} label={g}>
                  {INST_TIPOS.filter(i=>i.g===g).map(i=><option key={i.id} value={i.id}>{i.l}</option>)}
                </optgroup>
              ))}
            </select>
            <div style={hintSt}>Determina automaticamente os CADOCs obrigatórios (baseado no documento Cadocs_por_Instituição BCB)</div>

            <label style={labelSt}>Segmento Prudencial</label>
            <select value={segmento} onChange={e=>setSegmento(e.target.value)} style={{...inputSt,fontFamily:'inherit'}}>
              <option value="">Selecione o segmento prudencial…</option>
              {SEGMENTOS.map(s=><option key={s.id} value={s.id}>{s.l}</option>)}
            </select>
            <div style={hintSt}>O segmento prudencial (S1–S5) determina exigências adicionais de capital e relatórios</div>
          </div>
        </div>

        {/* ── CADOC Recommendations ── */}
        {cadocData && tipo && (
          <div style={{background:C.bg2,border:`1px solid rgba(10,124,92,.4)`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
            <div style={{padding:'11px 16px',borderBottom:`1px solid ${C.brd}`,background:C.grnb,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:14}}>⚙</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.txt}}>CADOCs Obrigatórios — {instLabel}</div>
                  {segmento&&<div style={{fontSize:10,color:C.txt3}}>{segLabel}</div>}
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <span style={{fontSize:10,fontFamily:'monospace',fontWeight:700,color:C.grn,background:'rgba(10,124,92,.1)',border:`1px solid ${C.grnbrd}`,padding:'2px 8px',borderRadius:4}}>{cadocData.obrig.length} OBRIGATÓRIOS</span>
                {cadocData.cond.length>0&&<span style={{fontSize:10,fontFamily:'monospace',fontWeight:700,color:C.amb,background:C.ambb,border:`1px solid ${C.ambbrd}`,padding:'2px 8px',borderRadius:4}}>{cadocData.cond.length} CONDICIONAIS</span>}
              </div>
            </div>
            <div style={{padding:'14px 16px'}}>
              <p style={{fontSize:11.5,color:C.txt3,lineHeight:1.6,marginBottom:14,padding:'8px 12px',background:C.bg3,borderRadius:6,border:`1px solid ${C.brd}`}}>{cadocData.info}</p>

              <div style={{fontSize:11,fontWeight:700,color:C.txt,marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:C.grn,display:'inline-block'}}/>
                Obrigatórios ({cadocData.obrig.length})
              </div>
              <div style={{overflowX:'auto',marginBottom:16,border:`1px solid ${C.brd}`,borderRadius:8,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr style={{background:'#f9fafb'}}>
                      {['CADOC','Documento','Periodicidade','Obs.'].map(h=>(
                        <th key={h} style={{padding:'7px 12px',textAlign:'left',fontSize:9,fontWeight:600,color:C.txt3,letterSpacing:'.5px',textTransform:'uppercase',borderBottom:`1px solid ${C.brd}`,whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cadocData.obrig.map((r,i)=>(
                      <tr key={r.cod+i} style={{borderTop:i>0?`1px solid #f5f5f5`:'none'}}>
                        <td style={{padding:'8px 12px',fontFamily:'monospace',fontWeight:800,fontSize:12,color:C.cyn}}>{r.cod}</td>
                        <td style={{padding:'8px 12px',fontSize:11.5,fontWeight:600,color:C.txt}}>{r.nome}</td>
                        <td style={{padding:'8px 12px',fontSize:10,fontFamily:'monospace',color:C.txt3,whiteSpace:'nowrap'}}>{r.per}</td>
                        <td style={{padding:'8px 12px',fontSize:10,color:C.txt3}}>{r.obs||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {cadocData.cond.length>0&&(
                <>
                  <div style={{fontSize:11,fontWeight:700,color:C.amb,marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:C.amb,display:'inline-block'}}/>
                    Condicionais ({cadocData.cond.length})
                  </div>
                  <div style={{overflowX:'auto',border:`1px solid ${C.brd}`,borderRadius:8,overflow:'hidden'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead>
                        <tr style={{background:'#fffbeb'}}>
                          {['CADOC','Documento','Periodicidade','Condição'].map(h=>(
                            <th key={h} style={{padding:'7px 12px',textAlign:'left',fontSize:9,fontWeight:600,color:C.txt3,letterSpacing:'.5px',textTransform:'uppercase',borderBottom:`1px solid ${C.brd}`,whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cadocData.cond.map((r,i)=>(
                          <tr key={r.cod+i} style={{borderTop:i>0?`1px solid #f5f5f5`:'none'}}>
                            <td style={{padding:'8px 12px',fontFamily:'monospace',fontWeight:800,fontSize:12,color:C.amb}}>{r.cod}</td>
                            <td style={{padding:'8px 12px',fontSize:11.5,color:C.txt2}}>{r.nome}</td>
                            <td style={{padding:'8px 12px',fontSize:10,fontFamily:'monospace',color:C.txt3,whiteSpace:'nowrap'}}>{r.per}</td>
                            <td style={{padding:'8px 12px',fontSize:10,color:C.txt3,fontStyle:'italic'}}>{r.cond}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div style={{marginTop:12,padding:'8px 12px',background:'#eff6ff',border:`1px solid rgba(29,95,204,.2)`,borderRadius:6,fontSize:10.5,color:C.blu}}>
                ℹ️ Estes CADOCs foram mapeados com base no documento <strong>Cadocs_por_Instituição.pdf</strong> do BCB. Consulte seu DPO ou área jurídica para confirmar obrigatoriedades específicas.
              </div>
            </div>
          </div>
        )}

        {/* ── About ── */}
        <div style={{background:C.bg2,border:`1px solid ${C.brd}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
          <div style={{padding:'11px 16px',borderBottom:`1px solid ${C.brd}`,background:'#f9fafb',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:14}}>ℹ️</span>
            <span style={{fontSize:13,fontWeight:700,color:C.txt}}>Sobre o BACEN Monitor</span>
          </div>
          <div style={{padding:20,fontSize:12,color:C.txt3,lineHeight:1.8}}>
            <strong style={{color:C.txt}}>BACEN Monitor v2.0 SaaS</strong> — Plataforma RegTech para conformidade com o Banco Central do Brasil.<br/>
            Módulos: Feed de Normas · Geração CADOC (315 regras BCB) · Entregas · Meios de Pagamento · Assistente IA<br/>
            Stack: Next.js 14 · Supabase · Vercel · Anthropic Claude Sonnet 4.6<br/>
            <a href="https://www.bcb.gov.br" target="_blank" rel="noreferrer" style={{color:C.blu}}>bcb.gov.br</a>{' · '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{color:C.blu}}>console.anthropic.com</a>
          </div>
        </div>

        <button onClick={save} style={{padding:'11px 28px',borderRadius:8,border:'none',background:C.grn,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',outline:'none',display:'flex',alignItems:'center',gap:8}}>
          {saved?'✓ Configurações Salvas!':'💾 Salvar Configurações'}
        </button>
        {saved&&<p style={{fontSize:11,color:C.grn,marginTop:8,fontWeight:600}}>✓ Configurações salvas. Os CADOCs obrigatórios foram atualizados em toda a plataforma.</p>}
      </div>
    </div>
  )
}
