'use client'
import { useState, useEffect } from 'react'

const C = { grn:'#0a7c5c',grnb:'rgba(10,124,92,.08)',grnbrd:'rgba(10,124,92,.2)',txt:'#0d1117',txt2:'#1e3a5f',txt3:'#5a6e8a',bg:'#f5f6f8',bg2:'#fff',bg3:'#eef0f3',brd:'#dde1e9',blu:'#1d5fcc',amb:'#b45309',red:'#c0392b' }

const INST_TIPOS = [
  'Banco Múltiplo','Banco Comercial','Banco de Investimento','Financeira',
  'Adquirente / Credenciador','Emissor de Moeda Eletrônica','IP - Iniciador de Pagamento',
  'SCD - Crédito Direto','IP - Adquirente','PSAV - Ativo Virtual','Subcredenciador','Outro'
]

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [cnpj, setCnpj] = useState('')
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('')
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
      setIspb(localStorage.getItem('bm_ispb') || '')
    }
  }, [])

  const save = () => {
    localStorage.setItem('bm_api_key', apiKey.trim())
    localStorage.setItem('bm_cnpj', cnpj.trim())
    localStorage.setItem('bm_nome', nome.trim())
    localStorage.setItem('bm_tipo', tipo)
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
        headers:{ 'Content-Type':'application/json','x-api-key':apiKey.trim(),'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true' },
        body:JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:50, messages:[{role:'user',content:'Responda apenas: OK'}] })
      })
      if (r.ok) { setTestResult({ok:true,msg:'✓ API Key válida — conexão com Anthropic estabelecida'}) }
      else { const e = await r.json().catch(()=>({})); setTestResult({ok:false,msg:`✗ Erro ${r.status}: ${e.error?.message||'Verifique a chave'}`}) }
    } catch(e:any) { setTestResult({ok:false,msg:'✗ Erro de rede: '+e.message}) }
    setTesting(false)
  }

  const S = {
    card: { background:C.bg2, border:`1px solid ${C.brd}`, borderRadius:10, overflow:'hidden', marginBottom:16 } as any,
    hdr: { padding:'12px 16px', borderBottom:`1px solid ${C.brd}`, background:'#f9fafb', display:'flex', alignItems:'center', gap:8 } as any,
    body: { padding:20 } as any,
    label: { display:'block', fontSize:12, fontWeight:600, color:C.txt2, marginBottom:5 } as any,
    input: { width:'100%', padding:'9px 12px', border:`1px solid ${C.brd}`, borderRadius:7, fontSize:13, outline:'none', fontFamily:'monospace', boxSizing:'border-box' as const, marginBottom:14, color:C.txt, background:'#fff' },
    select: { width:'100%', padding:'9px 12px', border:`1px solid ${C.brd}`, borderRadius:7, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const, marginBottom:14, color:C.txt, background:'#fff' },
    hint: { fontSize:10.5, color:C.txt3, marginTop:-10, marginBottom:14, lineHeight:1.5 } as any,
  }

  return (
    <div style={{ padding:'24px 28px', maxWidth:680, overflowY:'auto', height:'100%' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:18, fontWeight:800, color:C.txt, marginBottom:4 }}>🔧 Configurações</h1>
        <p style={{ fontSize:12, color:C.txt3 }}>Configure sua instituição, API key e preferências da plataforma.</p>
      </div>

      {/* API Key */}
      <div style={S.card}>
        <div style={S.hdr}>
          <span style={{ fontSize:14 }}>🤖</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.txt }}>Anthropic API — Assistente IA</div>
            <div style={{ fontSize:10, color:C.txt3 }}>Habilita análise de normas, chat regulatório e análise de CADOCs com IA</div>
          </div>
        </div>
        <div style={S.body}>
          <label style={S.label}>API Key (Anthropic)</label>
          <div style={{ position:'relative', marginBottom:6 }}>
            <input type={showKey?'text':'password'} value={apiKey} onChange={e=>setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..." style={{ ...S.input, marginBottom:0, paddingRight:80 }} />
            <button onClick={()=>setShowKey(!showKey)} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:11, color:C.txt3, fontFamily:'monospace' }}>
              {showKey?'ocultar':'mostrar'}
            </button>
          </div>
          <p style={{ ...S.hint, marginTop:6 }}>Obtenha em <a href="https://console.anthropic.com" target="_blank" style={{ color:C.blu }}>console.anthropic.com</a> → API Keys. Armazenada apenas no seu navegador (localStorage).</p>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
            <button onClick={testApi} disabled={testing} style={{ padding:'7px 16px', borderRadius:7, border:`1px solid ${C.brd}`, background:'#f9fafb', cursor:'pointer', fontSize:12, fontWeight:600, color:C.txt2, outline:'none' }}>
              {testing ? '⏳ Testando…' : '⚡ Testar Conexão'}
            </button>
            {testResult && <span style={{ fontSize:11, color:testResult.ok?C.grn:C.red, fontFamily:'monospace' }}>{testResult.msg}</span>}
          </div>
        </div>
      </div>

      {/* IF Config */}
      <div style={S.card}>
        <div style={S.hdr}>
          <span style={{ fontSize:14 }}>🏦</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.txt }}>Dados da Instituição Financeira</div>
            <div style={{ fontSize:10, color:C.txt3 }}>Usados nos templates de CADOC e no Assistente IA</div>
          </div>
        </div>
        <div style={S.body}>
          <label style={S.label}>Razão Social</label>
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="BANCO EXEMPLO S.A." style={S.input}/>

          <label style={S.label}>CNPJ (8 dígitos ISPB / raiz)</label>
          <input value={cnpj} onChange={e=>setCnpj(e.target.value.replace(/\D/g,'').slice(0,8))} placeholder="12345678" style={S.input}/>
          <p style={S.hint}>Apenas os 8 primeiros dígitos (raiz do CNPJ / ISPB)</p>

          <label style={S.label}>ISPB (se diferente do CNPJ raiz)</label>
          <input value={ispb} onChange={e=>setIspb(e.target.value.replace(/\D/g,'').slice(0,8))} placeholder="12345678" style={S.input}/>

          <label style={S.label}>Tipo de Instituição</label>
          <select value={tipo} onChange={e=>setTipo(e.target.value)} style={S.select}>
            <option value="">Selecione o tipo…</option>
            {INST_TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <p style={S.hint}>Determina quais CADOCs são obrigatórios na aba Meios de Pagamento</p>
        </div>
      </div>

      {/* About */}
      <div style={S.card}>
        <div style={S.hdr}>
          <span style={{ fontSize:14 }}>ℹ️</span>
          <div style={{ fontSize:13, fontWeight:700, color:C.txt }}>Sobre o BACEN Monitor</div>
        </div>
        <div style={{ ...S.body, fontSize:12, color:C.txt3, lineHeight:1.8 }}>
          <strong style={{ color:C.txt }}>BACEN Monitor v2.0 SaaS</strong> — Plataforma RegTech para conformidade com o Banco Central do Brasil.<br/>
          Módulos: Feed de Normas · CADOCs · Entregas · Meios de Pagamento · Assistente IA<br/>
          Stack: Next.js 14 · Supabase · Vercel · Anthropic Claude<br/>
          <a href="https://www.bcb.gov.br" target="_blank" style={{ color:C.blu }}>bcb.gov.br</a> ·{' '}
          <a href="https://console.anthropic.com" target="_blank" style={{ color:C.blu }}>console.anthropic.com</a>
        </div>
      </div>

      <button onClick={save} style={{ padding:'11px 28px', borderRadius:8, border:'none', background:C.grn, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', outline:'none', display:'flex', alignItems:'center', gap:8 }}>
        {saved ? '✓ Salvo!' : '💾 Salvar Configurações'}
      </button>
    </div>
  )
}
