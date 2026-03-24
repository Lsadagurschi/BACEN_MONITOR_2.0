'use client'
import { useState, useRef } from 'react'

type CadocCode = '3040'|'3044'|'3060'|'4010'|'6334'
interface ValErr { cod:string; msg:string; op?:string; tipo?:string }
interface GenResult { content:string; filename:string; nErros:number; nAvisos:number; resumo:any; erros:ValErr[]; avisos:ValErr[]; txts?:Record<string,string> }
interface AuditEntry { ts:string; acao:string; cadoc:string; cnpj:string; dtBase:string; status:string; nErros:number; nAvisos:number }

const C = {
  grn:'#0a7c5c',grn2:'#08694d',grnb:'rgba(10,124,92,.08)',grnbrd:'rgba(10,124,92,.2)',
  blu:'#1d5fcc',blub:'rgba(29,95,204,.08)',blubrd:'rgba(29,95,204,.18)',
  amb:'#b45309',ambb:'rgba(180,83,9,.08)',ambbrd:'rgba(180,83,9,.2)',
  red:'#c0392b',redb:'rgba(192,57,43,.06)',redbrd:'rgba(192,57,43,.18)',
  pnk:'#7c3aed',pnkb:'rgba(124,58,237,.06)',pnkbrd:'rgba(124,58,237,.18)',
  cyn:'#0e7490',cynb:'rgba(14,116,144,.06)',cynbrd:'rgba(14,116,144,.18)',
  txt:'#0d1117',txt2:'#1e3a5f',txt3:'#5a6e8a',
  bg:'#f5f6f8',bg2:'#fff',bg3:'#eef0f3',brd:'#dde1e9',brd2:'#c8cdd8',
}

const CADOCS_LIST = [
  {code:'3040' as CadocCode,label:'SCR Operações de Crédito',icon:'📊',color:C.blu,per:'Mensal · D+5'},
  {code:'3044' as CadocCode,label:'SCR Eventos de Crédito',icon:'⚡',color:C.pnk,per:'Por evento · D+5'},
  {code:'3060' as CadocCode,label:'SCR Taxas de Juros',icon:'📈',color:C.grn,per:'Semanal · D+5'},
  {code:'4010' as CadocCode,label:'Balancete COSIF',icon:'🏦',color:C.amb,per:'Mensal · D+9'},
  {code:'6334' as CadocCode,label:'Cartões / Credenciadores',icon:'💳',color:C.cyn,per:'Trimestral'},
]

const TEMPLATES:Record<CadocCode,object> = {
'3044':{cnpjIF:'17887874',dataHoraRemessa:'2026-03-17 10:00:00',envia3050:'N',operacoes:[
  {_comentario:'Exemplo 1: Pagamento normal',acao:1,ipoc:'1788787402112620317C0001',saldoDevedor:45000,dataSaldoDevedor:'2026-03-14',atraso:'N',pagamentos:[{acao:1,data:'2026-03-14',valor:5000}]},
  {_comentario:'Exemplo 2: Pagamento elimina atraso',acao:1,ipoc:'1788787402112620317C0002',saldoDevedor:30000,dataSaldoDevedor:'2026-03-10',atraso:'N',pagamentos:[{acao:1,data:'2026-03-10',valor:3200}]},
  {_comentario:'Exemplo 3: Liquidação total',acao:1,ipoc:'1788787402112620317C0003',saldoDevedor:0,dataSaldoDevedor:'2026-03-15',atraso:'N',pagamentos:[{acao:1,data:'2026-03-15',valor:2500}]},
  {_comentario:'Exemplo 4: Concessão nova operação',acao:1,ipoc:'1788787402112620317C0004',saldoDevedor:80000,dataSaldoDevedor:'2026-03-12',atraso:'N',concessoes:[{acao:1,data:'2026-03-12',valor:80000}]},
  {_comentario:'Exemplo 5: Cartão mod 1304',acao:1,ipoc:'1788787413042620317C0005',saldoDevedor:5500,dataSaldoDevedor:'2026-03-13',atraso:'N',concessoes:[{acao:1,data:'2026-03-13',valor:500}]},
  {_comentario:'Exemplo 6: Rotativo mod 0204',acao:1,ipoc:'1788787402042620317C0006',saldoDevedor:800,dataSaldoDevedor:'2026-03-15',atraso:'N',concessoes:[{acao:1,data:'2026-03-15',valor:800}]},
  {_comentario:'Exemplo 7: Atraso mantido',acao:1,ipoc:'1788787402112620317C0007',saldoDevedor:12000,dataSaldoDevedor:'2026-03-11',atraso:'S',pagamentos:[{acao:1,data:'2026-03-11',valor:1500}]},
  {_comentario:'Exemplo 8: Renegociação',acao:1,ipoc:'1788787402112620317C0008',saldoDevedor:25000,dataSaldoDevedor:'2026-03-14',atraso:'N'},
  {_comentario:'Exemplo 9: Portabilidade tpMotivo=1',acao:1,ipoc:'1788787402112620317P0009',saldoDevedor:0,dataSaldoDevedor:'2026-03-14',atraso:'N',pagamentos:[{acao:1,data:'2026-03-14',tpMotivo:'1',valor:18000}]},
  {_comentario:'Exemplo 10: Exclusão de IPOC',acao:2,ipoc:'1788787402112620317C9999'},
]},
'3040':{cabecalho:{CNPJ:'12345678',DtBase:'2026-01-31',Parte:'1',Remessa:'1',TpArq:'M',NomeResp:'João Silva',EmailResp:'joao.silva@banco.com.br',TelResp:'11999990000',TotalCli:2,MetodApPE:'S',MetodDifTJE:'N'},clientes:[{Cd:'12345678000190',Tp:'2',IniRelactCli:'2020-01-01',Autorzc:'S',ClassCli:'A',TpCtrl:'1',PorteCli:'3',FatAnual:5000000,operacoes:[{IPOC:'1234567800019020200101001',Contrt:'CONT-2024-001',Mod:'0202',NatuOp:'01',OrigemRec:'1',Indx:'3',VarCamb:'0',CEP:'01310100',TaxEft:18.5,DtContr:'2024-06-01',DtVencOp:'2027-06-01',VlrContr:50000,ClassOp:'A',ProvConsttd:500,DiaAtraso:0,vencimentos:{v110:12000,v120:12000,v130:12000,v140:12000,v150:2000},ContInstFinRes4966:{ClasAtFin:'1',CartProvMin:'A',VlrContBr:50000,VlrPerdaAcum:0}}]},{Cd:'98765432100',Tp:'1',IniRelactCli:'2021-03-15',Autorzc:'S',ClassCli:'AA',operacoes:[{IPOC:'1234567800019020210315002',Contrt:'CONT-2024-002',Mod:'0202',NatuOp:'01',OrigemRec:'1',Indx:'3',VarCamb:'0',CEP:'01310100',TaxEft:12,DtContr:'2024-01-15',DtVencOp:'2026-01-15',VlrContr:15000,ClassOp:'AA',ProvConsttd:0,DiaAtraso:0,vencimentos:{v110:5000,v120:5000,v130:5000},ContInstFinRes4966:{ClasAtFin:'1',CartProvMin:'AA',VlrContBr:15000,VlrPerdaAcum:0}}]}]},
'3060':{dataBase:'202601',codigoDocumento:'3060',cnpj:'37485267',tipoEnvio:'I',percentil25:12.5,percentil50:28.75,percentil75:65.3,percentil100:98.45},
'4010':{cabecalho:{codigoDocumento:'4010',cnpj:'12345678',dataBase:'202601',tipoRemessa:'N'},contas:[{codigoConta:'1.0.0.00.00-0',saldo:1500000},{codigoConta:'1.1.0.00.00-1',saldo:800000},{codigoConta:'1.1.1.00.00-5',saldo:500000},{codigoConta:'2.0.0.00.00-3',saldo:1200000},{codigoConta:'3.0.0.00.00-6',saldo:250000}]},
'6334':{database:{dataGeracao:'20260301',ispb:'17887874',dataBase:'202603'},segmentos:[{nome:'Bares e Restaurantes',descricao:'Restaurantes, bares, pubs e fast food',codigo:'402'}],conccred:[{ano:2026,trimestre:1,bandeira:'01',funcao:'C',qtdCredenciados:1000,qtdAtivos:800,vlrTransacoes:42500000,qtdTransacoes:14}],intercam:[{ano:2026,trimestre:1,produto:'32',modalidade:'P',funcao:'H',bandeira:'99',formaCaptura:'1',parcelas:'01',segmento:'402',tarifaIntercambio:'1014',vlrTransacoes:'000004863349100',qtdTransacoes:'000000014271'}],desconto:[{ano:2026,trimestre:1,funcao:'C',bandeira:'02',formaCaptura:'1',parcelas:'01',segmento:'402',txMedia:'0297',txMin:'0300',txMax:'0300',txDesvioPad:'0003',vlrTransacoes:'000000000029700',qtdTransacoes:'000000000003'}],infresta:[{ano:2026,trimestre:1,uf:'SC',totalEstab:1,capManual:0,capElet:1,capRemota:0}],infrterm:[{ano:2026,trimestre:1,uf:'SC',totalPOS:1,posComp:0,posChip:0,totalPDV:0}],lucrcred:[{ano:2026,trimestre:1,recTaxaDesc:'000000000000',recAlugEquip:'000000000000',recOutras:'000000000000',custIntercambio:'000000000000',custMktProp:'000000000000',custBandeiras:'000000000000',custRiscos:'000000000000',custFrontBack:'000000000000',custOutros:'000000000000'}],ranking:[],contatos:[{ano:2026,trimestre:1,tipo:'D',nome:'João Silva Santos',cargo:'Diretor Executivo',telefone:'+5511999990000',email:'joao.silva@banco.com.br'},{ano:2026,trimestre:1,tipo:'T',nome:'Maria Costa',cargo:'Gerente Tecnologia',telefone:'+5511999991111',email:'maria.costa@banco.com.br'},{ano:2026,trimestre:1,tipo:'I',nome:'',cargo:'',telefone:'',email:'contato@banco.com.br'}]},
}

