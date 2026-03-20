import { NextRequest, NextResponse } from 'next/server'

type CadocCode = '3040'|'3044'|'3060'|'4010'|'6334'

interface ValItem { tipo:'erro'|'aviso'; cod:string; msg:string; op?:string }

function validate3044(obj:any):{erros:ValItem[],avisos:ValItem[],nOps:number}{
  const erros:ValItem[]=[],avisos:ValItem[]=[]
  const e=(cod:string,msg:string,op?:string)=>erros.push({tipo:'erro',cod,msg,op})
  const w=(cod:string,msg:string,op?:string)=>avisos.push({tipo:'aviso',cod,msg,op})
  if(!obj.cnpjIF)e('B01','cnpjIF ausente')
  if(!obj.dataHoraRemessa)e('B01','dataHoraRemessa ausente')
  if(!obj.envia3050)e('B01','envia3050 ausente (S ou N)')
  if(!Array.isArray(obj.operacoes)||!obj.operacoes.length){e('B01','operacoes deve ser array não vazio');return{erros,avisos,nOps:0}}
  const tsR=new Date((obj.dataHoraRemessa||'').replace(' ','T')+'Z')
  const cut=new Date();cut.setMonth(cut.getMonth()-24)
  for(const op of obj.operacoes){
    const ipoc=op.ipoc||'(sem IPOC)'
    if(op.acao===2){if(!op.ipoc)e('B01','ipoc obrigatório para acao=2',ipoc);continue}
    if(op.acao!==1){e('B01',`acao inválida: ${op.acao}`,ipoc);continue}
    if(!op.ipoc)e('B01','ipoc obrigatório',ipoc)
    if(op.saldoDevedor===undefined)e('B01','saldoDevedor obrigatório',ipoc)
    if(!op.dataSaldoDevedor)e('B01','dataSaldoDevedor obrigatório',ipoc)
    if(!op.atraso)e('B01','atraso obrigatório (S/N)',ipoc)
    const ds=new Date((op.dataSaldoDevedor||'')+'T00:00:00Z')
    if(ds>tsR)e('T01','dataSaldoDevedor posterior à remessa',ipoc)
    if(ds<cut)e('T11','dataSaldoDevedor anterior a 24 meses',ipoc)
    if(obj.envia3050==='N'&&op.class3050)e('T07','class3050 preenchido com envia3050=N',ipoc)
    if(obj.envia3050==='S'&&!op.class3050)e('T08','class3050 obrigatório quando envia3050=S',ipoc)
    const seenP=new Set<string>(),seenC=new Set<string>()
    for(const p of op.pagamentos||[]){
      const dp=new Date(p.data+'T00:00:00Z')
      if(dp>ds)e('T02','pagamento.data posterior a dataSaldoDevedor',ipoc)
      if(dp<cut)e('T12','pagamento.data anterior a 24 meses',ipoc)
      if(seenP.has(p.data))e('T05',`pagamento duplicado em ${p.data}`,ipoc)
      seenP.add(p.data)
    }
    for(const c of op.concessoes||[]){
      const dc=new Date(c.data+'T00:00:00Z')
      if(dc>ds)e('T03','concessao.data posterior a dataSaldoDevedor',ipoc)
      if(dc<cut)e('T13','concessao.data anterior a 24 meses',ipoc)
      if(seenC.has(c.data))e('T06',`concessao duplicada em ${c.data}`,ipoc)
      seenC.add(c.data)
    }
    const evts=(op.pagamentos?.length??0)+(op.concessoes?.length??0)+(op.cessoes?.length??0)+(op.aquisicoes?.length??0)
    if(!evts)w('W01','operação sem eventos',ipoc)
  }
  return{erros,avisos,nOps:obj.operacoes.length}
}

