'use client'
import { useState } from 'react'

type CadocCode = '3040'|'3044'|'3060'|'4010'|'6334'

const CADOCS=[
  {code:'3040' as CadocCode,label:'SCR Operações de Crédito',desc:'Carteira de crédito da IF',color:'#1a5f8a',per:'Mensal · D+5'},
  {code:'3044' as CadocCode,label:'SCR Eventos de Crédito',desc:'Pagamentos, concessões e cessões',color:'#9d174d',per:'Por evento · D+5'},
  {code:'3060' as CadocCode,label:'SCR Taxas de Juros',desc:'Percentis de taxas por modalidade',color:'#065f46',per:'Semanal · D+5'},
  {code:'4010' as CadocCode,label:'Balancete COSIF',desc:'Posições patrimoniais',color:'#92400e',per:'Mensal · D+9'},
  {code:'6334' as CadocCode,label:'Cartões Credenciadores',desc:'10 arquivos TXT posicionais',color:'#1e40af',per:'Trimestral'},
]

const today=()=>new Date().toISOString().substring(0,10)
const lastMonth=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),0).toISOString().substring(0,10)}

const TEMPLATES:Record<CadocCode,object>={
  '3044':{cnpjIF:'17887874',dataHoraRemessa:new Date().toISOString().replace('T',' ').substring(0,19),envia3050:'N',operacoes:[
    {acao:1,ipoc:'1788787402112620317C0001',saldoDevedor:45000,dataSaldoDevedor:today(),atraso:'N',pagamentos:[{acao:1,data:today(),valor:5000}]},
    {acao:1,ipoc:'1788787402112620317C0002',saldoDevedor:80000,dataSaldoDevedor:today(),atraso:'N',concessoes:[{acao:1,data:today(),valor:80000}]},
    {acao:2,ipoc:'1788787402112620317C9999'},
  ]},
  '3040':{cabecalho:{CNPJ:'12345678',DtBase:lastMonth(),MetodApPE:'S',TotalCli:1},clientes:[{Cd:'12345678901',operacoes:[{IPOC:'1234567802112620117C0001',Mod:'0202',NatuOp:'01',ClassOp:'A',VlrContr:50000,vencimentos:[{Cd:'110',Val:30000},{Cd:'120',Val:20000}]}]}]},
  '3060':{cnpj:'12345678',dataBase:lastMonth(),percentil25:18.5,percentil50:22.3,percentil75:28.7,percentil100:45.2},
  '4010':{cabecalho:{cnpj:'12345678',dataBase:lastMonth(),tpArq:'M'},contas:[{codigoConta:'310000000',saldo:125000000},{codigoConta:'311000000',saldo:45000000},{codigoConta:'312000000',saldo:30000000}]},
  '6334':{database:{dataBase:'202503',ispb:'17887874',razaoSocial:'BANCO EXEMPLO SA'},conccred:[{cnpjCredenciadora:'17887874000100',dataBase:'202503',qtdEstabelecimentos:1250}]},
}