function parse3044(text:string):any{
  try{
    let doc:any;try{doc=JSON.parse(text)}catch(e:any){return{error:'JSON inválido: '+e.message}}
    const erros:ValErr[]=[],avisos:ValErr[]=[],now=new Date()
    const cnpjIF=String(doc.cnpjIF||''),dataHoraRemessa=String(doc.dataHoraRemessa||''),envia3050=String(doc.envia3050||'')
    if(!cnpjIF)erros.push({cod:'B01',msg:'cnpjIF ausente'})
    else if(!/^\d{8}$/.test(cnpjIF))erros.push({cod:'B01',msg:'cnpjIF deve ter 8 dígitos — encontrado: '+cnpjIF})
    if(!dataHoraRemessa)erros.push({cod:'B01',msg:'dataHoraRemessa ausente'})
    if(!envia3050)erros.push({cod:'B01',msg:'envia3050 ausente'})
    else if(!['S','N'].includes(envia3050))erros.push({cod:'B01',msg:'envia3050 deve ser S ou N'})
    if(dataHoraRemessa){const dtRem=new Date(dataHoraRemessa.replace(' ','T'));if(!isNaN(dtRem.getTime())&&dtRem>now)erros.push({cod:'T04',msg:'dataHoraRemessa futura: '+dataHoraRemessa})}
    const ops=Array.isArray(doc.operacoes)?doc.operacoes:[]
    if(!ops.length)avisos.push({cod:'W01',msg:'Lista de operações vazia'})
    const pD=(s:string)=>s?new Date(s+'T00:00:00'):null
    const is24m=(d:Date)=>{if(!d)return false;const l=new Date();l.setMonth(l.getMonth()-24);return d>=l}
    const pagK:Record<string,number>={},conK:Record<string,number>={}
    const parsedOps=ops.map((op:any,i:number)=>{
      const acao=op.acao,ipoc=String(op.ipoc||''),lbl='#'+(i+1)+(ipoc?' IPOC '+ipoc.substring(0,12)+'…':'')
      if(!acao)erros.push({cod:'B01',op:lbl,msg:'acao ausente'})
      if(acao===2){if(!ipoc)erros.push({cod:'B01',op:lbl,msg:'acao=2 requer ipoc'});return{acao,ipoc,_excluir:true}}
      if(acao===1){
        if(!ipoc)erros.push({cod:'B01',op:lbl,msg:'ipoc ausente'})
        if(op.saldoDevedor===undefined)erros.push({cod:'B01',op:lbl,msg:'saldoDevedor ausente'})
        if(!op.dataSaldoDevedor)erros.push({cod:'B01',op:lbl,msg:'dataSaldoDevedor ausente'})
        if(!op.atraso)erros.push({cod:'B01',op:lbl,msg:'atraso ausente (S ou N)'})
        else if(!['S','N'].includes(op.atraso))erros.push({cod:'B01',op:lbl,msg:'atraso inválido: '+op.atraso})
        if(envia3050==='S'&&!op.class3050)erros.push({cod:'T08',op:lbl,msg:'class3050 obrigatório pois envia3050=S'})
        if(envia3050==='N'&&op.class3050)erros.push({cod:'T07',op:lbl,msg:'class3050 proibido pois envia3050=N'})
      }
      const dtS=pD(op.dataSaldoDevedor)
      if(dtS&&!is24m(dtS))erros.push({cod:'T13',op:lbl,msg:'dataSaldoDevedor fora dos últimos 24 meses'})
      if(dtS&&dataHoraRemessa){const dR=new Date(dataHoraRemessa.replace(' ','T'));if(!isNaN(dR.getTime())&&dR<dtS)erros.push({cod:'T01',op:lbl,msg:'dataHoraRemessa anterior a dataSaldoDevedor'})}
      const pagamentos=(op.pagamentos||[]).map((p:any,pi:number)=>{
        const pl=lbl+' pag#'+(pi+1)
        if((p.acao===1||p.acao===3)&&(!p.data||p.valor===undefined)){if(!p.data)erros.push({cod:'B01',op:pl,msg:'data ausente'});if(p.valor===undefined)erros.push({cod:'B01',op:pl,msg:'valor ausente'})}
        const dp=pD(p.data)
        if(dp&&!is24m(dp))erros.push({cod:'T11',op:pl,msg:'data pagamento fora dos últimos 24 meses'})
        if(dp&&dtS&&dp>dtS)erros.push({cod:'T02',op:pl,msg:'pagamento posterior a dataSaldoDevedor'})
        if(p.data&&p.acao!==2){const k=ipoc+'|'+p.data;pagK[k]=(pagK[k]||0)+1;if(pagK[k]>1)erros.push({cod:'T05',op:pl,msg:'mais de um pagamento na data '+p.data})}
        return p
      })
      const concessoes=(op.concessoes||[]).map((c:any,ci:number)=>{
        const cl=lbl+' con#'+(ci+1)
        if((c.acao===1||c.acao===3)&&(!c.data||c.valor===undefined)){if(!c.data)erros.push({cod:'B01',op:cl,msg:'data ausente'});if(c.valor===undefined)erros.push({cod:'B01',op:cl,msg:'valor ausente'})}
        const dc=pD(c.data)
        if(dc&&!is24m(dc))erros.push({cod:'T12',op:cl,msg:'data concessão fora dos últimos 24 meses'})
        if(dc&&dtS&&dc>dtS)erros.push({cod:'T03',op:cl,msg:'concessão posterior a dataSaldoDevedor'})
        if(c.data&&c.acao===1){const k=ipoc+'|'+c.data;conK[k]=(conK[k]||0)+1;if(conK[k]>1)erros.push({cod:'T06',op:cl,msg:'mais de uma concessão na data '+c.data})}
        return c
      })
      return{acao,ipoc,class3050:op.class3050,saldoDevedor:op.saldoDevedor,dataSaldoDevedor:op.dataSaldoDevedor,atraso:op.atraso,pagamentos,concessoes,cessoes:op.cessoes||[],aquisicoes:op.aquisicoes||[]}
    })
    const nOps=parsedOps.filter((o:any)=>o.acao===1).length
    const nExclusoes=parsedOps.filter((o:any)=>o.acao===2).length
    const nPag=parsedOps.reduce((s:number,o:any)=>s+(o.pagamentos||[]).filter((p:any)=>p.acao===1).length,0)
    const nCon=parsedOps.reduce((s:number,o:any)=>s+(o.concessoes||[]).filter((c:any)=>c.acao===1).length,0)
    const totalPag=parsedOps.reduce((s:number,o:any)=>s+(o.pagamentos||[]).reduce((ss:number,p:any)=>ss+(p.valor||0),0),0)
    const totalConc=parsedOps.reduce((s:number,o:any)=>s+(o.concessoes||[]).reduce((ss:number,c:any)=>ss+(c.valor||0),0),0)
    return{meta:{cnpjIF,dataHoraRemessa,envia3050},operacoes:parsedOps,resumo:{nOps,nExclusoes,nPagamentos:nPag,nConcessoes:nCon,totalPag,totalConc,totalOps:parsedOps.length},erros,avisos}
  }catch(e:any){return{error:'Erro: '+e.message}}
}