function validate3040(obj:any):{erros:ValItem[],avisos:ValItem[],nOps:number}{
  const erros:ValItem[]=[],avisos:ValItem[]=[]
  const e=(cod:string,msg:string)=>erros.push({tipo:'erro',cod,msg})
  const w=(cod:string,msg:string)=>avisos.push({tipo:'aviso',cod,msg})
  if(!obj.cabecalho)e('H01','cabecalho ausente')
  else{if(!obj.cabecalho.CNPJ)e('H02','CNPJ ausente');if(!obj.cabecalho.DtBase)e('H03','DtBase ausente');if(!obj.cabecalho.MetodApPE)e('H04','MetodApPE ausente')}
  if(!Array.isArray(obj.clientes)){e('C01','clientes deve ser array');return{erros,avisos,nOps:0}}
  if(!obj.clientes.length)w('C02','clientes vazio')
  let nOps=0
  obj.clientes.forEach((cli:any,ci:number)=>{
    if(!cli.Cd)e('C03',`clientes[${ci}].Cd ausente`)
    if(!Array.isArray(cli.operacoes)){e('C04',`clientes[${ci}].operacoes inválido`);return}
    nOps+=cli.operacoes.length
    cli.operacoes.forEach((op:any,oi:number)=>{
      if(!op.IPOC)e('O01',`clientes[${ci}].op[${oi}].IPOC ausente`)
      else if(op.IPOC.length!==24)e('O02',`IPOC deve ter 24 chars (tem ${op.IPOC.length})`)
      if(!op.Mod)e('O03',`clientes[${ci}].op[${oi}].Mod ausente`)
      if(op.VlrContr===undefined)e('O04',`clientes[${ci}].op[${oi}].VlrContr ausente`)
    })
  })
  return{erros,avisos,nOps}
}

function validate4010(obj:any):{erros:ValItem[],avisos:ValItem[],nOps:number}{
  const erros:ValItem[]=[],avisos:ValItem[]=[]
  const e=(cod:string,msg:string)=>erros.push({tipo:'erro',cod,msg})
  if(!obj.cabecalho)e('H01','cabecalho ausente')
  else{if(!obj.cabecalho.cnpj)e('H02','cnpj ausente');if(!obj.cabecalho.dataBase)e('H03','dataBase ausente')}
  if(!Array.isArray(obj.contas)){e('C01','contas deve ser array');return{erros,avisos,nOps:0}}
  obj.contas.forEach((c:any,i:number)=>{
    if(!c.codigoConta)e('C02',`contas[${i}].codigoConta ausente`)
    if(c.saldo===undefined)e('C03',`contas[${i}].saldo ausente`)
  })
  return{erros,avisos,nOps:obj.contas.length}
}

function validate3060(obj:any):{erros:ValItem[],avisos:ValItem[],nOps:number}{
  const erros:ValItem[]=[],avisos:ValItem[]=[]
  const e=(cod:string,msg:string)=>erros.push({tipo:'erro',cod,msg})
  if(!obj.cnpj)e('H01','cnpj ausente')
  if(!obj.dataBase)e('H02','dataBase ausente')
  ;['percentil25','percentil50','percentil75','percentil100'].forEach((p,i)=>{
    if(obj[p]===undefined)e(`P0${i+1}`,`${p} ausente`)
  })
  return{erros,avisos,nOps:1}
}

function validate6334(obj:any):{erros:ValItem[],avisos:ValItem[],nOps:number}{
  const erros:ValItem[]=[],avisos:ValItem[]=[]
  const e=(cod:string,msg:string)=>erros.push({tipo:'erro',cod,msg})
  for(const k of['database','conccred','desconto','intercam','lucrcred','ranking','infresta','infrterm','contatos','segmento'])
    if(!obj[k])e('SEC',`Seção "${k}" ausente`)
  if(!obj.database?.ispb)e('DB01','database.ispb ausente')
  if(!obj.database?.dataBase)e('DB02','database.dataBase ausente')
  return{erros,avisos,nOps:Array.isArray(obj.conccred)?obj.conccred.length:0}
}

const esc=(v:any)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

