'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type CadocCode = '3040'|'3044'|'4010'|'3060'|'6334'
type StepId = 1|2|3|4
interface ValErr { cod: string; tipo: 'erro'|'aviso'; msg: string; campo?: string; arquivo?: string }
interface AuditEntry { ts: string; cadoc: string; cnpj: string; dtBase: string; status: string; nErros: number; nAvisos: number }

// ─── Templates JSON por CADOC ─────────────────────────────────────────────────
const TEMPLATES: Record<CadocCode, object> = {
  '3044': {
    cnpjIF: '17887874', dataHoraRemessa: '2026-03-17 10:00:00', envia3050: 'N',
    operacoes: [
      { acao:1, ipoc:'1788787402112620317C0001', saldoDevedor:45000.00, dataSaldoDevedor:'2026-03-14', atraso:'N', pagamentos:[{acao:1,data:'2026-03-14',valor:5000.00}] },
      { acao:1, ipoc:'1788787402112620317C0002', saldoDevedor:80000.00, dataSaldoDevedor:'2026-03-12', atraso:'N', concessoes:[{acao:1,data:'2026-03-12',valor:80000.00}] },
      { acao:1, ipoc:'1788787402112620317C0007', saldoDevedor:12000.00, dataSaldoDevedor:'2026-03-11', atraso:'S', pagamentos:[{acao:1,data:'2026-03-11',valor:1500.00}] },
      { acao:2, ipoc:'1788787402112620317C9999' },
    ]
  },
  '3040': {
    cabecalho: { CNPJ:'12345678', DtBase:'2026-01-31', Parte:'1', Remessa:'1', TpArq:'M', NomeResp:'João Silva', EmailResp:'joao@banco.com.br', TelResp:'11999990000', TotalCli:2, MetodApPE:'S', MetodDifTJE:'N' },
    clientes: [
      { Cd:'12345678000190', Tp:'2', IniRelactCli:'2020-01-01', Autorzc:'S', ClassCli:'A', TpCtrl:'1', PorteCli:'3', FatAnual:5000000,
        operacoes:[{ IPOC:'1234567800019020200101001', Contrt:'CONT-2024-001', Mod:'0202', NatuOp:'01', OrigemRec:'1', Indx:'3', VarCamb:'0', CEP:'01310100', TaxEft:18.50, DtContr:'2024-06-01', DtVencOp:'2027-06-01', VlrContr:50000, ClassOp:'A', ProvConsttd:500, DiaAtraso:0, vencimentos:{v110:25000,v120:25000}, ContInstFinRes4966:{ClasAtFin:'1',CartProvMin:'A',VlrContBr:50000,VlrPerdaAcum:0} }]
      },
      { Cd:'98765432100', Tp:'1', IniRelactCli:'2021-03-15', Autorzc:'S', ClassCli:'AA',
        operacoes:[{ IPOC:'1234567800019020210315002', Contrt:'CONT-2024-002', Mod:'0202', NatuOp:'01', OrigemRec:'1', Indx:'3', VarCamb:'0', CEP:'01310100', TaxEft:12.00, DtContr:'2024-01-15', DtVencOp:'2026-01-15', VlrContr:15000, ClassOp:'AA', ProvConsttd:0, DiaAtraso:0, vencimentos:{v110:15000}, ContInstFinRes4966:{ClasAtFin:'1',CartProvMin:'AA',VlrContBr:15000,VlrPerdaAcum:0} }]
      }
    ]
  },
  '4010': {
    cabecalho: { codigoDocumento:'4010', cnpj:'12345678', dataBase:'202601', tipoRemessa:'N' },
    contas: [
      {codigoConta:'1.0.0.00.00-0',saldo:1500000},{codigoConta:'1.1.0.00.00-1',saldo:800000},
      {codigoConta:'2.0.0.00.00-3',saldo:1200000},{codigoConta:'3.0.0.00.00-6',saldo:250000},
    ]
  },
  '3060': {
    dataBase:'202601', codigoDocumento:'3060', cnpj:'37485267', tipoEnvio:'I',
    percentil25:12.50, percentil50:28.75, percentil75:65.30, percentil100:98.45
  },
  '6334': {
    database:{dataGeracao:'20260301',ispb:'17887874',dataBase:'202603'},
    segmentos:[{nome:'Bares e Restaurantes',descricao:'Restaurantes, bares e fast food',codigo:'402'}],
    conccred:[{ano:2026,trimestre:1,bandeira:'01',funcao:'C',qtdCredenciados:1000,qtdAtivos:800,vlrTransacoes:42500000,qtdTransacoes:14}],
    desconto:[{ano:2026,trimestre:1,funcao:'C',bandeira:'02',formaCaptura:'1',parcelas:'01',segmento:'402',txMedia:'0297',txMin:'0300',txMax:'0300',txDesvioPad:'0003',vlrTransacoes:'000000000029700',qtdTransacoes:'000000000003'}],
    intercam:[{ano:2026,trimestre:1,produto:'32',modalidade:'P',funcao:'H',bandeira:'99',formaCaptura:'1',parcelas:'01',segmento:'402',tarifaIntercambio:'1014',vlrTransacoes:'000004863349100',qtdTransacoes:'000000014271'}],
    infresta:[{ano:2026,trimestre:1,uf:'SC',totalEstab:1,capManual:0,capElet:1,capRemota:0}],
    infrterm:[{ano:2026,trimestre:1,uf:'SC',totalPOS:1,posComp:0,posChip:0,totalPDV:0}],
    lucrcred:[{ano:2026,trimestre:1,recTaxaDesc:'000000000000',recAlugEquip:'000000000000',recOutras:'000000000000',custIntercambio:'000000000000',custMktProp:'000000000000',custBandeiras:'000000000000',custRiscos:'000000000000',custFrontBack:'000000000000',custOutros:'000000000000'}],
    ranking:[],
    contatos:[
      {ano:2026,trimestre:1,tipo:'D',nome:'João Silva Santos',cargo:'Diretor Executivo',telefone:'+5511999990000',email:'joao@banco.com.br'},
      {ano:2026,trimestre:1,tipo:'T',nome:'Maria Costa',cargo:'Gerente Tecnologia',telefone:'+5511999991111',email:'maria@banco.com.br'},
      {ano:2026,trimestre:1,tipo:'I',nome:'',cargo:'',telefone:'',email:'contato@banco.com.br'},
    ]
  },
}