const xa=(name:string,val:any)=>val!==undefined&&val!==null&&val!==''?` ${name}="${String(val).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}"`:'';

function gen3040(obj:any):string{
  const h=obj.cabecalho||{}
  let x=`<?xml version="1.0" encoding="UTF-8"?>\n<Doc3040`+xa('CNPJ',h.CNPJ)+xa('DtBase',h.DtBase)+xa('Parte',h.Parte||'1')+xa('Remessa',h.Remessa||'1')+xa('TpArq',h.TpArq||'M')+xa('NomeResp',h.NomeResp)+xa('EmailResp',h.EmailResp)+xa('TelResp',h.TelResp)+xa('TotalCli',(obj.clientes||[]).length)+xa('MetodApPE',h.MetodApPE||'S')+xa('MetodDifTJE',h.MetodDifTJE||'N')+'>\n'
  ;(obj.clientes||[]).forEach((cli:any)=>{
    x+=`  <Cli`+xa('Cd',cli.Cd)+xa('Tp',cli.Tp)+xa('IniRelactCli',cli.IniRelactCli)+xa('Autorzc',cli.Autorzc)+xa('ClassCli',cli.ClassCli)+(cli.TpCtrl?xa('TpCtrl',cli.TpCtrl):'')+(cli.PorteCli?xa('PorteCli',cli.PorteCli):'')+(cli.FatAnual!==undefined?xa('FatAnual',cli.FatAnual):'')+`>\n`
    ;(cli.operacoes||[]).forEach((op:any)=>{
      x+=`    <Op`+xa('IPOC',op.IPOC)+xa('Contrt',op.Contrt)+xa('Mod',op.Mod)+xa('NatuOp',op.NatuOp)+xa('OrigemRec',op.OrigemRec)+xa('Indx',op.Indx)+xa('VarCamb',op.VarCamb)+xa('CEP',op.CEP)+xa('TaxEft',op.TaxEft)+xa('DtContr',op.DtContr)+(op.VlrContr!==undefined?xa('VlrContr',op.VlrContr):'')+xa('DtVencOp',op.DtVencOp)+xa('ClassOp',op.ClassOp)+(op.ProvConsttd!==undefined?xa('ProvConsttd',op.ProvConsttd):'')+`>\n`
      const v=op.vencimentos||{}
      if(Object.keys(v).length>0){x+=`      <Venc`;Object.entries(v).forEach(([k,vv])=>{x+=` ${k}="${vv}"`});x+=` />\n`}
      const cif=op.ContInstFinRes4966
      if(cif)x+=`      <ContInstFinRes4966`+xa('ClasAtFin',cif.ClasAtFin)+xa('CartProvMin',cif.CartProvMin)+(cif.VlrContBr!==undefined?xa('VlrContBr',cif.VlrContBr):'')+(cif.VlrPerdaAcum!==undefined?xa('VlrPerdaAcum',cif.VlrPerdaAcum):'')+` />\n`
      x+=`    </Op>\n`
    })
    x+=`  </Cli>\n`
  })
  return x+`</Doc3040>`
}

function gen3060(obj:any):string{
  const e=(s:any)=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  return `<?xml version="1.0" encoding="iso-8859-1" ?>\n<documento dataBase="${e(obj.dataBase)}" codigoDocumento="${e(obj.codigoDocumento||'3060')}" cnpj="${e(obj.cnpj)}" tipoEnvio="${e(obj.tipoEnvio||'I')}">\n  <percentil25>${obj.percentil25}</percentil25>\n  <percentil50>${obj.percentil50}</percentil50>\n  <percentil75>${obj.percentil75}</percentil75>\n  <percentil100>${obj.percentil100}</percentil100>\n</documento>`
}

function gen4010(obj:any):string{
  const e=(s:any)=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const h=obj.cabecalho||{}
  let x=`<?xml version="1.0" encoding="UTF-8"?>\n<documento codigoDocumento="${e(h.codigoDocumento||'4010')}" cnpj="${e(h.cnpj)}" dataBase="${e(h.dataBase)}" tipoRemessa="${e(h.tipoRemessa||'N')}">\n  <contas>\n`
  ;(obj.contas||[]).forEach((c:any)=>{x+=`    <conta codigoConta="${e(c.codigoConta)}" saldo="${c.saldo}" />\n`})
  return x+`  </contas>\n</documento>`
}