function gen3040xml(obj:any):string{
  const cab=obj.cabecalho||{}
  let x=`<?xml version="1.0" encoding="UTF-8"?>\n<Doc3040 versao="11">\n  <Cabec>\n    <CNPJ>${esc(cab.CNPJ)}</CNPJ>\n    <DtBase>${esc(cab.DtBase)}</DtBase>\n    <MetodApPE>${esc(cab.MetodApPE)}</MetodApPE>\n    <TotalCli>${esc(cab.TotalCli)}</TotalCli>\n  </Cabec>\n`
  for(const cli of obj.clientes||[]){
    x+=`  <Cli>\n    <Cd>${esc(cli.Cd)}</Cd>\n`
    for(const op of cli.operacoes||[]){
      x+=`    <Op>\n      <IPOC>${esc(op.IPOC)}</IPOC>\n      <Mod>${esc(op.Mod)}</Mod>\n`
      if(op.NatuOp)x+=`      <NatuOp>${esc(op.NatuOp)}</NatuOp>\n`
      if(op.ClassOp)x+=`      <ClassOp>${esc(op.ClassOp)}</ClassOp>\n`
      x+=`      <VlrContr>${esc(op.VlrContr)}</VlrContr>\n`
      for(const v of op.vencimentos||[])x+=`      <Venc><Cd>${esc(v.Cd)}</Cd><Val>${esc(v.Val)}</Val></Venc>\n`
      x+=`    </Op>\n`
    }
    x+=`  </Cli>\n`
  }
  return x+`</Doc3040>`
}

function gen4010xml(obj:any):string{
  const cab=obj.cabecalho||{}
  let x=`<?xml version="1.0" encoding="UTF-8"?>\n<Doc4010>\n  <Cabec>\n    <CNPJ>${esc(cab.cnpj)}</CNPJ>\n    <DataBase>${esc(cab.dataBase)}</DataBase>\n    <TpArq>${esc(cab.tpArq||'M')}</TpArq>\n  </Cabec>\n`
  for(const c of obj.contas||[])x+=`  <Conta><Cod>${esc(c.codigoConta)}</Cod><Saldo>${esc(c.saldo)}</Saldo></Conta>\n`
  return x+`</Doc4010>`
}

function gen3060xml(obj:any):string{
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Doc3060>\n  <CNPJ>${esc(obj.cnpj)}</CNPJ>\n  <DataBase>${esc(obj.dataBase)}</DataBase>\n  <Percentil25>${esc(obj.percentil25)}</Percentil25>\n  <Percentil50>${esc(obj.percentil50)}</Percentil50>\n  <Percentil75>${esc(obj.percentil75)}</Percentil75>\n  <Percentil100>${esc(obj.percentil100)}</Percentil100>\n</Doc3060>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cadoc, input } = body as { cadoc: CadocCode; input: any }

    if (!cadoc || !input) {
      return NextResponse.json({ error: 'cadoc e input são obrigatórios' }, { status: 400 })
    }

    let v: { erros: ValItem[]; avisos: ValItem[]; nOps: number }
    let content = '', ext = 'xml'
    const cnpj = (input.cnpjIF||input.cabecalho?.CNPJ||input.cabecalho?.cnpj||input.cnpj||'0000').replace(/\D/g,'')
    const db = (input.dataHoraRemessa||input.cabecalho?.DtBase||input.cabecalho?.dataBase||input.dataBase||new Date().toISOString().substring(0,10)).substring(0,10).replace(/-/g,'')

    if (cadoc==='3044') {
      v=validate3044(input)
      const clean=JSON.parse(JSON.stringify(input))
      if(Array.isArray(clean.operacoes))clean.operacoes.forEach((o:any)=>delete o._comentario)
      content=JSON.stringify(clean,null,2); ext='json'
    } else if (cadoc==='3040') {
      v=validate3040(input); content=gen3040xml(input)
    } else if (cadoc==='4010') {
      v=validate4010(input); content=gen4010xml(input)
    } else if (cadoc==='3060') {
      v=validate3060(input); content=gen3060xml(input)
    } else if (cadoc==='6334') {
      v=validate6334(input); content=JSON.stringify(input,null,2); ext='json'
    } else {
      return NextResponse.json({ error: `CADOC ${cadoc} não suportado` }, { status: 400 })
    }

    const nErros = v.erros.length
    const nAvisos = v.avisos.length
    const result = nErros>0 ? 'reprovado' : nAvisos>0 ? 'com_alertas' : 'aprovado'
    const filename = `cadoc${cadoc}_${cnpj}_${db}.${ext}`

    return NextResponse.json({
      jobId: `local_${Date.now()}`,
      cadoc,
      filename,
      content,
      nOperacoes: v.nOps,
      nErros,
      nAvisos,
      result,
      validation: { erros: v.erros, avisos: v.avisos },
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erro interno', message: err.message },
      { status: 500 }
    )
  }
}