// ─── Motor de validação ────────────────────────────────────────────────────────
function validar(cadoc: CadocCode, json: string): { erros: ValErr[]; avisos: ValErr[] } {
  const erros: ValErr[] = []
  const avisos: ValErr[] = []
  const e = (cod: string, msg: string, campo?: string, arquivo?: string) => erros.push({ cod, tipo:'erro', msg, campo, arquivo })
  const w = (cod: string, msg: string, campo?: string, arquivo?: string) => avisos.push({ cod, tipo:'aviso', msg, campo, arquivo })

  let obj: any
  try { obj = JSON.parse(json) } catch(ex: any) { e('B01', 'JSON inválido: ' + ex.message); return { erros, avisos } }

  if (cadoc === '3044') {
    if (!obj.cnpjIF)             e('B01', 'cnpjIF ausente')
    else if (!/^\d{8}$/.test(String(obj.cnpjIF))) e('B01', 'cnpjIF deve ter 8 dígitos')
    if (!obj.dataHoraRemessa)    e('B01', 'dataHoraRemessa ausente')
    if (!obj.envia3050)          e('B01', 'envia3050 ausente (S ou N)')
    const ops = obj.operacoes || []
    if (!ops.length) w('B01', 'operacoes vazio')
    const seen = new Set<string>()
    ops.forEach((op: any, i: number) => {
      const lbl = `operacoes[${i}]`
      if (!op.ipoc) e('B01', 'ipoc ausente', 'ipoc', lbl)
      if (op.acao === undefined) e('B01', 'acao ausente (1=incluir, 2=excluir)', 'acao', lbl)
      if (op.acao === 1) {
        if (op.saldoDevedor === undefined) e('T01', 'saldoDevedor ausente', 'saldoDevedor', lbl)
        if (!op.dataSaldoDevedor) e('T01', 'dataSaldoDevedor ausente', 'dataSaldoDevedor', lbl)
        if (!op.atraso) e('T01', 'atraso ausente (S ou N)', 'atraso', lbl)
        if (op.atraso && !['S','N'].includes(op.atraso)) e('T02', 'atraso inválido — deve ser S ou N', 'atraso', lbl)
      }
      if (op.ipoc && seen.has(op.ipoc)) e('T05', 'IPOC duplicado: ' + op.ipoc, 'ipoc', lbl)
      if (op.ipoc) seen.add(op.ipoc)
    })
  }

  if (cadoc === '3040') {
    const h = obj.cabecalho || {}
    if (!h.CNPJ)    e('B01', 'cabecalho.CNPJ ausente')
    if (!h.DtBase)  e('B01', 'cabecalho.DtBase ausente')
    if (!h.MetodApPE) e('B01', 'cabecalho.MetodApPE ausente')
    if (h.DtBase && !/^\d{4}-\d{2}-\d{2}$/.test(h.DtBase)) e('F02', 'DtBase formato inválido — use AAAA-MM-DD')
    const clis = obj.clientes || []
    if (!clis.length) e('B01', 'clientes vazio')
    const cliSeen = new Set<string>()
    clis.forEach((cli: any, ci: number) => {
      const cl = `clientes[${ci}]`
      if (!cli.Cd) e('B01', 'Cd (CPF/CNPJ) ausente', 'Cd', cl)
      if (!cli.Tp) e('B01', 'Tp (tipo cliente) ausente', 'Tp', cl)
      if (cli.Tp === '2' && cli.Cd && !/^\d{14}$/.test(cli.Cd)) e('C01', 'PJ (Tp=2): Cd deve ter 14 dígitos (CNPJ)', 'Cd', cl)
      if (!cli.ClassCli) e('B01', 'ClassCli ausente', 'ClassCli', cl)
      if (cli.Cd && cliSeen.has(cli.Cd)) e('I03', 'Cliente duplicado: ' + cli.Cd, 'Cd', cl)
      if (cli.Cd) cliSeen.add(cli.Cd)
      const opSeen = new Set<string>()
      ;(cli.operacoes || []).forEach((op: any, oi: number) => {
        const ol = `${cl}.operacoes[${oi}]`
        if (!op.IPOC)    e('B01', 'IPOC ausente', 'IPOC', ol)
        if (!op.Mod)     e('B01', 'Mod (modalidade) ausente', 'Mod', ol)
        if (!op.ClassOp) e('B01', 'ClassOp ausente', 'ClassOp', ol)
        if (op.TaxEft !== undefined && (op.TaxEft < 0 || op.TaxEft > 9999)) e('F01', 'TaxEft fora do intervalo (0-9999%)', 'TaxEft', ol)
        if (op.DtContr && !/^\d{4}-\d{2}-\d{2}$/.test(op.DtContr)) e('F02', 'DtContr formato inválido — use AAAA-MM-DD', 'DtContr', ol)
        if (op.VlrContr === undefined) e('B01', 'VlrContr ausente', 'VlrContr', ol)
        if (!op.ContInstFinRes4966) w('C02', 'ContInstFinRes4966 ausente (exigido pela Res. 4.966)', 'ContInstFinRes4966', ol)
        if (op.IPOC && opSeen.has(op.IPOC)) e('I04', 'Operação duplicada: IPOC ' + op.IPOC, 'IPOC', ol)
        if (op.IPOC) opSeen.add(op.IPOC)
        // I01 — ClassOp × ProvConsttd
        const minPct: Record<string,number> = {AA:0,A:0.005,B:0.01,C:0.03,D:0.1,E:0.3,F:0.5,G:0.7,H:1}
        if (op.ClassOp && op.VlrContr && op.ProvConsttd !== undefined) {
          const mp = (minPct[op.ClassOp]||0) * op.VlrContr
          if (op.ProvConsttd < mp * 0.99) e('I01', `ClassOp=${op.ClassOp} exige ProvConsttd ≥ ${((minPct[op.ClassOp]||0)*100).toFixed(1)}% do contrato (mín ${mp.toFixed(2)})`, 'ProvConsttd', ol)
        }
      })
    })
  }

  if (cadoc === '4010') {
    if (!obj.cabecalho?.cnpj)     e('B01', 'cabecalho.cnpj ausente')
    if (!obj.cabecalho?.dataBase) e('B01', 'cabecalho.dataBase ausente')
    if (!Array.isArray(obj.contas) || !obj.contas.length) e('B01', 'contas ausente ou vazio')
    ;(obj.contas || []).forEach((c: any, i: number) => {
      if (!c.codigoConta) e('B01', 'codigoConta ausente', 'codigoConta', `contas[${i}]`)
      if (c.saldo === undefined) e('B01', 'saldo ausente', 'saldo', `contas[${i}]`)
    })
  }

  if (cadoc === '3060') {
    if (!obj.cnpj)     e('B01', 'cnpj ausente')
    if (!obj.dataBase) e('B01', 'dataBase ausente')
    ;['percentil25','percentil50','percentil75','percentil100'].forEach(p => {
      if (obj[p] === undefined) e('B01', p + ' ausente')
    })
    if (obj.percentil25 > obj.percentil50) e('F01', 'percentil25 > percentil50 — inválido')
    if (obj.percentil75 > obj.percentil100) e('F01', 'percentil75 > percentil100 — inválido')
  }

  if (cadoc === '6334') {
    const db = obj.database || {}
    if (!db.dataBase) e('B01', 'database.dataBase ausente', 'dataBase', 'DATABASE')
    if (!db.ispb)     e('B01', 'database.ispb ausente', 'ispb', 'DATABASE')
    const mes = parseInt(String(db.dataBase || '').slice(4,6) || '0')
    if (![3,6,9,12].includes(mes)) e('VCRD0029', 'dataBase mês deve ser 03/06/09/12 (trimestral)', 'dataBase', 'DATABASE')
    const cts = obj.contatos || []
    if (!cts.length) e('C47', 'CONTATOS vazio — obrigatório: 1 Diretor(D) + 2 Técnicos(T) + 1 E-mail institucional(I)', 'contatos', 'CONTATOS')
    else {
      if (!cts.some((c:any) => c.tipo === 'D')) e('C47', 'Falta contato Diretor (tipo=D)', 'tipo', 'CONTATOS')
      if (!cts.some((c:any) => c.tipo === 'I')) w('C47', 'Falta e-mail institucional (tipo=I)', 'tipo', 'CONTATOS')
      if (cts.filter((c:any) => c.tipo === 'T').length < 2) w('C47', 'Menos de 2 Técnicos (tipo=T)', 'tipo', 'CONTATOS')
    }
    if (!obj.lucrcred?.length) w('LUCRCRED', 'LUCRCRED sem registros — enviar mesmo zerado', '', 'LUCRCRED')
    if (!obj.conccred?.length) w('B17', 'CONCCRED sem registros', '', 'CONCCRED')
  }

  return { erros, avisos }
}