function LiveBar({json,cadoc}:{json:string,cadoc:CadocCode}){
  if(!json.trim())return<div style={{padding:'6px 12px',background:'#f8fafc',border:'1px solid #334155',borderTop:'none',borderRadius:'0 0 6px 6px',fontSize:11,color:'#64748b',fontFamily:'monospace'}}>Aguardando entrada JSON…</div>
  let obj:any,err=''
  try{obj=JSON.parse(json)}catch(e:any){err=e.message}
  if(err)return<div style={{padding:'6px 12px',background:'#fef2f2',border:'1px solid #ef4444',borderTop:'none',borderRadius:'0 0 6px 6px',fontSize:11,color:'#991b1b',fontFamily:'monospace'}}>✗ JSON inválido — {err.substring(0,80)}</div>
  const errs:string[]=[]
  if(cadoc==='3044'){if(!obj.cnpjIF)errs.push('cnpjIF ausente');if(!obj.dataHoraRemessa)errs.push('dataHoraRemessa ausente');if(!Array.isArray(obj.operacoes)||!obj.operacoes.length)errs.push('operacoes vazio')}
  else if(cadoc==='3040'){if(!obj.cabecalho?.CNPJ)errs.push('cabecalho.CNPJ ausente');if(!Array.isArray(obj.clientes))errs.push('clientes deve ser array')}
  else if(cadoc==='4010'){if(!obj.cabecalho?.cnpj)errs.push('cabecalho.cnpj ausente');if(!Array.isArray(obj.contas))errs.push('contas deve ser array')}
  else if(cadoc==='3060'){if(!obj.cnpj)errs.push('cnpj ausente');if(obj.percentil25===undefined)errs.push('percentil25 ausente')}
  const kb=(new TextEncoder().encode(json).length/1024).toFixed(1)
  if(errs.length)return<div style={{padding:'6px 12px',background:'#fffbeb',border:'1px solid #f59e0b',borderTop:'none',borderRadius:'0 0 6px 6px',fontSize:11,color:'#92400e',fontFamily:'monospace'}}>⚠ {errs.length} problema(s) — {errs[0]}{errs.length>1?` +${errs.length-1}`:''} · {kb} KB</div>
  const sum=cadoc==='3044'?`${obj.operacoes?.length??0} operações · CNPJ ${obj.cnpjIF??'?'}`:cadoc==='3040'?`${obj.clientes?.length??0} cliente(s) · ${obj.clientes?.reduce((s:number,c:any)=>s+(c.operacoes?.length??0),0)} op(s)`:cadoc==='4010'?`${obj.contas?.length??0} conta(s) COSIF`:cadoc==='3060'?`p25=${obj.percentil25} p50=${obj.percentil50}`:' Estrutura OK'
  return<div style={{padding:'6px 12px',background:'#f0fdf4',border:'1px solid #22c55e',borderTop:'none',borderRadius:'0 0 6px 6px',fontSize:11,color:'#166534',fontFamily:'monospace'}}>✓ JSON válido — {sum} · {kb} KB</div>
}