function gen6334(obj:any):Record<string,string>{
  const pad=(s:any,n:number)=>String(s||'').padEnd(n).substring(0,n)
  const dg=obj.database||{},dtGer=String(dg.dataGeracao||new Date().toISOString().slice(0,10).replace(/-/g,'')).substring(0,8)
  const ispb=String(dg.ispb||'').padStart(8,'0').substring(0,8),dtBase=String(dg.dataBase||'')
  const txts:Record<string,string>={}
  txts['DATABASE']=`DATABASE${dtGer}${ispb}${dtBase}  `
  const segs=obj.segmentos||[];let sT=`SEGMENTO${dtGer}${ispb}${String(segs.length).padStart(8,'0')}\n`
  segs.forEach((s:any)=>{sT+=pad(s.nome||'',50)+pad(s.descricao||'',250)+String(s.codigo||'').padStart(3,'0')+'\n'})
  txts['SEGMENTO']=sT.trimEnd()
  const ccs=obj.conccred||[];let cT=`CONCCRED${dtGer}${ispb}${String(ccs.length).padStart(8,'0')}\n`
  ccs.forEach((r:any)=>{cT+=String(r.ano||2026)+String(r.trimestre||1)+String(r.bandeira||'99').padStart(2,'0')+String(r.funcao||'C')+String(r.qtdCredenciados||0).padStart(9,'0')+String(r.qtdAtivos||0).padStart(9,'0')+String(Math.round((r.vlrTransacoes||0)*100)).padStart(15,'0')+String(r.qtdTransacoes||0).padStart(12,'0')+'\n'})
  txts['CONCCRED']=cT.trimEnd()
  const lcs=obj.lucrcred||[{}];let lT=`LUCRCRED${dtGer}${ispb}${String(lcs.length).padStart(8,'0')}\n`
  lcs.forEach((r:any)=>{lT+=String(r.ano||2026)+String(r.trimestre||1)+String(r.recTaxaDesc||'000000000000')+String(r.recAlugEquip||'000000000000')+String(r.recOutras||'000000000000')+String(r.custIntercambio||'000000000000')+String(r.custMktProp||'000000000000')+String(r.custBandeiras||'000000000000')+String(r.custRiscos||'000000000000')+String(r.custFrontBack||'000000000000')+String(r.custOutros||'000000000000')+'\n'})
  txts['LUCRCRED']=lT.trimEnd()
  const ds=obj.desconto||[];let dT=`DESCONTO${dtGer}${ispb}${String(ds.length).padStart(8,'0')}\n`
  ds.forEach((r:any)=>{dT+=String(r.ano||2026)+String(r.trimestre||1)+String(r.funcao||'C')+String(r.bandeira||'99').padStart(2,'0')+String(r.formaCaptura||'1')+String(r.parcelas||'01').padStart(2,'0')+String(r.segmento||'401').padStart(3,'0')+String(r.txMedia||'0000').padStart(4,'0')+String(r.txMin||'0000').padStart(4,'0')+String(r.txMax||'0000').padStart(4,'0')+String(r.txDesvioPad||'0000').padStart(4,'0')+String(r.vlrTransacoes||'000000000000000').padStart(15,'0')+String(r.qtdTransacoes||'000000000000').padStart(12,'0')+'\n'})
  txts['DESCONTO']=dT.trimEnd()
  const ics=obj.intercam||[];let iT=`INTERCAM${dtGer}${ispb}${String(ics.length).padStart(8,'0')}\n`
  ics.forEach((r:any)=>{iT+=String(r.ano||2026)+String(r.trimestre||1)+String(r.produto||'32').padStart(2,'0')+String(r.modalidade||'P')+String(r.funcao||'H')+String(r.bandeira||'99').padStart(2,'0')+String(r.formaCaptura||'1')+String(r.parcelas||'01').padStart(2,'0')+String(r.segmento||'401').padStart(3,'0')+String(r.tarifaIntercambio||'0000').padStart(4,'0')+String(r.vlrTransacoes||'000000000000000').padStart(15,'0')+String(r.qtdTransacoes||'000000000000').padStart(12,'0')+'\n'})
  txts['INTERCAM']=iT.trimEnd()
  const ies=obj.infresta||[];let ieT=`INFRESTA${dtGer}${ispb}${String(ies.length).padStart(8,'0')}\n`
  ies.forEach((r:any)=>{ieT+=String(r.ano||2026)+String(r.trimestre||1)+pad(r.uf||'SP',2)+String(r.totalEstab||0).padStart(8,'0')+String(r.capManual||0).padStart(8,'0')+String(r.capElet||0).padStart(8,'0')+String(r.capRemota||0).padStart(8,'0')+'\n'})
  txts['INFRESTA']=ieT.trimEnd()
  const its=obj.infrterm||[];let itT=`INFRTERM${dtGer}${ispb}${String(its.length).padStart(8,'0')}\n`
  its.forEach((r:any)=>{itT+=String(r.ano||2026)+String(r.trimestre||1)+pad(r.uf||'SP',2)+String(r.totalPOS||0).padStart(8,'0')+String(r.posComp||0).padStart(8,'0')+String(r.posChip||0).padStart(8,'0')+String(r.totalPDV||0).padStart(8,'0')+'\n'})
  txts['INFRTERM']=itT.trimEnd()
  const cts=obj.contatos||[];let ctT=`CONTATOS${dtGer}${ispb}${String(cts.length).padStart(8,'0')}\n`
  cts.forEach((r:any)=>{ctT+=String(r.ano||2026)+String(r.trimestre||1)+String(r.tipo||'T')+pad(r.nome||'',50)+pad(r.cargo||'',50)+pad(r.telefone||'',50)+pad(r.email||'',50)+'\n'})
  txts['CONTATOS']=ctT.trimEnd()
  txts['RANKING ']=`RANKING ${dtGer}${ispb}00000000`
  return txts
}