// ─── Gerador XML/JSON ──────────────────────────────────────────────────────────
function gerar(cadoc: CadocCode, obj: any): string {
  const esc = (s: any) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  const xa  = (n: string, v: any) => v !== undefined && v !== null && v !== '' ? ` ${n}="${esc(v)}"` : ''

  if (cadoc === '3040') {
    const h = obj.cabecalho || {}
    let x = `<?xml version="1.0" encoding="UTF-8"?>\n<Doc3040${xa('CNPJ',h.CNPJ)}${xa('DtBase',h.DtBase)}${xa('Parte',h.Parte||'1')}${xa('Remessa',h.Remessa||'1')}${xa('TpArq',h.TpArq||'M')}${xa('NomeResp',h.NomeResp)}${xa('EmailResp',h.EmailResp)}${xa('TelResp',h.TelResp)}${xa('TotalCli',(obj.clientes||[]).length)}${xa('MetodApPE',h.MetodApPE||'S')}${xa('MetodDifTJE',h.MetodDifTJE||'N')}>\n`
    ;(obj.clientes || []).forEach((cli: any) => {
      x += `  <Cli${xa('Cd',cli.Cd)}${xa('Tp',cli.Tp)}${xa('IniRelactCli',cli.IniRelactCli)}${xa('Autorzc',cli.Autorzc)}${xa('ClassCli',cli.ClassCli)}${xa('TpCtrl',cli.TpCtrl)}${xa('PorteCli',cli.PorteCli)}${xa('FatAnual',cli.FatAnual)}>\n`
      ;(cli.operacoes || []).forEach((op: any) => {
        x += `    <Op${xa('IPOC',op.IPOC)}${xa('Contrt',op.Contrt)}${xa('Mod',op.Mod)}${xa('NatuOp',op.NatuOp)}${xa('OrigemRec',op.OrigemRec)}${xa('Indx',op.Indx)}${xa('VarCamb',op.VarCamb)}${xa('CEP',op.CEP)}${xa('TaxEft',op.TaxEft)}${xa('DtContr',op.DtContr)}${xa('DtVencOp',op.DtVencOp)}${xa('VlrContr',op.VlrContr)}${xa('ClassOp',op.ClassOp)}${xa('ProvConsttd',op.ProvConsttd)}${xa('DiaAtraso',op.DiaAtraso)}>\n`
        if (op.vencimentos) { const v = op.vencimentos; x += `      <Venc`; Object.entries(v).forEach(([k,vv]) => { x += ` ${k}="${vv}"` }); x += ` />\n` }
        if (op.ContInstFinRes4966) { const c = op.ContInstFinRes4966; x += `      <ContInstFinRes4966${xa('ClasAtFin',c.ClasAtFin)}${xa('CartProvMin',c.CartProvMin)}${xa('VlrContBr',c.VlrContBr)}${xa('VlrPerdaAcum',c.VlrPerdaAcum)} />\n` }
        x += `    </Op>\n`
      })
      x += `  </Cli>\n`
    })
    return x + `</Doc3040>`
  }

  if (cadoc === '4010') {
    const h = obj.cabecalho || {}
    let x = `<?xml version="1.0" encoding="UTF-8"?>\n<documento${xa('codigoDocumento',h.codigoDocumento||'4010')}${xa('cnpj',h.cnpj)}${xa('dataBase',h.dataBase)}${xa('tipoRemessa',h.tipoRemessa||'N')}>\n  <contas>\n`
    ;(obj.contas||[]).forEach((c: any) => { x += `    <conta${xa('codigoConta',c.codigoConta)}${xa('saldo',c.saldo)} />\n` })
    return x + `  </contas>\n</documento>`
  }

  if (cadoc === '3060') {
    return `<?xml version="1.0" encoding="iso-8859-1"?>\n<documento${xa('dataBase',obj.dataBase)}${xa('codigoDocumento',obj.codigoDocumento||'3060')}${xa('cnpj',obj.cnpj)}${xa('tipoEnvio',obj.tipoEnvio||'I')}>\n  <percentil25>${obj.percentil25}</percentil25>\n  <percentil50>${obj.percentil50}</percentil50>\n  <percentil75>${obj.percentil75}</percentil75>\n  <percentil100>${obj.percentil100}</percentil100>\n</documento>`
  }

  if (cadoc === '3044') {
    const clean = JSON.parse(JSON.stringify(obj));
    (clean.operacoes || []).forEach((op: any) => delete op._comentario)
    return JSON.stringify(clean, null, 2)
  }

  if (cadoc === '6334') {
    const p = (s: any, n: number) => String(s||'').padEnd(n).slice(0,n)
    const pn = (s: any, n: number) => String(s||'0').padStart(n,'0').slice(0,n)
    const db = obj.database || {}
    const dg = String(db.dataGeracao || new Date().toISOString().slice(0,10).replace(/-/g,'')).slice(0,8)
    const ispb = pn(db.ispb||'',8)
    const dtb = String(db.dataBase||'')

    const lines: string[] = []
    lines.push(`DATABASE${dg}${ispb}${dtb}  `)

    const segs = obj.segmentos || []
    lines.push(`SEGMENTO${dg}${ispb}${pn(segs.length,8)}`)
    segs.forEach((s: any) => lines.push(p(s.nome||'',50)+p(s.descricao||'',250)+pn(s.codigo||'',3)))

    const ccs = obj.conccred || []
    lines.push(`CONCCRED${dg}${ispb}${pn(ccs.length,8)}`)
    ccs.forEach((r: any) => lines.push(String(r.ano||2026)+String(r.trimestre||1)+pn(r.bandeira||'99',2)+String(r.funcao||'C')+pn(r.qtdCredenciados||0,9)+pn(r.qtdAtivos||0,9)+pn(Math.round((r.vlrTransacoes||0)*100),15)+pn(r.qtdTransacoes||0,12)))

    const ds = obj.desconto || []
    lines.push(`DESCONTO${dg}${ispb}${pn(ds.length,8)}`)
    ds.forEach((r: any) => lines.push(String(r.ano||2026)+String(r.trimestre||1)+String(r.funcao||'C')+pn(r.bandeira||'99',2)+String(r.formaCaptura||'1')+pn(r.parcelas||'01',2)+pn(r.segmento||'401',3)+pn(r.txMedia||'0000',4)+pn(r.txMin||'0000',4)+pn(r.txMax||'0000',4)+pn(r.txDesvioPad||'0000',4)+pn(r.vlrTransacoes||'000000000000000',15)+pn(r.qtdTransacoes||'000000000000',12)))

    const ics = obj.intercam || []
    lines.push(`INTERCAM${dg}${ispb}${pn(ics.length,8)}`)
    ics.forEach((r: any) => lines.push(String(r.ano||2026)+String(r.trimestre||1)+pn(r.produto||'32',2)+String(r.modalidade||'P')+String(r.funcao||'H')+pn(r.bandeira||'99',2)+String(r.formaCaptura||'1')+pn(r.parcelas||'01',2)+pn(r.segmento||'401',3)+pn(r.tarifaIntercambio||'0000',4)+pn(r.vlrTransacoes||'000000000000000',15)+pn(r.qtdTransacoes||'000000000000',12)))

    const ies = obj.infresta || []
    lines.push(`INFRESTA${dg}${ispb}${pn(ies.length,8)}`)
    ies.forEach((r: any) => lines.push(String(r.ano||2026)+String(r.trimestre||1)+p(r.uf||'SP',2)+pn(r.totalEstab||0,8)+pn(r.capManual||0,8)+pn(r.capElet||0,8)+pn(r.capRemota||0,8)))

    const its = obj.infrterm || []
    lines.push(`INFRTERM${dg}${ispb}${pn(its.length,8)}`)
    its.forEach((r: any) => lines.push(String(r.ano||2026)+String(r.trimestre||1)+p(r.uf||'SP',2)+pn(r.totalPOS||0,8)+pn(r.posComp||0,8)+pn(r.posChip||0,8)+pn(r.totalPDV||0,8)))

    const lcs = obj.lucrcred || []
    lines.push(`LUCRCRED${dg}${ispb}${pn(lcs.length,8)}`)
    lcs.forEach((r: any) => lines.push(String(r.ano||2026)+String(r.trimestre||1)+pn(r.recTaxaDesc||'000000000000',12)+pn(r.recAlugEquip||'000000000000',12)+pn(r.recOutras||'000000000000',12)+pn(r.custIntercambio||'000000000000',12)+pn(r.custMktProp||'000000000000',12)+pn(r.custBandeiras||'000000000000',12)+pn(r.custRiscos||'000000000000',12)+pn(r.custFrontBack||'000000000000',12)+pn(r.custOutros||'000000000000',12)))

    lines.push(`RANKING ${dg}${ispb}00000000`)
    const cts = obj.contatos || []
    lines.push(`CONTATOS${dg}${ispb}${pn(cts.length,8)}`)
    cts.forEach((r: any) => lines.push(String(r.ano||2026)+String(r.trimestre||1)+String(r.tipo||'T')+p(r.nome||'',50)+p(r.cargo||'',50)+p(r.telefone||'',50)+p(r.email||'',50)))

    return lines.join('\n')
  }

  return ''
}