export default function CadocsPage(){
  const [sel,setSel]=useState<CadocCode>('3044')
  const [json,setJson]=useState(JSON.stringify(TEMPLATES['3044'],null,2))
  const [loading,setLoading]=useState(false)
  const [step,setStep]=useState(1)
  const [result,setResult]=useState<any>(null)
  const [error,setError]=useState('')
  const [showDetail,setShowDetail]=useState(false)

  const cadoc=CADOCS.find(c=>c.code===sel)!

  const selectCadoc=(code:CadocCode)=>{setSel(code);setJson(JSON.stringify(TEMPLATES[code],null,2));setStep(1);setResult(null);setError('')}

  const generate=async()=>{
    setLoading(true);setError('');setStep(2)
    try{
      const obj=JSON.parse(json)
      const res=await fetch('/api/cadoc/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cadoc:sel,input:obj})})
      const data=await res.json()
      if(!res.ok){setError(data.message||data.error||'Erro na geração');setStep(1)}
      else{setResult(data);setStep(3)}
    }catch(e:any){setError('JSON inválido: '+e.message);setStep(1)}
    setLoading(false)
  }

  const download=()=>{
    const clean=JSON.parse(json)
    if(Array.isArray(clean.operacoes))clean.operacoes.forEach((o:any)=>delete o._comentario)
    const blob=new Blob([JSON.stringify(clean,null,2)],{type:'application/json'})
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=result?.filename??`cadoc${sel}.json`;a.click();setStep(4)
  }

  const stColor=result?.result==='aprovado'?'#22c55e':result?.result==='com_alertas'?'#f59e0b':'#ef4444'
  const stLabel=result?.result==='aprovado'?'✓ APROVADO':result?.result==='com_alertas'?'⚠ COM ALERTAS':'✗ REPROVADO'

  const steps=[
    {n:1,title:'Entrada JSON',desc:'Cole ou edite o JSON'},
    {n:2,title:'Geração & Validação',desc:'Aplica regras BCB'},
    {n:3,title:'Resultado',desc:'Erros, avisos e arquivo'},
    {n:4,title:'Download',desc:'Pronto para o STA'},
  ]

  return(
    <div style={{padding:'28px 32px',maxWidth:1100}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:800,color:'#0a0f1e',marginBottom:4}}>CADOCs — Geração & Validação</h1>
        <p style={{fontSize:13,color:'#6b7280'}}>Gere arquivos no leiaute BCB, valide com as regras de crítica e exporte para o STA.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:20}}>
        {CADOCS.map(c=>(
          <button key={c.code} onClick={()=>selectCadoc(c.code)} style={{padding:'10px 8px',borderRadius:8,cursor:'pointer',textAlign:'left',border:`2px solid ${sel===c.code?c.color:'#e2e8f0'}`,background:sel===c.code?c.color+'12':'#fff',transition:'all .15s'}}>
            <div style={{fontSize:11,fontWeight:800,color:sel===c.code?c.color:'#0a0f1e',fontFamily:'monospace',marginBottom:3}}>{c.code}</div>
            <div style={{fontSize:10,color:'#6b7280',lineHeight:1.3}}>{c.desc}</div>
            <div style={{fontSize:9,color:sel===c.code?c.color:'#94a3b8',marginTop:4,fontFamily:'monospace'}}>{c.per}</div>
          </button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'190px 1fr',gap:20}}>
        <div>
          {steps.map((s,i)=>{
            const active=step===s.n&&loading?'active':step>s.n?'done':step===s.n?'current':'idle'
            const col=active==='done'?'#22c55e':active==='active'||active==='current'?cadoc.color:'#cbd5e1'
            return(
              <div key={s.n} style={{display:'flex',gap:10,marginBottom:16}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{width:26,height:26,borderRadius:'50%',background:active==='idle'?'#f1f5f9':col,color:active==='idle'?'#94a3b8':'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0}}>
                    {active==='done'?'✓':s.n}
                  </div>
                  {i<steps.length-1&&<div style={{width:2,flex:1,minHeight:16,background:active==='done'?col:'#e2e8f0',marginTop:3}}/>}
                </div>
                <div style={{paddingTop:3}}>
                  <div style={{fontSize:12,fontWeight:700,color:active==='idle'?'#94a3b8':'#0a0f1e'}}>{s.title}</div>
                  <div style={{fontSize:10,color:'#94a3b8',lineHeight:1.4}}>{s.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden',marginBottom:12}}>
            <div style={{padding:'10px 14px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#f8fafc'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:10,fontFamily:'monospace',background:cadoc.color,color:'#fff',padding:'2px 8px',borderRadius:4,fontWeight:700}}>JSON API</span>
                <span style={{fontSize:12,fontWeight:600,color:'#0a0f1e'}}>Entrada de Dados — CADOC {sel}</span>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>{setJson(JSON.stringify(TEMPLATES[sel],null,2));setStep(1);setResult(null)}} style={{fontSize:11,padding:'4px 10px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',color:'#374151'}}>📋 Template</button>
                <button onClick={()=>{setJson('');setStep(1);setResult(null)}} style={{fontSize:11,padding:'4px 10px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',color:'#374151'}}>🗑 Limpar</button>
              </div>
            </div>
            <textarea value={json} onChange={e=>{setJson(e.target.value);setStep(1);setResult(null)}} spellCheck={false}
              style={{width:'100%',height:260,padding:'12px 14px',fontFamily:'monospace',fontSize:11.5,background:'#0f172a',color:'#e2e8f0',border:'none',outline:'none',resize:'vertical',boxSizing:'border-box',lineHeight:1.6}}/>
            <LiveBar json={json} cadoc={sel}/>
          </div>

          {error&&<div style={{padding:'10px 14px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,fontSize:12,color:'#991b1b',marginBottom:12}}>❌ {error}</div>}

          {result&&(
            <div style={{background:'#fff',border:`1px solid ${stColor}40`,borderRadius:10,overflow:'hidden',marginBottom:12}}>
              <div style={{padding:'10px 14px',background:stColor+'10',borderBottom:`1px solid ${stColor}30`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12,fontWeight:800,color:'#0a0f1e'}}>Resultado — CADOC {result.cadoc}</span>
                  <span style={{fontSize:10,fontFamily:'monospace',color:'#6b7280'}}>{result.filename}</span>
                </div>
                <span style={{fontSize:11,fontWeight:800,color:stColor,padding:'3px 10px',background:stColor+'15',borderRadius:5}}>{stLabel}</span>
              </div>
              <div style={{padding:'12px 16px',display:'flex',gap:24,flexWrap:'wrap',alignItems:'center'}}>
                {([['Operações',result.nOperacoes,'#0891b2'],['Erros',result.nErros,result.nErros>0?'#ef4444':'#22c55e'],['Avisos',result.nAvisos,result.nAvisos>0?'#f59e0b':'#22c55e']] as [string,number,string][]).map(([l,v,c])=>(
                  <div key={l} style={{textAlign:'center',minWidth:56}}>
                    <div style={{fontSize:20,fontWeight:900,color:c,fontFamily:'monospace'}}>{v}</div>
                    <div style={{fontSize:10,color:'#6b7280'}}>{l}</div>
                  </div>
                ))}
                {(result.nErros>0||result.nAvisos>0)&&<button onClick={()=>setShowDetail(!showDetail)} style={{marginLeft:'auto',fontSize:11,padding:'4px 12px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',color:'#374151'}}>{showDetail?'▲ Ocultar':'▼ Detalhes'}</button>}
              </div>
              {showDetail&&(result.validation?.erros?.length>0||result.validation?.avisos?.length>0)&&(
                <div style={{borderTop:'1px solid #f1f5f9',padding:'8px 16px',maxHeight:180,overflowY:'auto'}}>
                  {[...(result.validation.erros||[]).map((e:any)=>({...e,_t:'erro'})),...(result.validation.avisos||[]).map((a:any)=>({...a,_t:'aviso'}))].map((item,i)=>(
                    <div key={i} style={{display:'grid',gridTemplateColumns:'52px 1fr',gap:8,padding:'4px 0',fontSize:11,borderBottom:'1px solid #f8fafc'}}>
                      <span style={{fontFamily:'monospace',fontWeight:700,color:item._t==='erro'?'#ef4444':'#f59e0b'}}>{item.cod}</span>
                      <span style={{color:'#374151'}}>{item.op?<strong>{item.op}: </strong>:null}{item.msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <button onClick={generate} disabled={loading||!json.trim()} style={{padding:'10px 24px',borderRadius:8,border:'none',cursor:loading?'not-allowed':'pointer',background:loading?'#94a3b8':cadoc.color,color:'#fff',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
              {loading?<><span style={{display:'inline-block',width:14,height:14,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>Processando…</>:'⚙ Gerar & Validar'}
            </button>
            {result&&step>=3&&<button onClick={download} style={{padding:'10px 24px',borderRadius:8,border:'1px solid #22c55e',cursor:'pointer',background:'#f0fdf4',color:'#166534',fontSize:13,fontWeight:700}}>⬇ Baixar {sel==='3044'?'JSON':'XML'}</button>}
            {step===4&&<span style={{fontSize:12,color:'#22c55e',fontWeight:600}}>✓ Arquivo exportado</span>}
          </div>

          <div style={{marginTop:14,padding:'10px 14px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,fontSize:11,color:'#64748b',lineHeight:1.7}}>
            <strong style={{color:'#0a0f1e'}}>CADOC {sel}</strong> — {cadoc.label} · {cadoc.per} ·{' '}
            {sel==='3044'&&'Regras T01–T13 + B01 · Res. CMN 5.037/2022 · STA (ASCR344)'}
            {sel==='3040'&&'Regras MV01–MV18 + M + R + T · Res. CMN 3.658/2008'}
            {sel==='4010'&&'Plano COSIF · Balancete patrimonial'}
            {sel==='3060'&&'Circular BCB 4.019/2020 · Taxas por modalidade'}
            {sel==='6334'&&'Res. BCB 150/2021 (ASPB034) · 10 arquivos TXT · ISO-8859-1'}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