function processCADOC(cadoc:CadocCode,obj:any):GenResult{
  let erros:ValErr[]=[],avisos:ValErr[]=[],content='',ext='xml',resumo:any={},txts:Record<string,string>|undefined
  const cnpj=String(obj.cnpjIF||obj.cabecalho?.CNPJ||obj.cabecalho?.cnpj||obj.cnpj||obj.database?.ispb||'0000').replace(/\D/g,'')
  const dbRaw=String(obj.dataHoraRemessa||obj.cabecalho?.DtBase||obj.cabecalho?.dataBase||obj.dataBase||obj.database?.dataBase||new Date().toISOString().substring(0,10))
  const db=dbRaw.substring(0,10).replace(/-/g,'').replace(/\//g,'')
  if(cadoc==='3044'){
    const r=parse3044(JSON.stringify(obj))
    if(r.error)return{content:'',filename:'',nErros:1,nAvisos:0,resumo:{},erros:[{cod:'ERR',msg:r.error}],avisos:[]}
    erros=r.erros||[];avisos=r.avisos||[];resumo=r.resumo||{}
    const clean=JSON.parse(JSON.stringify(obj))
    if(Array.isArray(clean.operacoes))clean.operacoes.forEach((o:any)=>delete o._comentario)
    content=JSON.stringify(clean,null,2);ext='json'
  }else if(cadoc==='3040'){
    content=gen3040(obj)
    if(!obj.cabecalho)erros.push({cod:'H01',msg:'cabecalho ausente'})
    else{if(!obj.cabecalho.CNPJ)erros.push({cod:'H02',msg:'CNPJ ausente'});if(!obj.cabecalho.DtBase)erros.push({cod:'H03',msg:'DtBase ausente'})}
    if(!Array.isArray(obj.clientes))erros.push({cod:'C01',msg:'clientes deve ser array'})
    else resumo={totalCli:obj.clientes.length,totalOps:obj.clientes.reduce((s:number,c:any)=>s+(c.operacoes||[]).length,0)}
  }else if(cadoc==='3060'){
    content=gen3060(obj)
    if(!obj.cnpj)erros.push({cod:'H01',msg:'cnpj ausente'})
    if(!obj.dataBase)erros.push({cod:'H02',msg:'dataBase ausente'})
    if(obj.percentil25===undefined)erros.push({cod:'P01',msg:'percentil25 ausente'})
    if(obj.percentil50===undefined)erros.push({cod:'P02',msg:'percentil50 ausente'})
    resumo={cnpj:obj.cnpj,p25:obj.percentil25,p50:obj.percentil50,p75:obj.percentil75,p100:obj.percentil100}
  }else if(cadoc==='4010'){
    content=gen4010(obj)
    if(!obj.cabecalho)erros.push({cod:'H01',msg:'cabecalho ausente'})
    if(!Array.isArray(obj.contas))erros.push({cod:'C01',msg:'contas deve ser array'})
    else resumo={totalContas:obj.contas.length}
  }else if(cadoc==='6334'){
    txts=gen6334(obj);ext='txt'
    content=Object.entries(txts).map(([k,v])=>`=== ${k.trim()}.TXT ===\n${v}`).join('\n\n')
    if(!obj.database?.dataBase)erros.push({cod:'DB01',msg:'database.dataBase ausente'})
    if(!obj.database?.ispb)erros.push({cod:'DB02',msg:'database.ispb ausente'})
    const mesDB=parseInt(String(obj.database?.dataBase||'').substring(4,6)||'0')
    if(![3,6,9,12].includes(mesDB))erros.push({cod:'VCRD0029',msg:`dataBase mês deve ser 03/06/09/12 (trimestral)`})
    if(!(obj.contatos?.length))erros.push({cod:'C47',msg:'CONTATOS obrigatório: 1 Diretor + 2 Técnicos + 1 institucional'})
    else{
      const temDir=obj.contatos.some((c:any)=>c.tipo==='D')
      const temInst=obj.contatos.some((c:any)=>c.tipo==='I')
      const tecns=obj.contatos.filter((c:any)=>c.tipo==='T')
      if(!temDir)erros.push({cod:'C47',msg:'Falta registro de Diretor (tipo D)'})
      if(!temInst)avisos.push({cod:'C47',msg:'Falta e-mail institucional (tipo I)'})
      if(tecns.length<2)avisos.push({cod:'C47',msg:`Apenas ${tecns.length} técnico(s) — recomendado 2`})
    }
    if(!(obj.conccred?.length))avisos.push({cod:'B17',msg:'CONCCRED sem registros'})
    resumo={totalArquivos:Object.keys(txts).length,conccred:(obj.conccred||[]).length,contatos:(obj.contatos||[]).length}
  }
  return{content,txts,filename:cadoc==='6334'?`bacen_${cnpj}_${db}.zip`:`cadoc${cadoc}_${cnpj}_${db}.${ext}`,nErros:erros.length,nAvisos:avisos.length,resumo,erros,avisos}
}

function liveVal(json:string,cadoc:CadocCode):{state:string,msg:string,errors:ValErr[]}{
  if(!json.trim())return{state:'idle',msg:'Aguardando entrada JSON…',errors:[]}
  let obj:any,err=''
  try{obj=JSON.parse(json)}catch(e:any){err=e.message}
  if(err)return{state:'err',msg:'✗ JSON inválido — '+err.substring(0,60),errors:[{cod:'SYN',msg:err}]}
  const errors:ValErr[]=[]
  if(cadoc==='3044'){const r=parse3044(json);if(r.error)return{state:'err',msg:'✗ '+r.error,errors:[{cod:'ERR',msg:r.error}]};(r.erros||[]).forEach((e:ValErr)=>errors.push(e));(r.avisos||[]).forEach((a:ValErr)=>errors.push({...a,tipo:'aviso'}))}
  else if(cadoc==='3040'){if(!obj.cabecalho?.CNPJ)errors.push({cod:'H02',msg:'cabecalho.CNPJ ausente'});if(!Array.isArray(obj.clientes))errors.push({cod:'C01',msg:'clientes deve ser array'})}
  else if(cadoc==='4010'){if(!obj.cabecalho?.cnpj)errors.push({cod:'H02',msg:'cabecalho.cnpj ausente'});if(!Array.isArray(obj.contas))errors.push({cod:'C01',msg:'contas deve ser array'})}
  else if(cadoc==='3060'){if(!obj.cnpj)errors.push({cod:'H01',msg:'cnpj ausente'})}
  else if(cadoc==='6334'){if(!obj.database?.ispb)errors.push({cod:'DB01',msg:'database.ispb ausente'})}
  const kb=(new TextEncoder().encode(json).length/1024).toFixed(1)
  const fatais=errors.filter(e=>e.tipo!=='aviso')
  if(fatais.length>0)return{state:'err',msg:`✗ ${fatais.length} erro(s) — ${fatais[0].msg.substring(0,55)}`,errors}
  const avisos=errors.filter(e=>e.tipo==='aviso')
  if(avisos.length>0)return{state:'warn',msg:`⚠ ${avisos.length} aviso(s) · ${kb} KB`,errors}
  const sum:Record<string,string>={'3044':`${obj.operacoes?.length??0} operação(ões) · CNPJ ${obj.cnpjIF??'?'}`,'3040':`${obj.clientes?.length??0} cliente(s)`,'3060':`p25=${obj.percentil25} p50=${obj.percentil50}`,'4010':`${obj.contas?.length??0} conta(s) COSIF`,'6334':`OK · ${kb} KB`}
  return{state:'ok',msg:`✓ JSON válido — ${sum[cadoc]||'OK'} · ${kb} KB`,errors:[]}
}

export default function CadocsPage(){
  const[sel,setSel]=useState<CadocCode>('3044')
  const[json,setJson]=useState(()=>JSON.stringify(TEMPLATES['3044'],null,2))
  const[step,setStep]=useState(1)
  const[busy,setBusy]=useState(false)
  const[loadMsg,setLoadMsg]=useState('')
  const[result,setResult]=useState<GenResult|null>(null)
  const[parseErr,setParseErr]=useState('')
  const[resTab,setResTab]=useState<'resumo'|'erros'|'preview'>('resumo')
  const[audit,setAudit]=useState<AuditEntry[]>([])
  const[lv,setLv]=useState<{state:string,msg:string,errors:ValErr[]}>({state:'idle',msg:'Aguardando entrada JSON…',errors:[]})
  const lvTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  const m=CADOCS_LIST.find(c=>c.code===sel)!

  const pick=(code:CadocCode)=>{setSel(code);setJson(JSON.stringify(TEMPLATES[code],null,2));setStep(1);setResult(null);setParseErr('');setLv({state:'idle',msg:'Aguardando entrada JSON…',errors:[]})}

  const onChange=(v:string)=>{setJson(v);setStep(1);setResult(null);setParseErr('');if(lvTimer.current)clearTimeout(lvTimer.current);lvTimer.current=setTimeout(()=>setLv(liveVal(v,sel)),350)}

  const generate=async()=>{
    setParseErr('');setBusy(true);setLoadMsg(`Convertendo JSON → ${sel}…`);setStep(2)
    await new Promise(r=>setTimeout(r,150))
    let obj:any;try{obj=JSON.parse(json)}catch(e:any){setParseErr('JSON inválido: '+e.message);setStep(1);setBusy(false);return}
    setLoadMsg(`Validando regras BCB para CADOC ${sel}…`);await new Promise(r=>setTimeout(r,200))
    const res=processCADOC(sel,obj);setResult(res);setStep(3);setResTab('resumo')
    const status=res.nErros>0?'REPROVADO':res.nAvisos>0?'COM_ALERTAS':'APROVADO'
    const cnpj=String(obj.cnpjIF||obj.cabecalho?.CNPJ||obj.cabecalho?.cnpj||obj.cnpj||obj.database?.ispb||'?')
    const dtBase=String(obj.dataHoraRemessa||obj.cabecalho?.DtBase||obj.cabecalho?.dataBase||obj.dataBase||obj.database?.dataBase||'?').substring(0,10)
    setAudit(prev=>[{ts:new Date().toLocaleString('pt-BR'),acao:`Geração + Validação ${sel} via JSON`,cadoc:sel,cnpj,dtBase,status,nErros:res.nErros,nAvisos:res.nAvisos},...prev].slice(0,50))
    setBusy(false)
  }

  const download=()=>{
    if(!result)return
    if(sel==='6334'&&result.txts){Object.entries(result.txts).forEach(([k,v],i)=>{setTimeout(()=>{const b=new Blob([v],{type:'text/plain;charset=iso-8859-1'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=k.trim()+'.TXT';a.click();URL.revokeObjectURL(a.href)},i*80)})}
    else{const b=new Blob([result.content],{type:(sel==='3044'?'application/json':'application/xml')+';charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=result.filename;a.click();URL.revokeObjectURL(a.href)}
    setStep(4);setAudit(prev=>[{ts:new Date().toLocaleString('pt-BR'),acao:`Download ${sel==='6334'?'10 TXTs':'arquivo'} — CADOC ${sel}`,cadoc:sel,cnpj:'',dtBase:'',status:'EXPORTADO',nErros:0,nAvisos:0},...prev].slice(0,50))
  }

  const fmtV=(v:number)=>'R$ '+(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
  const fmtD=(s:string)=>{if(!s)return'—';const[y,mo,d]=s.split('-');return`${d||'?'}/${mo||'?'}/${y||'?'}`}

  const stC=!result?C.grn:result.nErros>0?C.red:result.nAvisos>0?C.amb:C.grn
  const stL=!result?'':result.nErros>0?`✗ ${result.nErros} erro(s)`:result.nAvisos>0?`⚠ ${result.nAvisos} aviso(s)`:'✓ APROVADO'

  const lvcMap:Record<string,{bg:string,brd:string,col:string}>={
    idle:{bg:'#f9fafb',brd:C.brd,col:C.txt3},ok:{bg:'#f0fdf4',brd:'#22c55e',col:'#166534'},
    warn:{bg:'#fffbeb',brd:'#f59e0b',col:'#92400e'},err:{bg:'#fef2f2',brd:C.red,col:'#991b1b'}
  }
  const lvc=lvcMap[lv.state]||lvcMap.idle

  const STEPS=[
    {n:1,t:'Entrada JSON',d:sel==='3044'?'JSON no leiaute BCB do 3044':'JSON estruturado com cabeçalho e dados'},
    {n:2,t:sel==='3044'?'Validação JSON':'Geração do Arquivo',d:sel==='3044'?'Regras T01–T13 e B01 do Manual BCB':'Converte JSON para XML/TXT BCB'},
    {n:3,t:'Validação Pré-Envio',d:'Resultado com erros, avisos e arquivo'},
    {n:4,t:'Exportação & Download',d:'Arquivo pronto para remessa ao STA'},
    {n:5,t:'Trilha de Auditoria',d:'Registro de todas as ações'},
  ]

  return(
    <div style={{padding:'20px 24px',height:'100%',overflowY:'auto',background:C.bg}}>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:15,fontWeight:800,color:C.txt,marginBottom:3}}>⚙ Geração & Validação Automática — CADOC {sel}</div>
        <div style={{fontSize:11,color:C.txt3}}>Receba dados via JSON, converta para o formato BCB, valide com as regras de crítica e exporte para o STA.</div>
      </div>

      {/* CADOC picker */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:14}}>
        {CADOCS_LIST.map(c=>(
          <button key={c.code} onClick={()=>pick(c.code)} style={{padding:'10px 8px',borderRadius:8,cursor:'pointer',textAlign:'left',outline:'none',border:`2px solid ${sel===c.code?c.color:C.brd}`,background:sel===c.code?c.color+'18':C.bg3,transition:'all .15s'}}>
            <div style={{fontSize:17,marginBottom:3}}>{c.icon}</div>
            <div style={{fontSize:11,fontWeight:800,color:sel===c.code?c.color:C.txt,fontFamily:'monospace'}}>{c.code}</div>
            <div style={{fontSize:9,color:C.txt3,marginTop:2,lineHeight:1.3}}>{c.label.replace(/^.+?—\s*/,'')}</div>
            <div style={{fontSize:8,color:sel===c.code?c.color:C.txt3,marginTop:3,fontFamily:'monospace'}}>{c.per}</div>
          </button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'195px 1fr',gap:14,alignItems:'start'}}>
        {/* Steps sidebar */}
        <div>
          <div style={{background:C.bg2,border:`1px solid ${C.brd}`,borderRadius:10,overflow:'hidden',marginBottom:10}}>
            {STEPS.map((s,i)=>{
              const done=step>s.n||(s.n===5&&audit.length>0),act=step===s.n,isErr=!!parseErr&&s.n===1
              const col=isErr?C.red:done?C.grn:act?m.color:'#cbd5e1'
              return(
                <div key={s.n} style={{display:'flex',gap:9,padding:'10px 12px',borderBottom:i<STEPS.length-1?`1px solid ${C.brd}`:'none',background:act?m.color+'08':'transparent'}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:done||act||isErr?col:'#f1f5f9',color:done||act||isErr?'#fff':C.txt3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,flexShrink:0}}>
                    {done&&!isErr?'✓':isErr?'✕':s.n}
                  </div>
                  <div><div style={{fontSize:11,fontWeight:700,color:done||act?C.txt:C.txt3}}>{s.t}</div><div style={{fontSize:9,color:C.txt3,lineHeight:1.4,marginTop:1}}>{s.d}</div></div>
                </div>
              )
            })}
          </div>
          <div style={{background:C.bg2,border:`1px solid ${C.brd}`,borderRadius:10,padding:12,fontSize:9.5,color:C.txt3,lineHeight:1.8}}>
            {sel==='3044'&&<><strong style={{color:C.txt}}>CADOC 3044</strong><br/>Regras T01–T13 · B01<br/>Res. CMN 5.037/2022<br/>STA: ASCR344</>}
            {sel==='3040'&&<><strong style={{color:C.txt}}>CADOC 3040</strong><br/>SCR3040_Criticas.xls<br/>MV01–MV18 · M01–M24<br/>Res. CMN 3.658/2008</>}
            {sel==='4010'&&<><strong style={{color:C.txt}}>CADOC 4010</strong><br/>Plano COSIF<br/>Balancete patrimonial<br/>D+9 úteis</>}
            {sel==='3060'&&<><strong style={{color:C.txt}}>CADOC 3060</strong><br/>Circ. BCB 4.019/2020<br/>Taxas por modalidade<br/>Semanal D+5</>}
            {sel==='6334'&&<><strong style={{color:C.txt}}>CADOC 6334</strong><br/>ASPB034 · 10 TXTs<br/>ISO-8859-1<br/>Validação posicional<br/>Trimestral</>}
          </div>
        </div>

        {/* Main area */}
        <div>
          {/* JSON Editor */}
          <div style={{background:C.bg2,border:`1px solid ${C.brd}`,borderRadius:10,overflow:'hidden',marginBottom:10,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <div style={{padding:'9px 12px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between',background:'#f9fafb',flexWrap:'wrap',gap:6}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:9,fontFamily:'monospace',background:m.color,color:'#fff',padding:'2px 8px',borderRadius:4,fontWeight:700}}>JSON API</span>
                <span style={{fontSize:12,fontWeight:600,color:C.txt}}>📥 Entrada de Dados — CADOC {sel}</span>
                <span style={{fontSize:9,color:C.txt3,fontFamily:'monospace'}}>POST /api/cadoc/gerar</span>
              </div>
              <div style={{display:'flex',gap:5}}>
                <button onClick={()=>{setJson(JSON.stringify(TEMPLATES[sel],null,2));setStep(1);setResult(null);setParseErr('');setLv({state:'idle',msg:'Aguardando entrada JSON…',errors:[]})}} style={{fontSize:10,padding:'3px 9px',borderRadius:5,border:`1px solid ${C.brd}`,background:'#fff',cursor:'pointer',color:C.txt2,outline:'none'}}>↺ Template</button>
                <button onClick={()=>{setJson('');setStep(1);setResult(null)}} style={{fontSize:10,padding:'3px 9px',borderRadius:5,border:`1px solid ${C.brd}`,background:'#fff',cursor:'pointer',color:C.txt2,outline:'none'}}>🗑 Limpar</button>
              </div>
            </div>
            <textarea value={json} onChange={e=>onChange(e.target.value)} spellCheck={false}
              style={{width:'100%',height:260,padding:'12px 14px',fontFamily:'"JetBrains Mono","Courier New",monospace',fontSize:11.5,background:'#0f172a',color:'#e2e8f0',border:'none',outline:'none',resize:'vertical',boxSizing:'border-box',lineHeight:1.6,display:'block'}}/>
            <div style={{padding:'6px 12px',background:lvc.bg,borderTop:`1px solid ${lvc.brd}`,fontSize:10.5,color:lvc.col,fontFamily:'monospace',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:lvc.col,flexShrink:0,opacity:lv.state==='idle'?.4:1}}/>
              {lv.msg}
            </div>
            {lv.errors.length>0&&lv.state==='err'&&(
              <div style={{padding:'6px 12px',borderTop:`1px solid ${C.brd}`,background:'#fff5f5'}}>
                {lv.errors.slice(0,5).map((e,i)=>(
                  <div key={i} style={{display:'flex',gap:8,padding:'2px 0',fontSize:10}}>
                    <span style={{fontFamily:'monospace',fontWeight:700,color:C.red,minWidth:36}}>{e.cod}</span>
                    <span style={{color:C.txt}}>{e.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {parseErr&&<div style={{padding:'10px 14px',background:'#fef2f2',border:`1px solid ${C.redbrd}`,borderRadius:8,fontSize:12,color:C.red,marginBottom:10}}>❌ {parseErr}</div>}

          {/* Result */}
          {result&&(
            <div style={{background:C.bg2,border:`1px solid ${stC}40`,borderRadius:10,overflow:'hidden',marginBottom:10}}>
              <div style={{padding:'10px 14px',background:stC+'10',borderBottom:`1px solid ${stC}30`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12,fontWeight:800,color:C.txt}}>Resultado — CADOC {sel}</span>
                  <span style={{fontSize:10,fontFamily:'monospace',color:C.txt3}}>{result.filename}</span>
                </div>
                <span style={{fontSize:11,fontWeight:800,color:stC,padding:'3px 10px',background:stC+'15',borderRadius:5,border:`1px solid ${stC}40`}}>{stL}</span>
              </div>
              {/* Tabs */}
              <div style={{display:'flex',background:C.bg3,borderBottom:`1px solid ${C.brd}`}}>
                {(['resumo','erros','preview'] as const).map(tab=>(
                  <button key={tab} onClick={()=>setResTab(tab)} style={{flex:1,padding:'7px 4px',textAlign:'center',fontSize:9,fontWeight:600,color:resTab===tab?C.grn:C.txt3,cursor:'pointer',border:'none',borderBottom:resTab===tab?`2px solid ${C.grn}`:'2px solid transparent',background:'transparent',letterSpacing:'.4px',textTransform:'uppercase',outline:'none'}}>
                    {tab==='resumo'?'Resumo':tab==='erros'?`Erros/Avisos${result.nErros+result.nAvisos>0?` (${result.nErros+result.nAvisos})`:''}`:sel==='6334'?'10 TXTs':'Preview XML'}
                  </button>
                ))}
              </div>
              <div style={{padding:12}}>
                {/* KPIs */}
                <div style={{display:'flex',gap:16,marginBottom:10,alignItems:'center',flexWrap:'wrap'}}>
                  {([['Operações',result.resumo?.totalOps??result.resumo?.totalCli??result.resumo?.totalContas??0,C.cyn],['Erros',result.nErros,result.nErros>0?C.red:C.grn],['Avisos',result.nAvisos,result.nAvisos>0?C.amb:C.grn]] as [string,number,string][]).map(([l,v,c])=>(
                    <div key={l} style={{textAlign:'center',minWidth:56}}>
                      <div style={{fontSize:20,fontWeight:900,color:c,fontFamily:'monospace'}}>{v}</div>
                      <div style={{fontSize:9,color:C.txt3}}>{l}</div>
                    </div>
                  ))}
                  {(result.nErros>0||result.nAvisos>0)&&(
                    <button onClick={()=>{
                      const rows=[['Severidade','Código','Mensagem','Operação'].join(';'),...result.erros.map(e=>`"ERRO";"${e.cod}";"${e.msg.replace(/"/g,'""')}";"${e.op||''}"`),  ...(result.avisos||[]).map(a=>`"AVISO";"${a.cod}";"${a.msg.replace(/"/g,'""')}";"${a.op||''}"`)]
                      const b=new Blob(['\uFEFF'+rows.join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`validacoes_${sel}.csv`;a.click();URL.revokeObjectURL(a.href)
                    }} style={{marginLeft:'auto',fontSize:10,padding:'4px 10px',borderRadius:5,border:`1px solid ${C.grn}`,background:C.grnb,cursor:'pointer',color:C.grn,outline:'none'}}>⬇ CSV Validações</button>
                  )}
                </div>

                {resTab==='resumo'&&(
                  <div>
                    {sel==='3044'&&result.resumo&&(
                      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginBottom:10}}>
                        {([['Operações',result.resumo.totalOps,C.cyn],['Pagamentos',result.resumo.nPagamentos,C.grn],['Concessões',result.resumo.nConcessoes,C.pnk],['Exclusões',result.resumo.nExclusoes,C.txt3],['Saldo Total',null,C.amb]] as any[]).map(([l,v,c]:any,i:number)=>v!==null&&(
                          <div key={l} style={{padding:'7px',background:C.bg3,border:`1px solid ${C.brd}`,borderRadius:6,textAlign:'center'}}>
                            <div style={{fontSize:16,fontWeight:800,color:c,fontFamily:'monospace'}}>{v}</div>
                            <div style={{fontSize:8,color:C.txt3}}>{l}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.resumo?.totalPag>0&&<div style={{fontSize:11,color:C.txt3,marginBottom:6}}>💳 Total pago: <strong style={{color:C.grn}}>{fmtV(result.resumo.totalPag)}</strong>{result.resumo?.totalConc>0&&<> · 🏦 Concedido: <strong style={{color:C.pnk}}>{fmtV(result.resumo.totalConc)}</strong></>}</div>}
                    {sel==='3040'&&result.resumo&&<div style={{fontSize:11,color:C.txt3}}><strong>{result.resumo.totalCli}</strong> cliente(s) · <strong>{result.resumo.totalOps}</strong> operação(ões)</div>}
                    {sel==='4010'&&result.resumo&&<div style={{fontSize:11,color:C.txt3}}><strong>{result.resumo.totalContas}</strong> conta(s) COSIF</div>}
                    {sel==='3060'&&result.resumo&&<div style={{fontSize:11,color:C.txt3}}>P25={result.resumo.p25}% · P50={result.resumo.p50}% · P75={result.resumo.p75}% · P100={result.resumo.p100}%</div>}
                    {sel==='6334'&&result.resumo&&<div style={{fontSize:11,color:C.txt3}}><strong>{result.resumo.totalArquivos}</strong> arquivos TXT · <strong>{result.resumo.conccred}</strong> reg. CONCCRED · <strong>{result.resumo.contatos}</strong> contatos</div>}
                    {/* 3044 ops table */}
                    {sel==='3044'&&(()=>{try{const r=parse3044(result.content);const ops=(r.operacoes||[]).slice(0,50);return(<div style={{overflowX:'auto',marginTop:10}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                        <thead><tr style={{background:C.bg3}}>{['Data Saldo','IPOC','Saldo Devedor','Atraso','Eventos','Valores'].map(h=><th key={h} style={{padding:'4px 8px',fontSize:8,textTransform:'uppercase',color:C.txt2,fontFamily:'monospace',borderBottom:`1px solid ${C.brd}`,textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {ops.map((op:any,i:number)=>op._excluir?(
                            <tr key={i} style={{background:'#fff1f0'}}><td style={{padding:'4px 8px',color:C.red,fontSize:8,fontFamily:'monospace'}}>✗ Excluir</td><td style={{padding:'4px 8px',fontFamily:'monospace',fontSize:8,color:C.txt3}}>{op.ipoc}</td><td colSpan={4}/></tr>
                          ):(
                            <tr key={i} style={{borderTop:`1px solid ${C.brd}`}}>
                              <td style={{padding:'4px 8px',fontSize:9,color:C.txt3}}>{fmtD(op.dataSaldoDevedor)}</td>
                              <td style={{padding:'4px 8px',fontFamily:'monospace',fontSize:8,color:C.txt3,maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={op.ipoc}>{op.ipoc}</td>
                              <td style={{padding:'4px 8px',fontFamily:'monospace',fontSize:9,textAlign:'right',color:C.txt}}>{fmtV(op.saldoDevedor)}</td>
                              <td style={{padding:'4px 8px',textAlign:'center'}}>{op.atraso==='S'?<span style={{color:C.red,fontWeight:700,fontSize:8}}>⚠ S</span>:<span style={{color:C.grn,fontSize:8}}>✓</span>}</td>
                              <td style={{padding:'4px 8px'}}>
                                {(op.pagamentos||[]).filter((p:any)=>p.acao!==2).length>0&&<span style={{background:'#dcfce7',color:'#166534',padding:'1px 4px',borderRadius:3,fontSize:8,fontWeight:700,marginRight:2}}>{(op.pagamentos||[]).filter((p:any)=>p.acao!==2).length} pag</span>}
                                {(op.concessoes||[]).filter((c:any)=>c.acao!==2).length>0&&<span style={{background:'#fce7f3',color:'#9d174d',padding:'1px 4px',borderRadius:3,fontSize:8,fontWeight:700}}>{(op.concessoes||[]).filter((c:any)=>c.acao!==2).length} con</span>}
                              </td>
                              <td style={{padding:'4px 8px',fontSize:8,color:C.txt3,textAlign:'right'}}>
                                {(()=>{const vP=(op.pagamentos||[]).reduce((s:number,p:any)=>s+(p.valor||0),0);const vC=(op.concessoes||[]).reduce((s:number,c:any)=>s+(c.valor||0),0);return<>{vP>0&&<div>💳 {fmtV(vP)}</div>}{vC>0&&<div>🏦 {fmtV(vC)}</div>}</>})()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>)}catch{return null}})()}
                  </div>
                )}

                {resTab==='erros'&&(
                  <div style={{maxHeight:280,overflowY:'auto'}}>
                    {result.nErros===0&&result.nAvisos===0&&<div style={{padding:16,textAlign:'center',color:C.grn,fontSize:11}}>✓ Nenhum erro ou aviso — arquivo pronto para envio!</div>}
                    {result.erros.map((e,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'48px 1fr',gap:8,padding:'5px 8px',borderBottom:`1px solid ${C.brd}`,background:'#fff5f5'}}><span style={{fontFamily:'monospace',fontWeight:700,fontSize:9,color:C.red}}>{e.cod}</span><span style={{fontSize:10,color:C.txt}}>{e.op&&<strong>{e.op}: </strong>}{e.msg}</span></div>)}
                    {result.avisos.map((a,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'48px 1fr',gap:8,padding:'5px 8px',borderBottom:`1px solid ${C.brd}`,background:'#fffbeb'}}><span style={{fontFamily:'monospace',fontWeight:700,fontSize:9,color:C.amb}}>{a.cod}</span><span style={{fontSize:10,color:C.txt}}>{a.op&&<strong>{a.op}: </strong>}{a.msg}</span></div>)}
                  </div>
                )}

                {resTab==='preview'&&(
                  <div>
                    {sel==='6334'&&result.txts&&(
                      <div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:6,marginBottom:10}}>
                          {Object.entries(result.txts).map(([k,v])=>(
                            <div key={k} style={{padding:'7px 10px',background:C.bg3,border:`1px solid ${C.grn}`,borderRadius:6,display:'flex',alignItems:'center',gap:6}}>
                              <span>✅</span>
                              <div><div style={{fontFamily:'monospace',fontSize:9.5,fontWeight:700,color:C.txt}}>{k.trim()}.TXT</div><div style={{fontSize:8,color:C.txt3}}>{v.split('\n').filter(l=>l.trim()).length} linha(s)</div></div>
                            </div>
                          ))}
                        </div>
                        <div style={{background:C.grnb,border:`1px solid ${C.grnbrd}`,borderRadius:6,padding:'8px 12px',fontSize:9.5,color:C.grn,fontFamily:'monospace'}}>💡 "Baixar 10 TXTs" faz download individual de cada arquivo no encoding ISO-8859-1</div>
                      </div>
                    )}
                    {sel!=='6334'&&(
                      <pre style={{padding:'12px 14px',fontFamily:'"JetBrains Mono","Courier New",monospace',fontSize:10,color:'#94a3b8',background:'#0f172a',borderRadius:8,maxHeight:200,overflowY:'auto',lineHeight:1.6,margin:0,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
                        {result.content.substring(0,2000)}{result.content.length>2000?'\n…(use ⬇ Baixar para o arquivo completo)':''}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
            <button onClick={generate} disabled={busy||!json.trim()} style={{padding:'9px 22px',borderRadius:8,border:'none',cursor:busy||!json.trim()?'not-allowed':'pointer',background:busy||!json.trim()?'#94a3b8':m.color,color:'#fff',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:8,outline:'none'}}>
              {busy?<><span style={{display:'inline-block',width:12,height:12,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>{loadMsg}</>:`⚙ Gerar + Validar ${sel==='3044'?'JSON':'XML'}`}
            </button>
            {result&&step>=3&&<button onClick={download} style={{padding:'9px 22px',borderRadius:8,border:`1px solid ${C.grn}`,cursor:'pointer',background:C.grnb,color:C.grn,fontSize:12,fontWeight:700,outline:'none'}}>⬇ {sel==='6334'?'Baixar 10 TXTs':sel==='3044'?'Baixar JSON':'Baixar XML'}</button>}
            {step===4&&<span style={{fontSize:11,color:C.grn,fontWeight:700}}>✓ Arquivo exportado com sucesso</span>}
          </div>

          {/* Audit */}
          {audit.length>0&&(
            <div style={{background:C.bg2,border:`1px solid ${C.brd}`,borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'9px 12px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:11,fontWeight:700,color:C.txt}}>🔍 Trilha de Auditoria</span>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span style={{fontSize:9,color:C.txt3,fontFamily:'monospace'}}>{audit.length} registro(s) · 💾 sessão</span>
                  <button onClick={()=>setAudit([])} style={{fontSize:9,padding:'2px 6px',border:`1px solid ${C.brd}`,borderRadius:4,background:'none',cursor:'pointer',color:C.txt3,outline:'none'}}>🗑 Limpar</button>
                </div>
              </div>
              {audit.slice(0,10).map((h,i)=>(
                <div key={i} style={{display:'flex',gap:10,padding:'7px 12px',borderBottom:i<audit.length-1?`1px solid ${C.brd}`:'none',alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{fontFamily:'monospace',fontSize:9,color:C.txt3,minWidth:130}}>{h.ts}</span>
                  <span style={{fontSize:10,color:C.txt,flex:1}}>{h.acao}</span>
                  {h.cnpj&&<span style={{fontFamily:'monospace',fontSize:9,color:C.txt3}}>{h.cnpj} · {h.dtBase}</span>}
                  <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:3,fontFamily:'monospace',
                    background:h.status==='APROVADO'?C.grnb:h.status==='REPROVADO'?C.redb:h.status==='EXPORTADO'?C.blub:C.ambb,
                    color:h.status==='APROVADO'?C.grn:h.status==='REPROVADO'?C.red:h.status==='EXPORTADO'?C.blu:C.amb}}>
                    {h.status}{h.nErros>0?` · ${h.nErros}E`:''}{h.nAvisos>0?` ${h.nAvisos}A`:''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