// ─── Metadados dos CADOCs ──────────────────────────────────────────────────────
const CADOCS_META: Record<CadocCode, { nome:string; per:string; quem:string; arq:string; cor:string; desc:string }> = {
  '3044': { nome:'SCR — Eventos de Crédito',           per:'Por evento · D+5 úteis', quem:'IFs com carteira de crédito', arq:'JSON via STA', cor:'#7c3aed', desc:'CADOC 3044 — IN BCB 530/2025. Reporte quase em tempo real de eventos que alteram saldo devedor. Vigente desde nov/2025.' },
  '3040': { nome:'SCR — Dados Individualizados',        per:'Mensal · D+18',           quem:'IFs com carteira de crédito', arq:'XML via STA',  cor:'#1d5fcc', desc:'CADOC 3040 — Res. CMN 3.567. Posição mensal consolidada de toda carteira de crédito ≥ R$200 por cliente.' },
  '4010': { nome:'Balancete Patrimonial — COSIF',       per:'Mensal · 9º DU',          quem:'Todas as IFs autorizadas',   arq:'XML via STA',  cor:'#0891b2', desc:'CADOC 4010 — Lei 4.595/64. Balancete mensal analítico no Plano COSIF. Base de toda a supervisão contábil do BCB.' },
  '3060': { nome:'SCR — Taxas de Juros',                per:'Semanal · D+5',           quem:'IFs com carteira de crédito', arq:'XML via STA',  cor:'#0d6e52', desc:'CADOC 3060 — Circ. BCB 4.019. Percentis semanais de taxas de juros por modalidade de crédito.' },
  '6334': { nome:'Cartões — Credenciadores (ASPB034)',  per:'Trimestral · Último DU',  quem:'Credenciadores/Adquirentes', arq:'10 TXTs ZIP',  cor:'#d97706', desc:'CADOC 6334 — IN BCB 247/2022. 10 arquivos TXT posicionais ISO-8859-1 enviados via STA.' },
}

// ─── Preenche template com dados reais da IF (Configurações) ─────────────────
function applyIFData(tmpl: object, cadoc: CadocCode, cnpj: string, ispb: string): object {
  const c8 = cnpj.slice(0, 8) || '12345678'
  const i8 = (ispb || cnpj).slice(0, 8) || '12345678'
  const deep = (o: any): any => {
    if (Array.isArray(o)) return o.map(deep)
    if (o && typeof o === 'object') {
      const n: any = {}
      for (const k in o) {
        if (k === 'CNPJ' || k === 'cnpj' || k === 'cnpjIF') n[k] = c8
        else if (k === 'ispb') n[k] = i8
        else n[k] = deep(o[k])
      }
      return n
    }
    return o
  }
  return deep(tmpl)
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function CadocsPage() {
  const [cadoc, setCadoc] = useState<CadocCode>('3044')
  const [json, setJson]   = useState(() => JSON.stringify(TEMPLATES['3044'], null, 2))
  const [step, setStep]   = useState<StepId>(1)
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState('')
  const [output, setOutput]   = useState('')
  const [erros, setErros]     = useState<ValErr[]>([])
  const [avisos, setAvisos]   = useState<ValErr[]>([])
  const [status, setStatus]   = useState<'ok'|'warn'|'err'|null>(null)
  const [resTab, setResTab]   = useState<'erros'|'preview'>('erros')
  const [audit, setAudit]     = useState<AuditEntry[]>([])
  const [lvState, setLvState] = useState<'idle'|'ok'|'warn'|'err'>('idle')
  const [lvMsg, setLvMsg]     = useState('Aguardando JSON…')
  const [jsonErr, setJsonErr] = useState('')
  const [nomeIF, setNomeIF]   = useState('')
  const [cnpjIF, setCnpjIF]   = useState('')
  const lvTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  // Carrega dados da IF das Configurações e pré-preenche o template
  useEffect(() => {
    if (typeof window === 'undefined') return
    const cnpj = localStorage.getItem('bm_cnpj') || ''
    const ispb = localStorage.getItem('bm_ispb') || cnpj
    const nome = localStorage.getItem('bm_nome') || ''
    setCnpjIF(cnpj); setNomeIF(nome)
    if (cnpj) {
      const filled = applyIFData(TEMPLATES['3044'], '3044', cnpj, ispb)
      setJson(JSON.stringify(filled, null, 2))
    }
  }, [])

  // live validate ao digitar
  const onJsonChange = useCallback((v: string) => {
    setJson(v); setStep(1); setOutput(''); setJsonErr('')
    setLvState('idle'); setLvMsg('Aguardando JSON…')
    if (lvTimer.current) clearTimeout(lvTimer.current)
    lvTimer.current = setTimeout(() => {
      if (!v.trim()) { setLvState('idle'); setLvMsg('Aguardando JSON…'); return }
      try {
        JSON.parse(v)
        const { erros: e, avisos: a } = validar(cadoc, v)
        const kb = (new TextEncoder().encode(v).length / 1024).toFixed(1)
        if (e.length) { setLvState('err');  setLvMsg(`✗ ${e.length} erro(s) — ${e[0].msg.slice(0,60)}`) }
        else if (a.length) { setLvState('warn'); setLvMsg(`⚠ ${a.length} aviso(s) · ${kb} KB`) }
        else { setLvState('ok'); setLvMsg(`✓ JSON válido · ${kb} KB`) }
      } catch(ex: any) {
        setLvState('err'); setLvMsg('✗ JSON inválido — ' + ex.message.slice(0,60))
      }
    }, 350)
  }, [cadoc])

  const selectCadoc = (c: CadocCode) => {
    setCadoc(c); setStep(1); setOutput(""); setJsonErr(""); setErros([]); setAvisos([]); setStatus(null)
    const cnpj = typeof window !== "undefined" ? (localStorage.getItem("bm_cnpj")||"") : ""
    const ispb = typeof window !== "undefined" ? (localStorage.getItem("bm_ispb")||cnpj) : cnpj
    const tmpl = cnpj ? applyIFData(TEMPLATES[c], c, cnpj, ispb) : TEMPLATES[c]
    setJson(JSON.stringify(tmpl, null, 2))
    setLvState("idle"); setLvMsg("Aguardando JSONu2026")
  }

  const gerar_e_validar = async () => {
    setJsonErr(''); setLoading(true); setStep(2)
    setLoadMsg('Convertendo JSON → ' + cadoc + '…')
    await new Promise(r => setTimeout(r, 120))

    let obj: any
    try { obj = JSON.parse(json) } catch(e: any) {
      setJsonErr('JSON inválido: ' + e.message); setStep(1); setLoading(false); return
    }

    setLoadMsg('Aplicando regras BCB…')
    await new Promise(r => setTimeout(r, 180))

    const { erros: e, avisos: a } = validar(cadoc, json)
    setErros(e); setAvisos(a)

    const out = gerar(cadoc, obj)
    setOutput(out)

    const st: 'ok'|'warn'|'err' = e.length > 0 ? 'err' : a.length > 0 ? 'warn' : 'ok'
    setStatus(st)
    setStep(3)
    setResTab(e.length > 0 ? 'erros' : 'preview')

    const meta = cadoc === '3040' ? { cnpj: obj.cabecalho?.CNPJ||'?', dtBase: obj.cabecalho?.DtBase||'?' }
               : cadoc === '3044' ? { cnpj: obj.cnpjIF||'?', dtBase: (obj.dataHoraRemessa||'').slice(0,10) }
               : cadoc === '4010' ? { cnpj: obj.cabecalho?.cnpj||'?', dtBase: obj.cabecalho?.dataBase||'?' }
               : cadoc === '3060' ? { cnpj: obj.cnpj||'?', dtBase: obj.dataBase||'?' }
               : { cnpj: obj.database?.ispb||'?', dtBase: obj.database?.dataBase||'?' }

    setAudit(prev => [{
      ts: new Date().toLocaleString('pt-BR'), cadoc,
      cnpj: meta.cnpj, dtBase: meta.dtBase,
      status: e.length>0?'REPROVADO':a.length>0?'COM_ALERTAS':'APROVADO',
      nErros: e.length, nAvisos: a.length,
    }, ...prev].slice(0, 50))

    setLoading(false)
  }

  const download = () => {
    if (!output) return
    const ext = cadoc === '3044' ? 'json' : cadoc === '6334' ? 'txt' : 'xml'
    const mime = cadoc === '3044' ? 'application/json' : cadoc === '6334' ? 'text/plain;charset=iso-8859-1' : 'application/xml'
    const blob = new Blob([output], { type: mime + ';charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `cadoc${cadoc}_${Date.now()}.${ext}`
    a.click(); URL.revokeObjectURL(a.href)
    setStep(4)
    setAudit(prev => [{ts:new Date().toLocaleString('pt-BR'),cadoc,cnpj:'',dtBase:'',status:'EXPORTADO',nErros:0,nAvisos:0},...prev].slice(0,50))
  }

  const exportCsvErros = () => {
    const rows = [['Tipo','Código','Mensagem','Campo','Arquivo'].join(';'),
      ...[...erros,...avisos].map(e => [e.tipo.toUpperCase(),e.cod,e.msg.replace(/;/g,','),e.campo||'',e.arquivo||''].join(';'))]
    const blob = new Blob(['\uFEFF'+rows.join('\n')], {type:'text/csv;charset=utf-8'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `criticas_${cadoc}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }

  const meta = CADOCS_META[cadoc]
  const stCor = status === 'err' ? '#dc2626' : status === 'warn' ? '#d97706' : status === 'ok' ? '#16a34a' : '#9ca3af'
  const lvBg  = lvState === 'ok' ? '#f0fdf4' : lvState === 'warn' ? '#fffbeb' : lvState === 'err' ? '#fef2f2' : '#f9fafb'
  const lvCor = lvState === 'ok' ? '#16a34a' : lvState === 'warn' ? '#d97706' : lvState === 'err' ? '#dc2626' : '#9ca3af'

  const STEPS = [
    { n:1, l:'Dados JSON',        d:'Edite ou cole seu JSON' },
    { n:2, l:'Geração & Validação', d:'Regras BCB aplicadas'  },
    { n:3, l:'Resultado',          d:'Erros, avisos, preview'  },
    { n:4, l:'Exportação',         d:'Download + auditoria'   },
  ]

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:'#f1f3f7', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── Coluna esquerda: steps + info ── */}
      <div style={{ width:196, flexShrink:0, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Steps */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px 0' }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, color:'#9ca3af', padding:'4px 14px 8px', textTransform:'uppercase' }}>FLUXO</div>
          {STEPS.map((s,i) => {
            const done = step > s.n; const active = step === s.n
            const cor = done ? '#16a34a' : active ? meta.cor : '#e5e7eb'
            return (
              <div key={s.n} style={{ display:'flex', gap:10, padding:'10px 14px', borderBottom: i < STEPS.length-1 ? '1px solid #f9fafb' : 'none', background: active ? meta.cor + '08' : 'transparent' }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background: done||active ? cor : '#f3f4f6', color: done||active ? '#fff' : '#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, flexShrink:0 }}>
                  {done ? '✓' : s.n}
                </div>
                <div>
                  <div style={{ fontSize:11.5, fontWeight:700, color: done||active ? '#111827' : '#9ca3af' }}>{s.l}</div>
                  <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>{s.d}</div>
                </div>
              </div>
            )
          })}
        </div>
        {/* Info do CADOC selecionado */}
        <div style={{ padding:'12px 14px', borderTop:'1px solid #f3f4f6', flexShrink:0 }}>
          <div style={{ fontSize:10, fontWeight:700, color: meta.cor, fontFamily:'monospace', marginBottom:4 }}>CADOC {cadoc}</div>
          <div style={{ fontSize:10, color:'#6b7280', lineHeight:1.6 }}>{meta.quem}</div>
          <div style={{ fontSize:9.5, fontFamily:'monospace', color:'#9ca3af', marginTop:3 }}>{meta.per}</div>
          <div style={{ fontSize:9.5, fontFamily:'monospace', color:'#9ca3af' }}>{meta.arq}</div>
        </div>
      </div>

      {/* ── Área principal ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Barra superior: IF + alerta se sem CNPJ */}
        <div style={{ padding:'8px 16px', background:'#fff', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {cnpjIF ? (
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a' }}/>
              <span style={{ fontSize:11, fontWeight:600, color:'#374151' }}>{nomeIF || 'Instituição'}</span>
              <span style={{ fontSize:10, fontFamily:'monospace', color:'#9ca3af', background:'#f3f4f6', padding:'1px 7px', borderRadius:4 }}>CNPJ {cnpjIF}</span>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 12px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:7 }}>
              <span style={{ fontSize:11, color:'#92400e' }}>⚠ CNPJ não configurado — templates usam dados de exemplo.</span>
              <a href="/dashboard/settings" style={{ fontSize:11, fontWeight:700, color:'#d97706', textDecoration:'none' }}>Configurar →</a>
            </div>
          )}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace' }}>Sem API · 100% local · sem rede</span>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#16a34a', display:'inline-block' }}/>
          </div>
        </div>

        {/* Seletor de CADOC */}
        <div style={{ padding:'10px 16px', background:'#fff', borderBottom:'1px solid #e5e7eb', flexShrink:0 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
            {(Object.keys(CADOCS_META) as CadocCode[]).map(c => {
              const m = CADOCS_META[c]; const sel = cadoc === c
              return (
                <button key={c} onClick={() => selectCadoc(c)} style={{ padding:'9px 8px', borderRadius:9, cursor:'pointer', outline:'none', textAlign:'left', border:`2px solid ${sel ? m.cor : '#e5e7eb'}`, background: sel ? m.cor+'10' : '#f9fafb', transition:'all .14s' }}>
                  <div style={{ fontSize:12, fontWeight:800, color: sel ? m.cor : '#374151', fontFamily:'monospace', marginBottom:2 }}>{c}</div>
                  <div style={{ fontSize:9.5, color: sel ? m.cor : '#9ca3af', lineHeight:1.3 }}>{m.nome.split('—')[1]?.trim() || m.nome}</div>
                  <div style={{ fontSize:8.5, color: sel ? m.cor : '#d1d5db', marginTop:3, fontFamily:'monospace' }}>{m.per.split('·')[0].trim()}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>

          {/* Editor JSON */}
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden', marginBottom:12 }}>
            <div style={{ padding:'9px 14px', background:'#f9fafb', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:9.5, fontFamily:'monospace', fontWeight:700, background: meta.cor, color:'#fff', padding:'2px 8px', borderRadius:4 }}>JSON</span>
                <span style={{ fontSize:12.5, fontWeight:600, color:'#111827' }}>Entrada — CADOC {cadoc}</span>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => { const t = JSON.stringify(TEMPLATES[cadoc],null,2); setJson(t); onJsonChange(t) }} style={{ fontSize:10.5, padding:'4px 10px', borderRadius:6, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', color:'#374151', outline:'none' }}>↺ Template</button>
                <button onClick={() => { setJson(''); setLvState('idle'); setLvMsg('Aguardando JSON…') }} style={{ fontSize:10.5, padding:'4px 10px', borderRadius:6, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', color:'#374151', outline:'none' }}>✕ Limpar</button>
              </div>
            </div>
            <textarea value={json} onChange={e => onJsonChange(e.target.value)} spellCheck={false}
              style={{ width:'100%', height:224, padding:'12px 14px', fontFamily:'"JetBrains Mono","Courier New",monospace', fontSize:12, background:'#0f172a', color:'#e2e8f0', border:'none', outline:'none', resize:'vertical', display:'block', boxSizing:'border-box', lineHeight:1.65 }}/>
            {/* Barra live validation */}
            <div style={{ padding:'7px 14px', background:lvBg, borderTop:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:lvCor, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:lvCor, fontFamily:'monospace' }}>{lvMsg}</span>
            </div>
          </div>

          {/* Erro de JSON */}
          {jsonErr && <div style={{ padding:'9px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:12, color:'#dc2626', marginBottom:12 }}>❌ {jsonErr}</div>}

          {/* Resultado */}
          {step >= 3 && status && output && (
            <div style={{ background:'#fff', border:`1px solid ${stCor}40`, borderRadius:10, overflow:'hidden', marginBottom:12 }}>
              {/* Header resultado */}
              <div style={{ padding:'10px 14px', background: stCor + '08', borderBottom:`1px solid ${stCor}25`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Resultado — CADOC {cadoc}</span>
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ fontSize:11, color:'#dc2626', fontWeight:700, fontFamily:'monospace' }}>{erros.length} erro(s)</span>
                    <span style={{ fontSize:11, color:'#d97706', fontWeight:700, fontFamily:'monospace' }}>{avisos.length} aviso(s)</span>
                  </div>
                </div>
                <span style={{ fontSize:11, fontWeight:800, padding:'4px 12px', borderRadius:6, background: stCor+'15', color: stCor, border:`1px solid ${stCor}40`, fontFamily:'monospace' }}>
                  {status === 'ok' ? '✓ APROVADO' : status === 'warn' ? '⚠ COM ALERTAS' : '✗ REPROVADO'}
                </span>
              </div>

              {/* Sub-tabs */}
              <div style={{ display:'flex', background:'#f9fafb', borderBottom:'1px solid #f3f4f6' }}>
                {[['erros',`Críticas BCB (${erros.length+avisos.length})`],['preview','Preview Arquivo']] .map(([t,l]) => (
                  <div key={t} onClick={() => setResTab(t as any)} style={{ flex:1, padding:'8px 4px', textAlign:'center', fontSize:10.5, fontWeight:600, color:resTab===t?'#0d6e52':'#9ca3af', cursor:'pointer', borderBottom:resTab===t?'2px solid #0d6e52':'2px solid transparent', marginBottom:-1, letterSpacing:'.4px', textTransform:'uppercase', userSelect:'none' }}>{l}</div>
                ))}
              </div>

              <div style={{ padding:'12px 14px' }}>
                {resTab === 'erros' && (
                  <div>
                    {erros.length === 0 && avisos.length === 0 && (
                      <div style={{ padding:'20px', textAlign:'center', color:'#16a34a', fontWeight:600 }}>✓ Nenhuma crítica BCB — arquivo pronto para envio ao STA!</div>
                    )}
                    {[...erros,...avisos].map((e,i) => (
                      <div key={i} style={{ padding:'8px 12px', borderBottom: i<erros.length+avisos.length-1?'1px solid #f9fafb':'none', background: e.tipo==='erro'?'#fef2f2':'#fffbeb', borderLeft:`3px solid ${e.tipo==='erro'?'#dc2626':'#d97706'}`, marginBottom:2, borderRadius:4 }}>
                        <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                          <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:10.5, color: e.tipo==='erro'?'#dc2626':'#d97706', minWidth:52, flexShrink:0 }}>{e.cod}</span>
                          <div>
                            <div style={{ fontSize:12, color:'#111827' }}>{e.msg}</div>
                            {(e.campo||e.arquivo) && <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace', marginTop:2 }}>{e.arquivo}{e.arquivo&&e.campo?'.':''}{e.campo}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(erros.length + avisos.length) > 0 && (
                      <button onClick={exportCsvErros} style={{ marginTop:10, padding:'6px 12px', borderRadius:7, border:'1px solid #e5e7eb', background:'#f9fafb', fontSize:11, fontWeight:600, cursor:'pointer', color:'#374151', outline:'none' }}>⬇ Exportar CSV de Críticas</button>
                    )}
                  </div>
                )}

                {resTab === 'preview' && (
                  <pre style={{ padding:12, fontFamily:'"JetBrains Mono","Courier New",monospace', fontSize:11, color:'#94a3b8', background:'#0f172a', borderRadius:8, maxHeight:260, overflowY:'auto', margin:0, whiteSpace:'pre-wrap', wordBreak:'break-all', lineHeight:1.6 }}>
                    {output.slice(0, 3000)}{output.length > 3000 ? '\n…' : ''}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:16 }}>
            <button onClick={gerar_e_validar} disabled={loading || !json.trim()} style={{ padding:'10px 22px', borderRadius:9, border:'none', cursor: loading||!json.trim() ? 'not-allowed' : 'pointer', background: loading||!json.trim() ? '#9ca3af' : `linear-gradient(135deg,${meta.cor},${meta.cor}cc)`, color:'#fff', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:8, outline:'none', boxShadow: loading||!json.trim() ? 'none' : '0 4px 14px rgba(0,0,0,.15)' }}>
              {loading ? <><span style={{ display:'inline-block', width:12, height:12, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>{loadMsg}</> : `⊠ Gerar + Validar ${cadoc}`}
            </button>
            {step >= 3 && output && (
              <button onClick={download} style={{ padding:'10px 22px', borderRadius:9, border:'1px solid #e5e7eb', cursor:'pointer', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, outline:'none' }}>
                ⬇ Baixar {cadoc === '3044' ? 'JSON' : cadoc === '6334' ? 'TXT (10 arquivos)' : 'XML'}
              </button>
            )}
            {step === 4 && <span style={{ fontSize:12, color:'#16a34a', fontWeight:700 }}>✓ Exportado com sucesso</span>}
          </div>

          {/* Trilha de Auditoria */}
          {audit.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:'#111827' }}>🔍 Trilha de Auditoria</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace' }}>{audit.length} registro(s)</span>
                  <button onClick={() => setAudit([])} style={{ fontSize:10, padding:'2px 7px', border:'1px solid #e5e7eb', borderRadius:4, background:'none', cursor:'pointer', color:'#9ca3af', outline:'none' }}>🗑</button>
                </div>
              </div>
              {audit.slice(0,8).map((h,i) => {
                const sc = h.status==='APROVADO'?'#16a34a':h.status==='EXPORTADO'?'#1d4ed8':h.status==='COM_ALERTAS'?'#d97706':'#dc2626'
                return (
                  <div key={i} style={{ display:'flex', gap:12, padding:'10px 14px', borderTop: i>0?'1px solid #f9fafb':'none', alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'monospace', fontSize:10, color:'#9ca3af', minWidth:120, flexShrink:0 }}>{h.ts}</span>
                    <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#0891b2', minWidth:38 }}>{h.cadoc}</span>
                    {h.cnpj && <span style={{ fontFamily:'monospace', fontSize:10, color:'#6b7280' }}>{h.cnpj} · {h.dtBase}</span>}
                    <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:4, background:sc+'12', color:sc, border:`1px solid ${sc}30`, fontFamily:'monospace', whiteSpace:'nowrap' }}>
                      {h.status}{h.nErros>0?` · ${h.nErros}E`:''}{ h.nAvisos>0?` ${h.nAvisos}A`:''}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
