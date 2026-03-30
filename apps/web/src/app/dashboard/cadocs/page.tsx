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

// ─── Motor de validação — regras reais SCR3040_Criticas.xls BCB ──────────────
function validar(cadoc: CadocCode, json: string): { erros: ValErr[]; avisos: ValErr[] } {
  const erros: ValErr[] = []
  const avisos: ValErr[] = []
  const e = (cod: string, msg: string, campo?: string, loc?: string) => erros.push({ cod, tipo:'erro', msg, campo, arquivo:loc })
  const w = (cod: string, msg: string, campo?: string, loc?: string) => avisos.push({ cod, tipo:'aviso', msg, campo, arquivo:loc })

  let obj: any
  try { obj = JSON.parse(json) } catch(ex: any) { e('B01', 'JSON inválido: ' + ex.message); return { erros, avisos } }

  // ── CADOC 3044 ─────────────────────────────────────────────────────────────
  if (cadoc === '3044') {
    if (!obj.cnpjIF)           e('B01', 'cnpjIF ausente — obrigatório', 'cnpjIF')
    else if (!/^\d{8}$/.test(String(obj.cnpjIF))) e('B01', 'cnpjIF deve ter exatamente 8 dígitos numéricos', 'cnpjIF')
    if (!obj.dataHoraRemessa)  e('B01', 'dataHoraRemessa ausente (formato: AAAA-MM-DD HH:MM:SS)', 'dataHoraRemessa')
    if (!obj.envia3050)        e('B01', 'envia3050 ausente — deve ser "S" ou "N"', 'envia3050')
    else if (!['S','N'].includes(obj.envia3050)) e('B01', 'envia3050 inválido — deve ser "S" ou "N"', 'envia3050')
    const ops = obj.operacoes || []
    if (!ops.length) w('B17', 'operacoes vazio — arquivo não contém eventos a reportar', 'operacoes')
    const seen = new Set<string>()
    ops.forEach((op: any, i: number) => {
      const loc = `operacoes[${i}]`
      if (!op.ipoc)             e('B01', 'ipoc ausente — Identificador Padronizado de Operação de Crédito obrigatório', 'ipoc', loc)
      if (op.acao === undefined || op.acao === null) e('B01', 'acao ausente — deve ser 1 (incluir) ou 2 (excluir)', 'acao', loc)
      else if (![1,2].includes(op.acao)) e('B01', `acao inválida: ${op.acao} — deve ser 1 (incluir) ou 2 (excluir)`, 'acao', loc)
      if (op.acao === 1) {
        if (op.saldoDevedor === undefined) e('T01', 'saldoDevedor ausente — obrigatório para acao=1', 'saldoDevedor', loc)
        else if (typeof op.saldoDevedor !== 'number') e('T01', 'saldoDevedor deve ser numérico', 'saldoDevedor', loc)
        if (!op.dataSaldoDevedor) e('T01', 'dataSaldoDevedor ausente — formato AAAA-MM-DD', 'dataSaldoDevedor', loc)
        else if (!/^\d{4}-\d{2}-\d{2}$/.test(op.dataSaldoDevedor)) e('F02', 'dataSaldoDevedor formato inválido — use AAAA-MM-DD', 'dataSaldoDevedor', loc)
        if (!op.atraso)         e('T01', 'atraso ausente — deve ser "S" ou "N"', 'atraso', loc)
        else if (!['S','N'].includes(op.atraso)) e('T02', `atraso inválido: "${op.atraso}" — deve ser "S" ou "N"`, 'atraso', loc)
      }
      if (op.ipoc && seen.has(op.ipoc)) e('I14', `IPOC duplicado na remessa: ${op.ipoc}`, 'ipoc', loc)
      if (op.ipoc) seen.add(op.ipoc)
    })
    return { erros, avisos }
  }

  // ── CADOC 4010 ─────────────────────────────────────────────────────────────
  if (cadoc === '4010') {
    if (!obj.cabecalho?.cnpj)     e('B01', 'cabecalho.cnpj ausente', 'cnpj', 'cabecalho')
    if (!obj.cabecalho?.dataBase) e('B01', 'cabecalho.dataBase ausente (formato AAAAMM)', 'dataBase', 'cabecalho')
    else if (!/^\d{6}$/.test(String(obj.cabecalho.dataBase))) e('F02', 'cabecalho.dataBase deve ter 6 dígitos (AAAAMM)', 'dataBase', 'cabecalho')
    if (!obj.cabecalho?.tipoRemessa) e('B01', 'cabecalho.tipoRemessa ausente ("N" = normal, "S" = substituição)', 'tipoRemessa', 'cabecalho')
    if (!Array.isArray(obj.contas) || !obj.contas.length) e('B17', 'contas ausente ou vazio — arquivo deve conter contas COSIF', 'contas')
    ;(obj.contas || []).forEach((c: any, i: number) => {
      const loc = `contas[${i}]`
      if (!c.codigoConta) e('B01', 'codigoConta ausente', 'codigoConta', loc)
      if (c.saldo === undefined || c.saldo === null) e('B01', 'saldo ausente', 'saldo', loc)
      else if (typeof c.saldo !== 'number') e('F01', 'saldo deve ser numérico', 'saldo', loc)
    })
    return { erros, avisos }
  }

  // ── CADOC 3060 ─────────────────────────────────────────────────────────────
  if (cadoc === '3060') {
    if (!obj.cnpj)     e('B01', 'cnpj ausente', 'cnpj')
    if (!obj.dataBase) e('B01', 'dataBase ausente (formato AAAAMM)', 'dataBase')
    ;['percentil25','percentil50','percentil75','percentil100'].forEach(p => {
      if (obj[p] === undefined) e('B01', `${p} ausente`, p)
      else if (typeof obj[p] !== 'number') e('F01', `${p} deve ser numérico`, p)
    })
    if (obj.percentil25 > obj.percentil50) e('F01', 'P25 > P50 — percentis devem ser crescentes', 'percentil25')
    if (obj.percentil50 > obj.percentil75) e('F01', 'P50 > P75 — percentis devem ser crescentes', 'percentil50')
    if (obj.percentil75 > obj.percentil100) e('F01', 'P75 > P100 — percentis devem ser crescentes', 'percentil75')
    return { erros, avisos }
  }

  // ── CADOC 6334 ─────────────────────────────────────────────────────────────
  if (cadoc === '6334') {
    const db = obj.database || {}
    if (!db.dataBase) e('B01', 'database.dataBase ausente', 'dataBase', 'DATABASE')
    if (!db.ispb)     e('B01', 'database.ispb ausente', 'ispb', 'DATABASE')
    const mes = parseInt(String(db.dataBase || '').slice(4,6) || '0')
    if (![3,6,9,12].includes(mes)) e('VCRD0029', `dataBase mês ${String(mes).padStart(2,'0')} inválido — CADOC 6334 é trimestral: mês deve ser 03, 06, 09 ou 12`, 'dataBase', 'DATABASE')
    const cts = obj.contatos || []
    if (!cts.length) e('C47', 'CONTATOS vazio — obrigatório: 1 Diretor (D) + 2 Técnicos (T) + 1 e-mail institucional (I)', 'contatos', 'CONTATOS')
    else {
      if (!cts.some((c:any) => c.tipo === 'D')) e('C47', 'Falta contato Diretor (tipo="D") — obrigatório pelo leiaute BCB', 'tipo', 'CONTATOS')
      if (!cts.some((c:any) => c.tipo === 'I')) w('C47', 'Falta e-mail institucional (tipo="I") — recomendado pelo BCB', 'tipo', 'CONTATOS')
      if (cts.filter((c:any) => c.tipo === 'T').length < 2) w('C47', `Apenas ${cts.filter((c:any)=>c.tipo==='T').length} técnico(s) — BCB recomenda 2 (tipo="T")`, 'tipo', 'CONTATOS')
      cts.forEach((c:any, i:number) => {
        if (!c.nome?.trim()) w('C47', `contatos[${i}]: nome vazio`, 'nome', 'CONTATOS')
        if (!c.email?.trim()) w('C47', `contatos[${i}]: email vazio`, 'email', 'CONTATOS')
      })
    }
    if (!obj.lucrcred?.length) w('LUCRCRED', 'LUCRCRED sem registros — enviar mesmo zerado conforme leiaute BCB', '', 'LUCRCRED')
    if (!obj.conccred?.length) w('B17', 'CONCCRED sem registros — arquivo deve conter credenciados', '', 'CONCCRED')
    return { erros, avisos }
  }

  // ── CADOC 3040 — REGRAS COMPLETAS SCR3040_Criticas.xls ────────────────────
  if (cadoc === '3040') {
    const h = obj.cabecalho || {}

    // ── Cabeçalho ─────────────────────────────────────────────────────────────
    // B01 / B07
    if (!h.CNPJ)    e('B01', 'cabecalho.CNPJ ausente — obrigatório (8 dígitos raiz)', 'CNPJ', 'cabecalho')
    else if (!/^\d{8}$/.test(String(h.CNPJ))) e('B01', `CNPJ "${h.CNPJ}" inválido — deve ter 8 dígitos numéricos`, 'CNPJ', 'cabecalho')
    if (!h.DtBase)  e('B01', 'cabecalho.DtBase ausente — formato AAAA-MM-DD', 'DtBase', 'cabecalho')
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(h.DtBase))) e('F02', 'DtBase formato inválido — use AAAA-MM-DD', 'DtBase', 'cabecalho')
    // C47 — TotalCli obrigatório desde 2013
    if (h.TotalCli === undefined || h.TotalCli === null || h.TotalCli === '') e('C47', 'cabecalho.TotalCli ausente — obrigatório (regra C47)', 'TotalCli', 'cabecalho')
    if (!h.MetodApPE) e('B01', 'cabecalho.MetodApPE ausente — "S" ou "N"', 'MetodApPE', 'cabecalho')
    else if (!['S','N'].includes(String(h.MetodApPE))) e('B01', `MetodApPE "${h.MetodApPE}" inválido — deve ser "S" ou "N"`, 'MetodApPE', 'cabecalho')
    if (h.TpArq && !['M','P','F'].includes(String(h.TpArq))) e('B07', `TpArq "${h.TpArq}" inválido — deve ser "M" (mensal), "P" (parcial) ou "F" (final de remessa)`, 'TpArq', 'cabecalho')
    // B17
    const clis = obj.clientes || []
    if (!clis.length) e('B17', 'Arquivo deve conter pelo menos um cliente <Cli> — arquivo vazio', 'clientes')

    // ── Totais do cabeçalho vs real ─────────────────────────────────────────
    if (h.TotalCli !== undefined && Number(h.TotalCli) !== clis.length) {
      w('B01', `TotalCli=${h.TotalCli} mas há ${clis.length} clientes no arquivo — inconsistência`, 'TotalCli', 'cabecalho')
    }

    const dtBase = h.DtBase ? new Date(h.DtBase + 'T12:00:00') : null
    const hoje   = new Date()

    const cliSeen = new Map<string, number>() // Cd+Tp → índice
    clis.forEach((cli: any, ci: number) => {
      const loc = `clientes[${ci}] (${cli.Cd || '?'})`

      // ── Campos obrigatórios do cliente ─────────────────────────────────────
      // B01
      if (!cli.Cd)           e('B01', 'Cd (CPF/CNPJ) ausente', 'Cd', loc)
      if (!cli.Tp)           e('B01', 'Tp (tipo de cliente) ausente', 'Tp', loc)
      if (!cli.IniRelactCli) e('B01', 'IniRelactCli (data de início de relacionamento) ausente — formato AAAA-MM-DD', 'IniRelactCli', loc)
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(cli.IniRelactCli)) e('F02', 'IniRelactCli formato inválido — use AAAA-MM-DD', 'IniRelactCli', loc)
      if (!cli.Autorzc)      e('B01', 'Autorzc (autorização SCR) ausente — "S" ou "N"', 'Autorzc', loc)
      else if (!['S','N'].includes(String(cli.Autorzc))) e('B01', `Autorzc "${cli.Autorzc}" inválido — deve ser "S" ou "N"`, 'Autorzc', loc)
      if (!cli.ClassCli)     e('B01', 'ClassCli (classificação do cliente) ausente', 'ClassCli', loc)
      else if (!['AA','A','B','C','D','E','F','G','H','HH'].includes(String(cli.ClassCli))) {
        e('B01', `ClassCli "${cli.ClassCli}" inválido — valores válidos: AA, A, B, C, D, E, F, G, H, HH`, 'ClassCli', loc)
      }

      // S10 — CPF/CNPJ por tipo
      if (cli.Tp === '1' && cli.Cd) {
        if (!/^\d{11}$/.test(String(cli.Cd))) e('S10', `PF (Tp=1): Cd deve ter 11 dígitos (CPF). Encontrado: "${cli.Cd}"`, 'Cd', loc)
      }
      if (cli.Tp === '2' && cli.Cd) {
        if (!/^\d{14}$/.test(String(cli.Cd))) e('S10', `PJ (Tp=2): Cd deve ter 14 dígitos (CNPJ). Encontrado: "${cli.Cd}"`, 'Cd', loc)
      }

      // C01 — TpCtrl obrigatório para PJ
      if (cli.Tp === '2' && !cli.TpCtrl) e('C01', 'TpCtrl (tipo de controle) ausente — obrigatório para pessoa jurídica (C01)', 'TpCtrl', loc)

      // C07/C08 — PorteCli
      if (cli.Tp === '2' && !cli.PorteCli) w('C07', 'PorteCli ausente — obrigatório para PJ (C07)', 'PorteCli', loc)
      if (cli.Tp === '1' && !cli.PorteCli) w('C08', 'PorteCli ausente para PF — verificar obrigatoriedade (C08)', 'PorteCli', loc)

      // C31/C45 — FatAnual obrigatório
      if (!cli.FatAnual && cli.FatAnual !== 0) w('C31', 'FatAnual (faturamento/renda mensal PF) ausente — obrigatório desde jul/2011 (C31/C45)', 'FatAnual', loc)

      // I03 — cliente duplicado
      const cliKey = `${cli.Cd}|${cli.Tp}`
      if (cliSeen.has(cliKey)) e('I03', `Cliente duplicado na remessa: Cd="${cli.Cd}", Tp="${cli.Tp}" — já informado em clientes[${cliSeen.get(cliKey)}] (I03)`, 'Cd', loc)
      else cliSeen.set(cliKey, ci)

      // ── Operações do cliente ───────────────────────────────────────────────
      const ops = cli.operacoes || []
      if (!ops.length) w('B17', 'Cliente sem operações — considere remover ou verificar (B17)', 'operacoes', loc)

      const ipocSeen   = new Set<string>()
      const contrtSeen = new Map<string, number>() // Contrt+Mod → índice op

      ops.forEach((op: any, oi: number) => {
        const ol = `${loc} > op[${oi}] (${op.IPOC || op.Contrt || '?'})`

        // B01 — campos obrigatórios de operação
        if (!op.IPOC)    e('B01', 'IPOC ausente — Identificador Padronizado de Operação de Crédito obrigatório', 'IPOC', ol)
        if (!op.Contrt)  e('B01', 'Contrt (código do contrato) ausente', 'Contrt', ol)
        if (!op.Mod)     e('B01', 'Mod (modalidade/submodalidade) ausente — ex: "0202"', 'Mod', ol)
        if (!op.NatuOp)  e('B01', 'NatuOp (natureza da operação) ausente — ex: "01"', 'NatuOp', ol)
        if (!op.OrigemRec) e('B01', 'OrigemRec (origem dos recursos) ausente', 'OrigemRec', ol)
        if (op.Indx === undefined || op.Indx === null || op.Indx === '') e('B01', 'Indx (indexador) ausente — use "3" para sem indexador', 'Indx', ol)
        if (op.VarCamb === undefined || op.VarCamb === null || op.VarCamb === '') e('B01', 'VarCamb (variação cambial) ausente — use "0" para sem variação', 'VarCamb', ol)
        if (!op.CEP)     e('B01', 'CEP ausente — 8 dígitos do CEP do tomador', 'CEP', ol)
        if (!op.DtContr) e('B01', 'DtContr (data de contratação) ausente — formato AAAA-MM-DD', 'DtContr', ol)
        if (!op.ClassOp) e('B01', 'ClassOp (classificação de risco A-H) ausente', 'ClassOp', ol)
        if (op.VlrContr === undefined) e('B01', 'VlrContr (valor contratado) ausente', 'VlrContr', ol)
        if (op.ProvConsttd === undefined) e('B01', 'ProvConsttd (provisão constituída) ausente', 'ProvConsttd', ol)
        if (op.DiaAtraso === undefined) e('B01', 'DiaAtraso (dias de atraso) ausente — informar 0 se sem atraso', 'DiaAtraso', ol)

        // F01 — TaxEft
        if (op.TaxEft !== undefined) {
          if (typeof op.TaxEft !== 'number') e('F01', 'TaxEft deve ser numérico (taxa % a.a.)', 'TaxEft', ol)
          else if (op.TaxEft < 0 || op.TaxEft > 9999) e('F01', `TaxEft=${op.TaxEft} fora do intervalo válido (0 a 9999% a.a.) — F01`, 'TaxEft', ol)
        } else w('B01', 'TaxEft (taxa efetiva a.a.) ausente', 'TaxEft', ol)

        // F02 — Datas
        if (op.DtContr && !/^\d{4}-\d{2}-\d{2}$/.test(String(op.DtContr))) e('F02', 'DtContr formato inválido — use AAAA-MM-DD (F02)', 'DtContr', ol)
        if (op.DtVencOp && !/^\d{4}-\d{2}-\d{2}$/.test(String(op.DtVencOp))) e('F02', 'DtVencOp formato inválido — use AAAA-MM-DD (F02)', 'DtVencOp', ol)

        // S14 — DtVencOp >= DtContr
        if (op.DtContr && op.DtVencOp && op.DtVencOp < op.DtContr) {
          e('S14', `DtVencOp (${op.DtVencOp}) anterior a DtContr (${op.DtContr}) — data de vencimento deve ser >= contratação (S14)`, 'DtVencOp', ol)
        }

        // S15 — DtContr <= hoje
        if (op.DtContr && dtBase) {
          const dtContr = new Date(op.DtContr + 'T12:00:00')
          if (dtContr > hoje) e('S15', `DtContr (${op.DtContr}) futura — não pode ser posterior à data atual (S15)`, 'DtContr', ol)
        }

        // C11 — DtVencOp obrigatória (exceto v199)
        const venc = op.vencimentos || {}
        const hasV199 = venc.v199 !== undefined && venc.v199 > 0
        if (!op.DtVencOp && !hasV199) e('C11', 'DtVencOp ausente — obrigatória exceto para operações com vencimento v199 (C11)', 'DtVencOp', ol)

        // C28 — VlrContr obrigatório para modalidades não rotativas com vencimentos > v80
        const modStr = String(op.Mod || '')
        const isRotativo = ['0101','0210','0213','0214','0217','0406','1304'].includes(modStr) || modStr.startsWith('19')
        const hasVenc80Plus = Object.keys(venc).some(k => {
          const n = parseInt(k.replace('v',''))
          return n > 80 && (venc[k] || 0) > 0
        })
        if (!isRotativo && hasVenc80Plus && (op.VlrContr === undefined || op.VlrContr === 0)) {
          e('C28', `VlrContr obrigatório para modalidade ${op.Mod} não rotativa com vencimentos > v80 (C28)`, 'VlrContr', ol)
        }

        // ClassOp — validação de domínio
        if (op.ClassOp && !['AA','A','B','C','D','E','F','G','H','HH'].includes(String(op.ClassOp))) {
          e('B01', `ClassOp "${op.ClassOp}" inválido — valores: AA, A, B, C, D, E, F, G, H, HH`, 'ClassOp', ol)
        }

        // I01 — ClassOp × ProvConsttd × ∑VlrVenc
        // NOTA: Regra I01 marcada como "n" (desabilitada) no XLS mas amplamente aplicada como aviso de qualidade
        const vlrVenc = Object.entries(venc).reduce((sum: number, [k,v]: [string,any]) => {
          const n = parseInt(k.replace('v',''))
          // Não contar vencimentos de limite (20, 40) nem a liberar (60, 80)
          if ([20,40,60,80].includes(n)) return sum
          return sum + (Number(v) || 0)
        }, 0)
        const vlrBase = vlrVenc > 0 ? vlrVenc : (op.VlrContr || 0)
        const minPct: Record<string,number> = {AA:0, A:0.005, B:0.01, C:0.03, D:0.1, E:0.3, F:0.5, G:0.7, H:1}
        const maxPct: Record<string,number> = {AA:0.005, A:0.01, B:0.03, C:0.1, D:0.3, E:0.5, F:0.7, G:1, H:Infinity}
        if (op.ClassOp && op.ProvConsttd !== undefined && vlrBase > 0 && op.ClassOp !== 'HH') {
          const cl = String(op.ClassOp)
          const pMin = (minPct[cl] || 0) * vlrBase
          const pMax = (maxPct[cl] || Infinity) * vlrBase
          const prov = Number(op.ProvConsttd) || 0
          if (prov < pMin * 0.99) {
            w('I01', `ClassOp=${cl} exige ProvConsttd ≥ ${((minPct[cl]||0)*100).toFixed(1)}% da carteira. Esperado ≥ R$${pMin.toFixed(2)}, informado R$${prov.toFixed(2)} (I01 — alerta de qualidade)`, 'ProvConsttd', ol)
          } else if (pMax !== Infinity && prov >= pMax * 1.01) {
            w('I01', `ClassOp=${cl} exige ProvConsttd < ${((maxPct[cl]||0)*100).toFixed(1)}% da carteira. Esperado < R$${pMax.toFixed(2)}, informado R$${prov.toFixed(2)} (I01)`, 'ProvConsttd', ol)
          }
        }
        if (op.ClassOp === 'HH' && (op.ProvConsttd || 0) !== 0) {
          w('I01', `ClassOp=HH (baixado como prejuízo): ProvConsttd deve ser 0, informado R$${op.ProvConsttd} (I01)`, 'ProvConsttd', ol)
        }

        // S20 — ClassOp HH e vencimentos de prejuízo (310, 320, 330)
        const hasVencPrejuizo = (venc.v310||0) > 0 || (venc.v320||0) > 0 || (venc.v330||0) > 0
        if (hasVencPrejuizo && op.ClassOp !== 'HH') {
          e('S20', `Vencimentos de prejuízo (v310/v320/v330) exigem ClassOp=HH. Informado: ${op.ClassOp} (S20)`, 'ClassOp', ol)
        }

        // C33 / S28 — DiaAtraso compatível com vencimentos
        const diaAtraso = Number(op.DiaAtraso) || 0
        if (diaAtraso === 0) {
          // Não pode ter vencimentos vencidos (v205+)
          const hasVencVencido = Object.keys(venc).some(k => {
            const n = parseInt(k.replace('v',''))
            return n >= 205 && n <= 330 && (venc[k] || 0) > 0
          })
          if (hasVencVencido) e('S28', 'DiaAtraso=0 mas há vencimentos vencidos (v205 ou superior) — inconsistência (S28/C33)', 'DiaAtraso', ol)
        } else {
          // S29 — vencimentos de prejuízo exigem DiaAtraso mínimo
          if ((venc.v310||0) > 0 && diaAtraso <= 180) e('S29', `v310 (prejuízo) exige DiaAtraso > 180. Informado: ${diaAtraso} (S29)`, 'DiaAtraso', ol)
          if ((venc.v320||0) > 0 && diaAtraso <= 540) e('S29', `v320 (prejuízo) exige DiaAtraso > 540. Informado: ${diaAtraso} (S29)`, 'DiaAtraso', ol)
          if ((venc.v330||0) > 0 && diaAtraso <= 1620) e('S29', `v330 (prejuízo) exige DiaAtraso > 1620. Informado: ${diaAtraso} (S29)`, 'DiaAtraso', ol)
        }

        // S13 — garantidor não pode ser o próprio cliente
        ;(op.garantias || []).forEach((g: any, gi: number) => {
          if (g.Ident && cli.Cd && String(g.Ident) === String(cli.Cd)) {
            e('S13', `Garantidor fidejussório (Ident="${g.Ident}") igual ao cliente — autogarantia proibida (S13)`, 'Ident', `${ol} > garantias[${gi}]`)
          }
        })

        // I04 — operação duplicada (IPOC)
        if (op.IPOC) {
          if (ipocSeen.has(op.IPOC)) e('I04', `IPOC duplicado para o mesmo cliente: "${op.IPOC}" (I04)`, 'IPOC', ol)
          else ipocSeen.add(op.IPOC)
        }

        // I04b — Contrt+Mod duplicado
        if (op.Contrt && op.Mod) {
          const opKey = `${op.Contrt}|${op.Mod}`
          if (contrtSeen.has(opKey)) e('I04', `Contrt+Mod duplicado: "${op.Contrt}" Mod="${op.Mod}" já informado em op[${contrtSeen.get(opKey)}] (I04)`, 'Contrt', ol)
          else contrtSeen.set(opKey, oi)
        }

        // F03 — Código do contrato não pode ser só espaços
        if (op.Contrt !== undefined && String(op.Contrt).trim() === '') {
          e('F03', 'Contrt não pode ser preenchido apenas com espaços em branco (F03)', 'Contrt', ol)
        }

        // C33 — DiaAtraso obrigatório somente para operações vencidas (v205–v330)
        const hasVencidos = Object.keys(venc).some(k => {
          const n = parseInt(k.replace('v',''))
          return n >= 205 && n <= 330 && (Number(venc[k])||0) > 0
        })
        if (hasVencidos && (op.DiaAtraso === undefined || op.DiaAtraso === null)) {
          e('C33', 'DiaAtraso obrigatório quando há vencimentos vencidos (v205 a v330) — C33', 'DiaAtraso', ol)
        }
        if (!hasVencidos && (op.DiaAtraso !== undefined && Number(op.DiaAtraso) > 0)) {
          w('C33', 'DiaAtraso > 0 mas não há vencimentos vencidos (v205+) — verifique consistência (C33)', 'DiaAtraso', ol)
        }

        // C45 — FatAnual (renda mensal PF) obrigatório para PF desde jul/2011
        if (cli.Tp === '1' && !cli.FatAnual && cli.FatAnual !== 0) {
          e('C45', 'FatAnual (renda mensal PF) ausente — obrigatório para Tp=1,3,5 (PF) desde jul/2011 (C45)', 'FatAnual', loc)
        }

        // S69 — Compatibilidade ClassOp × ProvConsttd conforme Res. 2682 (já coberta por I01 com bandas)
        // Alias explícito para S69 — mesmas faixas do I01, apenas label diferente
        if (op.ClassOp && op.ProvConsttd !== undefined && vlrBase > 0 && op.ClassOp !== 'HH') {
          const cl69 = String(op.ClassOp)
          const minP69: Record<string,number> = {AA:0,A:0.005,B:0.01,C:0.03,D:0.1,E:0.3,F:0.5,G:0.7,H:1}
          const pMin69 = (minP69[cl69]||0) * vlrBase
          const prov69 = Number(op.ProvConsttd)||0
          if (pMin69 > 0 && prov69 < pMin69 * 0.99) {
            w('S69', `ClassOp=${cl69}: ProvConsttd (R$${prov69.toFixed(2)}) abaixo do mínimo Res. 2682/99 — mín. ${((minP69[cl69]||0)*100).toFixed(1)}% = R$${pMin69.toFixed(2)} (S69)`, 'ProvConsttd', ol)
          }
        }

        // S17 — Compatibilidade Tp × dígitos do Cd
        if (cli.Tp === '1' && cli.Cd && !/^\d{11}$/.test(String(cli.Cd))) {
          e('S17', `Tp=1 (PF): Cd deve ter 11 dígitos (CPF). Encontrado: "${cli.Cd}" (S17)`, 'Cd', ol)
        }
        if (cli.Tp === '2' && cli.Cd && !/^\d{14}$/.test(String(cli.Cd))) {
          e('S17', `Tp=2 (PJ): Cd deve ter 14 dígitos (CNPJ). Encontrado: "${cli.Cd}" (S17)`, 'Cd', ol)
        }

        // S05 — Modalidade "Limite de Crédito" (19xx) só pode ter vencimentos 20 e 40
        if (modStr.startsWith('19') && !modStr.startsWith('199')) {
          const hasNonLimit = Object.keys(venc).some(k => {
            const n = parseInt(k.replace('v',''))
            return ![20,40].includes(n) && (Number(venc[k])||0) > 0
          })
          if (hasNonLimit) e('S05', `Modalidade ${op.Mod} (Limite de Crédito/19xx) só pode ter vencimentos v20 e v40 (S05)`, 'vencimentos', ol)
        }

        // S06 — Vencimentos v20/v40 só podem existir na modalidade 19xx
        const hasLimitVenc = (Number(venc.v20)||0) > 0 || (Number(venc.v40)||0) > 0
        if (hasLimitVenc && !modStr.startsWith('19')) {
          e('S06', `v20/v40 (limite de crédito) só são válidos para modalidade 19xx. Modalidade informada: ${op.Mod} (S06)`, 'vencimentos', ol)
        }

        // S19 — Data-base mínima admissível (set/2010)
        if (h.DtBase && h.DtBase < '2010-09-01') {
          e('S19', `DtBase ${h.DtBase} anterior à mínima admissível (set/2010) (S19)`, 'DtBase', 'cabecalho')
        }

        // S20 (reforço) — v310/v320/v330 só para ClassOp HH + DiaAtraso mínimo (S29)
        if ((Number(venc.v310)||0)>0 || (Number(venc.v320)||0)>0 || (Number(venc.v330)||0)>0) {
          if (op.ClassOp !== 'HH') {
            e('S20', `Vencimentos de prejuízo (v310/v320/v330) exigem ClassOp=HH. Informado: ${op.ClassOp} (S20)`, 'ClassOp', ol)
          }
        }

        // S21 — Coobrigação (Mod 15xx) não pode ter v310/v320/v330
        if (modStr.startsWith('15') && hasVencPrejuizo) {
          e('S21', `Modalidade ${op.Mod} (coobrigação/15xx) não pode ter vencimentos de prejuízo v310/v320/v330 (S21)`, 'vencimentos', ol)
        }

        // S22 — Coobrigação Mod 1511 não pode ter PF como devedor
        if (op.Mod === '1511' && cli.Tp === '1') {
          e('S22', 'Modalidade 1511 (coobrigação SFN) não pode ter pessoa física (Tp=1) como devedor (S22)', 'Mod', ol)
        }

        // S23 — Natureza 04 (adquirida) não pode ter PF como devedor
        if (String(op.NatuOp) === '04' && cli.Tp === '1') {
          e('S23', 'NatuOp=04 (aquisição de operações) não pode ter pessoa física (Tp=1) como devedor (S23)', 'NatuOp', ol)
        }

        // S47 — Modalidades proibidas desde fev/2014
        if (['0201','0205','0206'].includes(op.Mod)) {
          w('S47', `Modalidade ${op.Mod} está proibida desde fev/2014 — use as submodalidades substitutivas (S47)`, 'Mod', ol)
        }

        // S50 — Crédito pessoal (0202/0203) com NatuOp 01–03 exige Tp=1,3 ou 5 (PF)
        if (['0202','0203'].includes(op.Mod) && ['01','02','03'].includes(String(op.NatuOp))) {
          if (!['1','3','5'].includes(String(cli.Tp))) {
            e('S50', `Mod=${op.Mod} (crédito pessoal) com NatuOp=${op.NatuOp} exige cliente PF (Tp=1,3 ou 5). Informado Tp=${cli.Tp} (S50)`, 'Tp', ol)
          }
        }

        // S51 — Repasse interfinanceiro (1401) exige Tp=2,4 ou 6 (PJ)
        if (op.Mod === '1401' && !['2','4','6'].includes(String(cli.Tp))) {
          e('S51', `Mod=1401 (repasse interfinanceiro) exige cliente PJ (Tp=2, 4 ou 6). Informado Tp=${cli.Tp} (S51)`, 'Tp', ol)
        }

        // S56 — ClassOp=HH: vencimentos só podem ser v310/v320/v330 (baixados como prejuízo)
        if (op.ClassOp === 'HH') {
          const hasNonPrejVenc = Object.keys(venc).some(k => {
            const n = parseInt(k.replace('v',''))
            return ![310,320,330].includes(n) && (Number(venc[k])||0) > 0
          })
          if (hasNonPrejVenc) {
            e('S56', 'ClassOp=HH (baixado como prejuízo): vencimentos só podem ser v310, v320 ou v330 (S56)', 'vencimentos', ol)
          }
        }

        // S69 — Compatibilidade ClassOp × ProvConsttd (estrito por Res. 2682)
        // Já coberta por I01 acima

        // S81 — IPOC: data de contratação embutida deve ser <= DtContr
        if (op.IPOC && op.DtContr) {
          // IPOC formato: CNPJ(8) + Tp(2) + DtContr(8 = AAAAMMDD) + seq(7) + complemento
          const ipocStr = String(op.IPOC)
          if (ipocStr.length >= 18) {
            const dtIPOC = ipocStr.slice(10, 18) // posições 11-18
            if (/^\d{8}$/.test(dtIPOC)) {
              const dtIPOCFmt = `${dtIPOC.slice(0,4)}-${dtIPOC.slice(4,6)}-${dtIPOC.slice(6,8)}`
              if (dtIPOCFmt > op.DtContr) {
                w('S81', `IPOC contém data ${dtIPOCFmt} posterior a DtContr ${op.DtContr} — verifique concatenação do IPOC (S81)`, 'IPOC', ol)
              }
            }
          }
        }

        // S83 — Compatibilidade Tp × Cd (reforço cruzado)
        if (cli.Tp === '3' || cli.Tp === '4') {
          // Tp=3 (PF exterior) e Tp=4 (PJ exterior) — Cd diferente de CPF/CNPJ padrão
          w('S83', `Tp=${cli.Tp} (pessoa no exterior): verifique formato do Cd — dígitos de identificação internacional (S83)`, 'Cd', ol)
        }

        // S93 — Ativo Problemático: se DiaAtraso > 90, deve haver marcação
        if (diaAtraso > 90) {
          if (!op.CaracEsp || !String(op.CaracEsp).includes('36')) {
            w('S93', `DiaAtraso=${diaAtraso} > 90 dias — operação deve ser marcada como Ativo Problemático (CaracEsp=36) pela Res. 4966 (S93)`, 'CaracEsp', ol)
          }
        }

        // S97 — Se atraso > 60 dias, não pode ser Estágio 1 (IFRS9)
        if (diaAtraso > 60 && op.ContInstFinRes4966?.EstInstFin === 1) {
          e('S97', `DiaAtraso=${diaAtraso} > 60 dias: não pode ser classificado como Estágio 1 (EstInstFin=1) pela Res. 4966 (S97)`, 'EstInstFin', ol)
        }

        // S99 — Se há dias de atraso, deve haver valor no vértice vencido correspondente
        if (diaAtraso > 0 && diaAtraso <= 14) {
          if ((Number(venc.v205)||0) === 0 && (Number(venc.v210)||0) === 0) {
            w('S99', `DiaAtraso=${diaAtraso} mas nenhum valor nos vértices de atraso (v205/v210) — verifique distribuição de vencimentos vencidos (S99)`, 'vencimentos', ol)
          }
        }

        // S104 — ProvConsttd deve ser ≤ VlrContBr + crédito a liberar
        if (op.ContInstFinRes4966?.VlrContBr !== undefined && op.ProvConsttd !== undefined) {
          const vlrBr = Number(op.ContInstFinRes4966.VlrContBr) || 0
          const vlrLib = ['v60','v80'].reduce((s:number,k:string)=>s+Number(venc[k]||0),0)
          const prov = Number(op.ProvConsttd) || 0
          if (prov > vlrBr + vlrLib + 0.01) {
            e('S104', `ProvConsttd (${prov}) > VlrContBr (${vlrBr}) + crédito a liberar (${vlrLib}) — provisão não pode superar o valor de exposição (S104)`, 'ProvConsttd', ol)
          }
        }

        // C03/C04 — Garantias: campos obrigatórios por tipo
        ;(op.garantias || []).forEach((g: any, gi: number) => {
          const gl = `${ol} > garantias[${gi}]`
          const isFidej = String(g.TpGar || '') === '09'
          if (!isFidej) {
            // C03 — garantia não fidejussória: VlrOrig obrigatório, Ident/PercGar proibidos
            if (g.VlrOrig === undefined) e('C03', 'Garantia não fidejussória: VlrOrig (valor original) obrigatório (C03)', 'VlrOrig', gl)
            if (g.Ident) e('C03', 'Garantia não fidejussória: campo Ident (garantidor) é proibido (C03)', 'Ident', gl)
            if (g.PercGar !== undefined) e('C03', 'Garantia não fidejussória: PercGar (percentual garantido) é proibido (C03)', 'PercGar', gl)
          } else {
            // C04 — garantia fidejussória: Ident e PercGar obrigatórios, VlrOrig proibido
            const externas = ['0903','0904']
            if (!externas.includes(String(g.SubTpGar||'')) && !g.Ident) {
              e('C04', 'Garantia fidejussória: Ident (identificação do garantidor) obrigatório (C04)', 'Ident', gl)
            }
            if (g.PercGar === undefined) e('C04', 'Garantia fidejussória: PercGar (percentual garantido) obrigatório (C04)', 'PercGar', gl)
            if (g.VlrOrig !== undefined) e('C04', 'Garantia fidejussória: VlrOrig (valor original) é proibido (C04)', 'VlrOrig', gl)
          }
          // C10 — Reavaliação de garantia: DtReav e VlrData devem vir juntos
          if ((g.DtReav && g.VlrData === undefined) || (!g.DtReav && g.VlrData !== undefined)) {
            e('C10', 'Reavaliação de garantia: DtReav e VlrData são obrigatórios juntos ou nenhum (C10)', 'DtReav', gl)
          }
        })

        // I05 — Código de vencimento não pode aparecer mais de uma vez na mesma operação
        const vencKeys = Object.keys(venc)
        const vencSet = new Set(vencKeys)
        if (vencKeys.length !== vencSet.size) {
          e('I05', 'Código de vencimento duplicado na mesma operação (I05)', 'vencimentos', ol)
        }

        // I13 — Responsabilidade total do cliente >= R$ 200,00
        // (validado no nível do cliente, não da operação — feito abaixo)
        else {
          const r4966 = op.ContInstFinRes4966
          if (!r4966.ClasAtFin)   w('C02', 'ContInstFinRes4966.ClasAtFin ausente', 'ClasAtFin', ol)
          if (!r4966.CartProvMin) w('C02', 'ContInstFinRes4966.CartProvMin ausente', 'CartProvMin', ol)
          if (r4966.VlrContBr === undefined) w('C02', 'ContInstFinRes4966.VlrContBr ausente', 'VlrContBr', ol)
          if (r4966.VlrPerdaAcum === undefined) w('C02', 'ContInstFinRes4966.VlrPerdaAcum ausente', 'VlrPerdaAcum', ol)
        }

        // Vencimentos — pelo menos um deve ter valor > 0 (exceto saídas)
        const vlrTotalVenc = Object.values(venc).reduce((s: number, v: any) => s + (Number(v)||0), 0)
        if (!hasVencPrejuizo && vlrTotalVenc === 0) {
          w('I10', 'Nenhum vencimento com valor > 0 — operação com carteira zerada (I10 — verificar)', 'vencimentos', ol)
        }
      })

      // I13 — Responsabilidade total do cliente < R$200 deve ir para agregado
      const respTotal = ops.reduce((s: number, op: any) => {
        return s + Object.entries(op.vencimentos || {}).reduce((ss: number, [k, v]: [string, any]) => {
          const n = parseInt(k.replace('v',''))
          return [20,40,60,80].includes(n) ? ss : ss + (Number(v)||0)
        }, 0)
      }, 0)
      if (respTotal > 0 && respTotal < 200) {
        w('I13', `Cliente ${cli.Cd}: responsabilidade total R$${respTotal.toFixed(2)} < R$200,00 — deve ser informado como agregado, não individualizado (I13)`, 'Cd', loc)
      }
    })

    // I14 — IPOC duplicado entre clientes (cross-client)
    const allIpocs = clis.flatMap((c: any) => (c.operacoes||[]).map((o: any) => o.IPOC)).filter(Boolean)
    const ipocCount = allIpocs.reduce((m: Record<string,number>, ip: string) => { m[ip]=(m[ip]||0)+1; return m }, {})
    Object.entries(ipocCount).forEach(([ip, cnt]) => {
      if ((cnt as number) > 1) e('I14', `IPOC "${ip}" aparece ${cnt} vezes na remessa — não é admitida repetição (I14)`, 'IPOC', 'remessa')
    })

    // ── REGRAS DE BATIMENTO COSIF (SCR3040_RegrasValidacaoBacen_1.xls) ──────────
    // Estas regras comparam os totais do CADOC 3040 com o CADOC 4010 (Balancete COSIF).
    // Como são inter-documentos, validamos internamente a consistência e alertamos
    // sobre os totalizadores que o BCB irá conferir automaticamente no servidor.

    const allOps = clis.flatMap((c: any) => (c.operacoes||[]).map((o: any) => ({...o, _cli:c})))
    const NATOPS_PROP = ['01','02','03','11','13','14','15'] // naturezas aceitas nos batimentos
    const VENC_ATIVOS  = (venc:any) => Object.entries(venc||{}).some(([k,v]) => { const n=parseInt(k.replace('v','')); return n>=110 && n<=290 && (Number(v)||0)>0 })
    const VENC_PREJ    = (venc:any) => ['v310','v320','v330'].some(k => (Number((venc||{})[k])||0)>0)

    // T01 — Total SCR × Classificação da Carteira no COSIF (rubrica 3.1.0.00.00-0)
    const totalSCRCarteira = allOps
      .filter((o:any) => NATOPS_PROP.includes(String(o.NatuOp||'')) && VENC_ATIVOS(o.vencimentos) && !VENC_PREJ(o.vencimentos))
      .reduce((s:number,o:any)=>s+Object.entries(o.vencimentos||{}).reduce((ss:number,[k,v]:[string,any])=>{const n=parseInt(k.replace('v','')); return (n>=110&&n<=290)? ss+Number(v):ss},0),0)
    if (totalSCRCarteira === 0 && allOps.length > 0) {
      w('T01','Soma dos vencimentos (v110–v290) com ClassOp AA–H é zero — verifique batimento com COSIF 3.1.0.00.00-0 (T01)', 'vencimentos', 'batimento')
    }

    // T05 — Total baixados como prejuízo (ClassOp=HH) × COSIF 9.0.9.60.10/15/20
    const totalHH = allOps
      .filter((o:any) => o.ClassOp === 'HH')
      .reduce((s:number,o:any)=>s+(Number(o.vencimentos?.v310)||0)+(Number(o.vencimentos?.v320)||0)+(Number(o.vencimentos?.v330)||0),0)
    if (totalHH > 0) {
      w('T05', `∑ ClassOp=HH (v310+v320+v330) = R$${totalHH.toLocaleString('pt-BR')} — deve bater com COSIF 9.0.9.60.10-5 + 9.0.9.60.15-0 + 9.0.9.60.20-8 do CADOC 4010 (T05)`, 'ClassOp', 'batimento')
    }

    // T07 — Arrendamento Mercantil (Mod 12xx) × COSIF 3.1.x.20.00
    const totalArrend = allOps
      .filter((o:any) => String(o.Mod||'').startsWith('12') && VENC_ATIVOS(o.vencimentos))
      .reduce((s:number,o:any)=>s+Object.entries(o.vencimentos||{}).reduce((ss:number,[k,v]:[string,any])=>{const n=parseInt(k.replace('v','')); return (n>=110&&n<=290)?ss+Number(v):ss},0),0)
    if (totalArrend > 0) {
      w('T07', `Arrendamento Mercantil (Mod 12xx): ∑venc = R$${totalArrend.toLocaleString('pt-BR')} — deve bater com rubricas COSIF 3.1.x.20.00 deduzido de 1.8.8.78.15/16 do CADOC 4010 (T07)`, 'Mod', 'batimento')
    }

    // M02/M03 — Empréstimos e Títulos Descontados (atualmente "não" no XLS mas relevantes)
    const modBatMap: Record<string,{label:string;cosif:string}> = {
      '02': {label:'Empréstimos',              cosif:'1.6.1.20.00-8'},
      '03': {label:'Títulos Descontados',       cosif:'1.6.1.30.00-5'},
      '15': {label:'Coobrigações (exceto 1505)',cosif:'3.0.1.30.00-5 + 3.0.1.85.00-5 + 3.0.1.90.00-7'},
      '16': {label:'Cedidos s/ coobrigação',    cosif:'3.0.9.58.00-5'},
    }
    Object.entries(modBatMap).forEach(([modPrefix, info]) => {
      const vlrMod = allOps
        .filter((o:any) => {
          const m = String(o.Mod||'')
          if (modPrefix === '15') return m.startsWith('15') && m !== '1505'
          return m.startsWith(modPrefix)
        })
        .filter((o:any) => NATOPS_PROP.includes(String(o.NatuOp||'')) && VENC_ATIVOS(o.vencimentos))
        .reduce((s:number,o:any)=>s+Object.entries(o.vencimentos||{}).reduce((ss:number,[k,v]:[string,any])=>{const n=parseInt(k.replace('v','')); return (n>=110&&n<=290)?ss+Number(v):ss},0),0)
      if (vlrMod > 0) {
        const ruleCode = modPrefix === '02' ? 'M02' : modPrefix === '03' ? 'M03' : modPrefix === '15' ? 'M15' : 'M16'
        w(ruleCode, `${info.label}: ∑venc (v110–v290) = R$${vlrMod.toLocaleString('pt-BR')} — conferir batimento com COSIF ${info.cosif} do CADOC 4010 (${ruleCode})`, 'Mod', 'batimento')
      }
    })
    const totalV310 = allOps.reduce((s:number,o:any)=>s+Number(o.vencimentos?.v310||0),0)
    const totalV320 = allOps.reduce((s:number,o:any)=>s+Number(o.vencimentos?.v320||0),0)
    const totalV330 = allOps.reduce((s:number,o:any)=>s+Number(o.vencimentos?.v330||0),0)
    if (totalV310 > 0) w('T02', `∑v310 (baixados ≤12m) = R$${totalV310.toLocaleString('pt-BR')} — deve ser igual à rubrica COSIF 9.0.9.60.10-5 do CADOC 4010 (T02 — batimento inter-documentos)`, 'v310', 'batimento')
    if (totalV320 > 0) w('T03', `∑v320 (baixados 12–48m) = R$${totalV320.toLocaleString('pt-BR')} — deve ser igual à rubrica COSIF 9.0.9.60.15-0 do CADOC 4010 (T03)`, 'v320', 'batimento')
    if (totalV330 > 0) w('T04', `∑v330 (baixados >48m) = R$${totalV330.toLocaleString('pt-BR')} — deve ser igual à rubrica COSIF 9.0.9.60.20-8 do CADOC 4010 (T04)`, 'v330', 'batimento')

    // T06 — Crédito a Liberar (v20/v40/v60/v80) × COSIF 3.0.9.80.00-4 + 3.0.9.86.00-8
    const totalCreditoLiberar = allOps.reduce((s:number,o:any)=>s+['v20','v40','v60','v80'].reduce((ss:number,k:string)=>ss+Number(o.vencimentos?.[k]||0),0),0)
    if (totalCreditoLiberar > 0) w('T06', `∑v20+v40+v60+v80 (crédito a liberar/limites) = R$${totalCreditoLiberar.toLocaleString('pt-BR')} — deve bater com COSIF 3.0.9.80.00-4 + 3.0.9.86.00-8 (T06)`, 'vencimentos', 'batimento')

    // R01–R09 — Batimento por Nível de Risco × Rubricas COSIF 3.1.1–3.1.9
    const COSIF_RISCO: Record<string,string> = {AA:'3.1.1.00.00-3',A:'3.1.2.00.00-6',B:'3.1.3.00.00-9',C:'3.1.4.00.00-2',D:'3.1.5.00.00-5',E:'3.1.6.00.00-8',F:'3.1.7.00.00-1',G:'3.1.8.00.00-4',H:'3.1.9.00.00-7'}
    const RN: Record<string,number> = {}
    ;['AA','A','B','C','D','E','F','G','H'].forEach(cl => { RN[cl] = 0 })
    allOps
      .filter((o:any) => NATOPS_PROP.includes(String(o.NatuOp||'')) && VENC_ATIVOS(o.vencimentos))
      .forEach((o:any) => {
        const cl = String(o.ClassOp||'')
        if (RN[cl] !== undefined) {
          RN[cl] += Object.entries(o.vencimentos||{}).reduce((s:number,[k,v]:[string,any])=>{const n=parseInt(k.replace('v','')); return (n>=110&&n<=290)?s+Number(v):s},0)
        }
      })
    Object.entries(RN).forEach(([cl, vlr]) => {
      if (vlr > 0 && COSIF_RISCO[cl]) {
        w(`R${Object.keys(COSIF_RISCO).indexOf(cl)+1<10?'0':''}${Object.keys(COSIF_RISCO).indexOf(cl)+1}`,
          `Classe ${cl}: ∑venc (v110–v290) = R$${vlr.toLocaleString('pt-BR')} — deve bater com COSIF ${COSIF_RISCO[cl]} do CADOC 4010 (R0${Object.keys(COSIF_RISCO).indexOf(cl)+1})`,
          'ClassOp', 'batimento')
      }
    })

    // M01–M24 — Batimento por Modalidade × Rubricas COSIF (ativos = sim)
    const MOD_COSIF_ATIVO: Record<string,string> = {
      '01':'1.6.1.10.00-1','04':'1.6.2.10.00-4','05':'1.6.2.20.00-1','06':'1.6.2.25.00-6',
      '07':'1.6.2.30.00-8','08':'1.6.3.00.00-0','09':'1.6.4.00.00-3','10':'1.6.5.00.00-6',
      '11':'1.6.6.00.00-9','1304':'1.8.8.79.00-3','1301':'1.8.1.10.10.10-9','14':'1.4.3.00.00-2',
    }
    const byMod3040: Record<string,number> = {}
    allOps
      .filter((o:any) => NATOPS_PROP.includes(String(o.NatuOp||'')) && VENC_ATIVOS(o.vencimentos))
      .forEach((o:any) => {
        const m = String(o.Mod||'')
        if (!byMod3040[m]) byMod3040[m] = 0
        byMod3040[m] += Object.entries(o.vencimentos||{}).reduce((s:number,[k,v]:[string,any])=>{const n=parseInt(k.replace('v','')); return (n>=110&&n<=290)?s+Number(v):s},0)
      })
    Object.entries(byMod3040).forEach(([mod, vlr]) => {
      const cosif = MOD_COSIF_ATIVO[mod] || MOD_COSIF_ATIVO[mod.slice(0,2)]
      if (cosif && vlr > 0) {
        w('MV', `Modalidade ${mod}: ∑venc (v110–v290) = R$${vlr.toLocaleString('pt-BR')} — deve bater com rubrica COSIF ${cosif} do CADOC 4010 (Regra MV)`, 'Mod', 'batimento')
      }
    })

    // P (Provisão por Modalidade) — totais de ProvConsttd por Mod × COSIF
    const PROV_COSIF: Record<string,string> = {
      '01':'1.6.1.10.01.40-4','02':'1.6.1.20.01.40-3','03':'1.6.1.30.01.40-2',
      '04':'1.6.2.10.01.40-1','05':'1.6.2.20.01.40-0','06':'1.6.2.25.01.40-5',
      '08':'1.6.3.05.01.40-4','09':'1.6.4.10.01.40-5','11':'1.6.6.10.01.40-9',
      '1304':'1.8.9.96.00.00-5','1301':'1.8.1.10.10.40-8',
    }
    const provByMod: Record<string,number> = {}
    allOps
      .filter((o:any) => NATOPS_PROP.includes(String(o.NatuOp||'')))
      .forEach((o:any) => {
        const m = String(o.Mod||'')
        if (!provByMod[m]) provByMod[m] = 0
        provByMod[m] += Number(o.ProvConsttd || 0)
      })
    const totalProv = Object.values(provByMod).reduce((s:number,v:number)=>s+v,0)
    if (totalProv > 0) {
      w('P', `Provisão total SCR = R$${totalProv.toLocaleString('pt-BR')} — deve bater com soma das rubricas COSIF P01–P13 do CADOC 4010 (RegrasValidacaoBacen Planilha P)`, 'ProvConsttd', 'batimento')
    }

    // MB (Valor Contábil Bruto por Modalidade) — ContInstFinRes4966.VlrContBr por Mod × COSIF
    const vlrBrutoTotal = allOps.reduce((s:number,o:any)=>s+Number(o.ContInstFinRes4966?.VlrContBr||0),0)
    if (vlrBrutoTotal > 0) {
      w('MB', `VlrContBr total (Res.4966) = R$${vlrBrutoTotal.toLocaleString('pt-BR')} — deve ser ≤ rubricas COSIF MB01–MB15 do CADOC 4010 (RegrasValidacaoBacen Planilha MB)`, 'VlrContBr', 'batimento')
    }
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
                {/* Upload JSON externo */}
                <label style={{ fontSize:10.5, padding:'4px 10px', borderRadius:6, border:`1px solid ${meta.cor}50`, background:`${meta.cor}10`, cursor:'pointer', color:meta.cor, fontWeight:700, outline:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
                  ⬆ Importar JSON
                  <input type="file" accept=".json,.xml,.txt" style={{ display:'none' }} onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return
                    const reader = new FileReader()
                    reader.onload = ev => {
                      const text = ev.target?.result as string
                      // Tenta parsear direto; se for XML, avisa
                      try { JSON.parse(text); onJsonChange(text) }
                      catch { setJsonErr('Arquivo não é um JSON válido. Para XML, use o template e preencha os dados.') }
                    }
                    reader.readAsText(file, 'UTF-8')
                    e.target.value = '' // reset so same file can be selected again
                  }}/>
                </label>
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

          {/* ── Dashboard de Resultado ── */}
          {step >= 3 && status && output && (() => {
            let obj: any = {}
            try { obj = JSON.parse(json) } catch {}

            const fmtBRL  = (v:number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0,maximumFractionDigits:0})
            const fmtPct  = (v:number) => v.toFixed(2).replace('.',',') + '%'
            const fmtNum  = (v:number) => v.toLocaleString('pt-BR')

            // ── Métricas 3040 ───────────────────────────────────────────────────
            const ops3040 = cadoc==='3040'
              ? (obj.clientes||[]).flatMap((c:any) => (c.operacoes||[]).map((o:any) => ({...o, _cli:c})))
              : []
            const totalCli   = cadoc==='3040' ? (obj.clientes||[]).length : 0
            const totalOps   = ops3040.length || (cadoc==='3044' ? (obj.operacoes||[]).length : 0)
            const vlrContr   = ops3040.reduce((a:number,o:any)=>a+(o.VlrContr||0),0)
            const vlrProv    = ops3040.reduce((a:number,o:any)=>a+(o.ProvConsttd||0),0)
            const vlrPerda   = ops3040.reduce((a:number,o:any)=>a+(o.ContInstFinRes4966?.VlrPerdaAcum||0),0)

            // Vencimentos: soma v110..v270 (a vencer), v310..v999 (vencido)
            const VENC_COLS = ['v110','v120','v130','v140','v150','v160','v170','v180','v190','v200','v210','v220','v230','v240','v250','v260','v270']
            const VEN_COLS  = ['v310','v320','v330','v340','v350','v360','v370','v380','v390','v400','v410']
            const vlrAVencer  = ops3040.reduce((a:number,o:any)=>a+VENC_COLS.reduce((b:number,k:string)=>b+(o.vencimentos?.[k]||0),0),0)
            const vlrVencido  = ops3040.reduce((a:number,o:any)=>a+VEN_COLS.reduce((b:number,k:string)=>b+(o.vencimentos?.[k]||0),0),0)

            // Distribuição por Classificação (ClassOp)
            const CLASSES = ['AA','A','B','C','D','E','F','G','H']
            const byClass: Record<string,{qtd:number;vlr:number;prov:number}> = {}
            CLASSES.forEach(c => { byClass[c] = {qtd:0,vlr:0,prov:0} })
            ops3040.forEach((o:any) => {
              const cl = o.ClassOp || 'A'
              if (!byClass[cl]) byClass[cl] = {qtd:0,vlr:0,prov:0}
              byClass[cl].qtd++
              byClass[cl].vlr += o.VlrContr||0
              byClass[cl].prov += o.ProvConsttd||0
            })
            const classesCom = CLASSES.filter(c => byClass[c]?.qtd > 0)
            const maxVlrClass = Math.max(...classesCom.map(c => byClass[c].vlr), 1)

            // Distribuição por Modalidade (Mod)
            const MOD_LABELS: Record<string,string> = {
              '0101':'Empréstimo sem consign.','0102':'Empréstimo consignado','0201':'Cheque especial',
              '0202':'Créd. pessoal','0301':'Capital de giro','0302':'Desconto duplicatas',
              '0401':'Financ. imobiliário','0501':'Crédito rural','1304':'Cartão crédito',
              '0204':'Rotativo cartão','0205':'Parcelado s/ juros',
            }
            const byMod: Record<string,{qtd:number;vlr:number}> = {}
            ops3040.forEach((o:any) => {
              const m = o.Mod || 'outros'
              if (!byMod[m]) byMod[m] = {qtd:0,vlr:0}
              byMod[m].qtd++; byMod[m].vlr += o.VlrContr||0
            })
            const modsSort = Object.entries(byMod).sort((a,b)=>b[1].vlr-a[1].vlr).slice(0,6)
            const maxVlrMod = Math.max(...modsSort.map(([,v])=>v.vlr),1)

            // Vencimentos por vértice (fluxo)
            const VERTICE_MAP: {cols:string[];label:string;color:string}[] = [
              {cols:['v110','v120','v130'],label:'≤ 90d',    color:'#16a34a'},
              {cols:['v140','v150','v160'],label:'91–180d',  color:'#0891b2'},
              {cols:['v170','v180','v190'],label:'181–360d', color:'#7c3aed'},
              {cols:['v200','v210','v220'],label:'1–2 anos', color:'#d97706'},
              {cols:['v230','v240','v250','v260','v270'],label:'> 2 anos',color:'#6b7280'},
            ]
            const fluxo = VERTICE_MAP.map(v => ({
              label: v.label,
              color: v.color,
              vlr: ops3040.reduce((a:number,o:any)=>a+v.cols.reduce((b:number,k:string)=>b+(o.vencimentos?.[k]||0),0),0)
            }))
            const maxFluxo = Math.max(...fluxo.map(f=>f.vlr),1)

            // Clientes por tipo
            const cliPF = (obj.clientes||[]).filter((c:any)=>c.Tp==='1').length
            const cliPJ = (obj.clientes||[]).filter((c:any)=>c.Tp==='2').length

            // inadimplência
            const opsAtraso = ops3040.filter((o:any)=>(o.DiaAtraso||0)>0)
            const vlrAtraso = opsAtraso.reduce((a:number,o:any)=>a+(o.VlrContr||0),0)
            const pctInad   = vlrContr > 0 ? (vlrAtraso/vlrContr)*100 : 0

            // outros CADOCs
            const totalContas= cadoc==='4010' ? (obj.contas||[]).length : 0
            const saldoTotal = cadoc==='4010' ? (obj.contas||[]).reduce((a:number,c:any)=>a+(c.saldo||0),0) : 0
            const totalInc   = cadoc==='3044' ? (obj.operacoes||[]).filter((o:any)=>o.acao===1).length : 0
            const totalExcl  = cadoc==='3044' ? (obj.operacoes||[]).filter((o:any)=>o.acao===2).length : 0
            const totalAtraso= cadoc==='3044' ? (obj.operacoes||[]).filter((o:any)=>o.atraso==='S').length : 0
            const totalEC    = cadoc==='6334' ? (obj.conccred||[]).reduce((a:number,r:any)=>a+(r.qtdCredenciados||0),0) : 0
            const totalConts = cadoc==='6334' ? (obj.contatos||[]).length : 0

            const KPI = ({label,value,sub,color='#111827',mono=false}:{label:string;value:string;sub?:string;color?:string;mono?:boolean}) => (
              <div style={{textAlign:'center',padding:'10px 6px'}}>
                <div style={{fontSize:18,fontWeight:900,color,fontFamily:mono?'monospace':'inherit',letterSpacing:'-1px',lineHeight:1}}>{value}</div>
                <div style={{fontSize:9.5,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',letterSpacing:'.4px',marginTop:4,lineHeight:1.3}}>{label}</div>
                {sub&&<div style={{fontSize:9,color:'#d1d5db',marginTop:2}}>{sub}</div>}
              </div>
            )
            const Bar = ({pct,color,height=6}:{pct:number;color:string;height?:number}) => (
              <div style={{height,background:'#f3f4f6',borderRadius:4,overflow:'hidden',flex:1}}>
                <div style={{height:'100%',width:Math.min(100,pct)+'%',background:color,borderRadius:4,transition:'width .4s'}}/>
              </div>
            )
            const classColor = (c:string) => {
              if(c==='AA'||c==='A') return '#16a34a'
              if(c==='B'||c==='C') return '#d97706'
              if(c==='D') return '#ea580c'
              return '#dc2626'
            }

            return (
              <div style={{marginBottom:12}}>

                {/* ── Header status ───────────────────────────────────── */}
                <div style={{padding:'11px 16px',background:stCor+'0f',border:`1px solid ${stCor}30`,borderRadius:'10px 10px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:14,fontWeight:800,color:'#111827'}}>Dashboard — CADOC {cadoc}</span>
                    <span style={{fontSize:10,color:'#9ca3af',fontFamily:'monospace'}}>
                      {cadoc==='3040'&&`CNPJ ${obj.cabecalho?.CNPJ||'?'} · Data-base ${obj.cabecalho?.DtBase||'?'}`}
                      {cadoc==='3044'&&`CNPJ ${obj.cnpjIF||'?'} · Remessa ${obj.dataHoraRemessa||'?'}`}
                      {cadoc==='4010'&&`CNPJ ${obj.cabecalho?.cnpj||'?'} · Base ${obj.cabecalho?.dataBase||'?'}`}
                    </span>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    {erros.length>0&&<span style={{fontSize:11,color:'#dc2626',fontWeight:700,padding:'2px 8px',background:'#fef2f2',borderRadius:4,fontFamily:'monospace'}}>{erros.length} erro(s)</span>}
                    {avisos.length>0&&<span style={{fontSize:11,color:'#d97706',fontWeight:700,padding:'2px 8px',background:'#fffbeb',borderRadius:4,fontFamily:'monospace'}}>{avisos.length} aviso(s)</span>}
                    <span style={{fontSize:11,fontWeight:800,padding:'4px 14px',borderRadius:7,background:stCor+'18',color:stCor,border:`1px solid ${stCor}40`,fontFamily:'monospace'}}>
                      {status==='ok'?'✓ APROVADO':status==='warn'?'⚠ COM ALERTAS':'✗ REPROVADO'}
                    </span>
                  </div>
                </div>

                {/* ══════════════════════════════════════════════════════
                    DASHBOARD 3040 — Completo
                ══════════════════════════════════════════════════════ */}
                {cadoc==='3040'&&(
                  <div style={{background:'#fff',border:'1px solid #e5e7eb',borderTop:'none'}}>

                    {/* KPIs Linha 1 — Visão geral */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid #f3f4f6'}}>
                      {[
                        {label:'Clientes',       value:fmtNum(totalCli),         color:'#1d4ed8', sub:`${cliPF} PF · ${cliPJ} PJ`},
                        {label:'Operações',      value:fmtNum(totalOps),         color:'#7c3aed'},
                        {label:'Valor Contratado',value:fmtBRL(vlrContr),        color:'#0d6e52'},
                        {label:'A Vencer',        value:fmtBRL(vlrAVencer),      color:'#0891b2', sub:vlrContr>0?fmtPct(vlrAVencer/vlrContr*100):'-'},
                        {label:'Vencido',         value:fmtBRL(vlrVencido),      color:'#d97706', sub:vlrContr>0?fmtPct(vlrVencido/vlrContr*100):'-'},
                        {label:'Inadimplência',   value:fmtPct(pctInad),         color:pctInad>5?'#dc2626':'#16a34a', sub:`${opsAtraso.length} op(s) em atraso`},
                        {label:'Provisão',        value:fmtBRL(vlrProv),         color:'#dc2626', sub:vlrContr>0?fmtPct(vlrProv/vlrContr*100):'-'},
                      ].map((k,i)=>(
                        <div key={k.label} style={{borderRight:i<6?'1px solid #f3f4f6':'none'}}>
                          <KPI label={k.label} value={k.value} color={k.color} sub={k.sub}/>
                        </div>
                      ))}
                    </div>

                    {/* KPIs Linha 2 — Provisão e Perda */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:'1px solid #f3f4f6',background:'#fafafa'}}>
                      {[
                        {label:'Perda Esperada Acum.',value:fmtBRL(vlrPerda),      color:'#dc2626'},
                        {label:'Prov./Carteira',       value:vlrContr>0?fmtPct(vlrProv/vlrContr*100):'0,00%', color:'#7c3aed'},
                        {label:'Metodologia PE',       value:obj.cabecalho?.MetodApPE||'?', color:'#374151'},
                        {label:'Erros Validação BCB',  value:String(erros.length),  color:erros.length>0?'#dc2626':'#16a34a'},
                      ].map((k,i)=>(
                        <div key={k.label} style={{borderRight:i<3?'1px solid #f3f4f6':'none'}}>
                          <KPI label={k.label} value={k.value} color={k.color}/>
                        </div>
                      ))}
                    </div>

                    {/* Linha 3 — Tabelas analíticas */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0,borderBottom:'1px solid #f3f4f6'}}>

                      {/* Classificação de Risco */}
                      <div style={{padding:'14px 16px',borderRight:'1px solid #f3f4f6'}}>
                        <div style={{fontSize:11,fontWeight:700,color:'#374151',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:3,height:14,background:'#7c3aed',borderRadius:2}}/>
                          Classificação de Risco (ClassOp × ProvConsttd)
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'auto 1fr auto auto auto',gap:'0 8px',alignItems:'center',rowGap:5}}>
                          <div style={{fontSize:9,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.4px'}}>Class</div>
                          <div style={{fontSize:9,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.4px'}}>Volume</div>
                          <div style={{fontSize:9,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.4px',textAlign:'right'}}>Ops</div>
                          <div style={{fontSize:9,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.4px',textAlign:'right'}}>Valor</div>
                          <div style={{fontSize:9,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.4px',textAlign:'right'}}>Provisão</div>
                          {classesCom.map(cl=>(
                            <>
                              <div key={cl+'l'} style={{fontFamily:'monospace',fontWeight:800,fontSize:11,color:classColor(cl)}}>{cl}</div>
                              <Bar pct={byClass[cl].vlr/maxVlrClass*100} color={classColor(cl)} height={5}/>
                              <div style={{fontSize:10,fontFamily:'monospace',color:'#374151',textAlign:'right'}}>{byClass[cl].qtd}</div>
                              <div style={{fontSize:10,fontFamily:'monospace',color:'#374151',textAlign:'right',whiteSpace:'nowrap'}}>{fmtBRL(byClass[cl].vlr)}</div>
                              <div style={{fontSize:10,fontFamily:'monospace',color:classColor(cl),textAlign:'right',fontWeight:600,whiteSpace:'nowrap'}}>{fmtBRL(byClass[cl].prov)}</div>
                            </>
                          ))}
                          {classesCom.length===0&&<div style={{gridColumn:'1/-1',fontSize:11,color:'#9ca3af',padding:'8px 0'}}>Nenhuma operação encontrada</div>}
                        </div>
                      </div>

                      {/* Fluxo de Vencimento por Vértice */}
                      <div style={{padding:'14px 16px'}}>
                        <div style={{fontSize:11,fontWeight:700,color:'#374151',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:3,height:14,background:'#0891b2',borderRadius:2}}/>
                          Fluxo de Vencimento por Vértice (A Vencer)
                        </div>
                        {fluxo.filter(f=>f.vlr>0).length===0 ? (
                          <div style={{fontSize:11,color:'#9ca3af',padding:'8px 0'}}>Nenhum vencimento mapeado nos vértices</div>
                        ) : fluxo.map(f=>(
                          <div key={f.label} style={{display:'grid',gridTemplateColumns:'70px 1fr 110px',gap:8,alignItems:'center',marginBottom:6}}>
                            <span style={{fontSize:10.5,fontWeight:600,color:'#374151',whiteSpace:'nowrap'}}>{f.label}</span>
                            <Bar pct={f.vlr/maxFluxo*100} color={f.color} height={6}/>
                            <span style={{fontSize:10,fontFamily:'monospace',color:'#374151',textAlign:'right',whiteSpace:'nowrap'}}>{fmtBRL(f.vlr)}</span>
                          </div>
                        ))}
                        <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between'}}>
                          <span style={{fontSize:10,color:'#9ca3af'}}>Total a vencer</span>
                          <span style={{fontSize:11,fontFamily:'monospace',fontWeight:700,color:'#0891b2'}}>{fmtBRL(vlrAVencer)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Linha 4 — Modalidade */}
                    <div style={{padding:'14px 16px',borderBottom:'1px solid #f3f4f6'}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#374151',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:3,height:14,background:'#d97706',borderRadius:2}}/>
                        Distribuição por Modalidade (Mod)
                      </div>
                      {modsSort.length===0 ? (
                        <div style={{fontSize:11,color:'#9ca3af'}}>Nenhuma modalidade mapeada</div>
                      ) : (
                        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'4px 24px'}}>
                          {modsSort.map(([mod,v])=>(
                            <div key={mod} style={{display:'grid',gridTemplateColumns:'38px 1fr 30px 110px',gap:6,alignItems:'center'}}>
                              <span style={{fontSize:10,fontFamily:'monospace',fontWeight:700,color:'#0891b2'}}>{mod}</span>
                              <Bar pct={v.vlr/maxVlrMod*100} color='#0891b2' height={5}/>
                              <span style={{fontSize:10,fontFamily:'monospace',color:'#6b7280',textAlign:'right'}}>{v.qtd}</span>
                              <span style={{fontSize:10,fontFamily:'monospace',color:'#374151',textAlign:'right',whiteSpace:'nowrap'}}>{fmtBRL(v.vlr)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Linha 5 — Tabela de clientes/operações */}
                    <div style={{padding:'14px 16px',borderBottom:'1px solid #f3f4f6'}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#374151',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:3,height:14,background:'#1d4ed8',borderRadius:2}}/>
                        Clientes e Operações
                      </div>
                      <div style={{borderRadius:8,border:'1px solid #e5e7eb',overflow:'hidden',maxHeight:220,overflowY:'auto'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11.5}}>
                          <thead style={{position:'sticky',top:0}}>
                            <tr style={{background:'#f9fafb'}}>
                              {['CPF/CNPJ','Tipo','Classe','Operação (IPOC)','Modalidade','Valor Contr.','Class Op','Provisão','Atraso (d)'].map(h=>(
                                <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:9,fontWeight:700,color:'#9ca3af',letterSpacing:'.4px',textTransform:'uppercase',borderBottom:'1px solid #e5e7eb',whiteSpace:'nowrap'}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(obj.clientes||[]).flatMap((c:any)=>(c.operacoes||[]).map((o:any,oi:number)=>({c,o,oi}))).slice(0,30).map(({c,o,oi}:any,i:number)=>(
                              <tr key={i} style={{borderTop:i>0?'1px solid #f9fafb':'none'}}
                                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f9fafb'}
                                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                                <td style={{padding:'6px 10px',fontFamily:'monospace',fontSize:11,color:'#374151'}}>{(c.Cd||'').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4')}</td>
                                <td style={{padding:'6px 10px'}}><span style={{fontSize:9.5,padding:'1px 6px',borderRadius:3,background:c.Tp==='1'?'#eff6ff':'#f0fdf4',color:c.Tp==='1'?'#1d4ed8':'#16a34a',fontWeight:700}}>{c.Tp==='1'?'PF':'PJ'}</span></td>
                                <td style={{padding:'6px 10px'}}><span style={{fontSize:10,fontWeight:700,color:classColor(c.ClassCli||'A')}}>{c.ClassCli||'—'}</span></td>
                                <td style={{padding:'6px 10px',fontFamily:'monospace',fontSize:10,color:'#6b7280',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.IPOC||'—'}</td>
                                <td style={{padding:'6px 10px',fontFamily:'monospace',fontSize:10,color:'#0891b2'}}>{o.Mod||'—'}</td>
                                <td style={{padding:'6px 10px',fontFamily:'monospace',fontSize:11,color:'#374151',textAlign:'right',whiteSpace:'nowrap'}}>{fmtBRL(o.VlrContr||0)}</td>
                                <td style={{padding:'6px 10px'}}><span style={{fontSize:10,fontWeight:700,color:classColor(o.ClassOp||'A')}}>{o.ClassOp||'—'}</span></td>
                                <td style={{padding:'6px 10px',fontFamily:'monospace',fontSize:11,color:'#dc2626',textAlign:'right',whiteSpace:'nowrap'}}>{fmtBRL(o.ProvConsttd||0)}</td>
                                <td style={{padding:'6px 10px',fontFamily:'monospace',fontSize:11,color:(o.DiaAtraso||0)>0?'#dc2626':'#9ca3af',textAlign:'right'}}>{o.DiaAtraso||0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {totalOps>30&&<div style={{padding:'6px 10px',fontSize:10,color:'#9ca3af',background:'#f9fafb',borderTop:'1px solid #f3f4f6'}}>Exibindo 30 de {totalOps} operações</div>}
                      </div>
                    </div>

                    {/* Tabs: Críticas BCB + Preview XML */}
                    <div>
                      <div style={{display:'flex',background:'#f9fafb',borderBottom:'1px solid #f3f4f6'}}>
                        {[['erros',`Críticas BCB (${erros.length+avisos.length})`],['preview','Preview XML']].map(([t,l])=>(
                          <div key={t} onClick={()=>setResTab(t as any)} style={{flex:1,padding:'9px 4px',textAlign:'center',fontSize:10.5,fontWeight:600,color:resTab===t?'#0d6e52':'#9ca3af',cursor:'pointer',borderBottom:resTab===t?'2px solid #0d6e52':'2px solid transparent',marginBottom:-1,letterSpacing:'.4px',textTransform:'uppercase',userSelect:'none'}}>{l}</div>
                        ))}
                      </div>
                      <div style={{padding:'14px',borderRadius:'0 0 10px 10px'}}>
                        {resTab==='erros'&&(
                          erros.length===0&&avisos.length===0 ? (
                            <div style={{padding:'16px',textAlign:'center',color:'#16a34a',fontWeight:700,fontSize:13}}>✓ Nenhuma crítica BCB — arquivo pronto para envio ao STA!</div>
                          ) : (
                            <>
                              <div style={{borderRadius:8,border:'1px solid #e5e7eb',overflow:'hidden',marginBottom:10}}>
                                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                                  <thead>
                                    <tr style={{background:'#f9fafb'}}>
                                      {['Tipo','Código','Mensagem','Campo / Localização'].map(h=>(
                                        <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:9.5,fontWeight:700,color:'#9ca3af',letterSpacing:'.5px',textTransform:'uppercase',borderBottom:'1px solid #e5e7eb'}}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[...erros,...avisos].map((e,i)=>{
                                      const [er,ec]=[e.tipo==='erro','#dc2626']
                                      const c2=er?ec:'#d97706'
                                      return(
                                        <tr key={i} style={{borderTop:i>0?'1px solid #f9fafb':'none'}}
                                          onMouseEnter={el=>(el.currentTarget as HTMLElement).style.background=er?'#fef2f2':'#fffbeb'}
                                          onMouseLeave={el=>(el.currentTarget as HTMLElement).style.background='transparent'}>
                                          <td style={{padding:'8px 12px'}}><span style={{fontSize:9.5,fontWeight:700,padding:'2px 8px',borderRadius:4,background:c2+'15',color:c2,fontFamily:'monospace'}}>{e.tipo.toUpperCase()}</span></td>
                                          <td style={{padding:'8px 12px',fontFamily:'monospace',fontWeight:800,fontSize:11,color:c2}}>{e.cod}</td>
                                          <td style={{padding:'8px 12px',fontSize:12,color:'#111827'}}>{e.msg}</td>
                                          <td style={{padding:'8px 12px',fontSize:10.5,fontFamily:'monospace',color:'#9ca3af'}}>{[e.arquivo,e.campo].filter(Boolean).join('.')||'—'}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <button onClick={exportCsvErros} style={{padding:'6px 12px',borderRadius:7,border:'1px solid #e5e7eb',background:'#f9fafb',fontSize:11,fontWeight:600,cursor:'pointer',color:'#374151',outline:'none'}}>⬇ Exportar Críticas CSV</button>
                            </>
                          )
                        )}
                        {resTab==='preview'&&(
                          <pre style={{padding:12,fontFamily:'"JetBrains Mono","Courier New",monospace',fontSize:11,color:'#94a3b8',background:'#0f172a',borderRadius:8,maxHeight:280,overflowY:'auto',margin:0,whiteSpace:'pre-wrap',wordBreak:'break-all',lineHeight:1.6}}>
                            {output.slice(0,4000)}{output.length>4000?'\n…':''}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Outros CADOCs (dashboard simplificado) ─────────── */}
                {cadoc!=='3040'&&(
                  <div style={{background:'#fff',border:'1px solid #e5e7eb',borderTop:'none'}}>
                    <div style={{display:'grid',gridTemplateColumns:`repeat(${cadoc==='3044'?4:cadoc==='4010'?3:cadoc==='6334'?3:2},1fr)`,borderBottom:'1px solid #f3f4f6'}}>
                      {cadoc==='3044'&&[
                        {l:'Total Eventos',v:fmtNum(totalOps),    c:'#7c3aed'},
                        {l:'Inclusões (1)',v:fmtNum(totalInc),    c:'#0d9166'},
                        {l:'Exclusões (2)',v:fmtNum(totalExcl),   c:'#d97706'},
                        {l:'Com Atraso',   v:fmtNum(totalAtraso), c:totalAtraso>0?'#dc2626':'#16a34a'},
                      ].map((k,i)=><div key={k.l} style={{borderRight:i<3?'1px solid #f3f4f6':'none'}}><KPI label={k.l} value={k.v} color={k.c} mono/></div>)}
                      {cadoc==='4010'&&[
                        {l:'Contas COSIF',v:fmtNum(totalContas),  c:'#0891b2'},
                        {l:'Saldo Total', v:fmtBRL(saldoTotal),   c:'#0d9166'},
                        {l:'Erros BCB',   v:String(erros.length), c:erros.length>0?'#dc2626':'#16a34a'},
                      ].map((k,i)=><div key={k.l} style={{borderRight:i<2?'1px solid #f3f4f6':'none'}}><KPI label={k.l} value={k.v} color={k.c} mono/></div>)}
                      {cadoc==='6334'&&[
                        {l:'Arquivos TXT',v:'10',                 c:'#d97706'},
                        {l:'ECs Credenc.',v:fmtNum(totalEC),      c:'#0891b2'},
                        {l:'Contatos',    v:fmtNum(totalConts),   c:'#0d9166'},
                      ].map((k,i)=><div key={k.l} style={{borderRight:i<2?'1px solid #f3f4f6':'none'}}><KPI label={k.l} value={k.v} color={k.c} mono/></div>)}
                      {cadoc==='3060'&&[
                        {l:'P25', v:String(obj.percentil25||0)+'%',  c:'#0891b2'},
                        {l:'P100',v:String(obj.percentil100||0)+'%', c:'#0d9166'},
                      ].map((k,i)=><div key={k.l} style={{borderRight:i<1?'1px solid #f3f4f6':'none'}}><KPI label={k.l} value={k.v} color={k.c} mono/></div>)}
                    </div>
                    <div style={{display:'flex',background:'#f9fafb',borderBottom:'1px solid #f3f4f6'}}>
                      {[['erros',`Críticas BCB (${erros.length+avisos.length})`],['preview','Preview Arquivo']].map(([t,l])=>(
                        <div key={t} onClick={()=>setResTab(t as any)} style={{flex:1,padding:'9px 4px',textAlign:'center',fontSize:10.5,fontWeight:600,color:resTab===t?'#0d6e52':'#9ca3af',cursor:'pointer',borderBottom:resTab===t?'2px solid #0d6e52':'2px solid transparent',marginBottom:-1,letterSpacing:'.4px',textTransform:'uppercase',userSelect:'none'}}>{l}</div>
                      ))}
                    </div>
                    <div style={{padding:'14px',borderRadius:'0 0 10px 10px'}}>
                      {resTab==='erros'&&(erros.length===0&&avisos.length===0?(
                        <div style={{padding:'16px',textAlign:'center',color:'#16a34a',fontWeight:700}}>✓ Nenhuma crítica BCB — pronto para envio ao STA!</div>
                      ):(
                        <>
                          <div style={{borderRadius:8,border:'1px solid #e5e7eb',overflow:'hidden',marginBottom:10}}>
                            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                              <thead><tr style={{background:'#f9fafb'}}>{['Tipo','Código','Mensagem','Campo/Arquivo'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:9.5,fontWeight:700,color:'#9ca3af',letterSpacing:'.5px',textTransform:'uppercase',borderBottom:'1px solid #e5e7eb'}}>{h}</th>)}</tr></thead>
                              <tbody>{[...erros,...avisos].map((e,i)=>{const ec=e.tipo==='erro'?'#dc2626':'#d97706';return(<tr key={i} style={{borderTop:i>0?'1px solid #f9fafb':'none'}} onMouseEnter={el=>(el.currentTarget as HTMLElement).style.background=e.tipo==='erro'?'#fef2f2':'#fffbeb'} onMouseLeave={el=>(el.currentTarget as HTMLElement).style.background='transparent'}><td style={{padding:'8px 12px'}}><span style={{fontSize:9.5,fontWeight:700,padding:'2px 8px',borderRadius:4,background:ec+'15',color:ec,fontFamily:'monospace'}}>{e.tipo.toUpperCase()}</span></td><td style={{padding:'8px 12px',fontFamily:'monospace',fontWeight:800,fontSize:11,color:ec}}>{e.cod}</td><td style={{padding:'8px 12px',fontSize:12,color:'#111827'}}>{e.msg}</td><td style={{padding:'8px 12px',fontSize:10.5,fontFamily:'monospace',color:'#9ca3af'}}>{[e.arquivo,e.campo].filter(Boolean).join('.')||'—'}</td></tr>)})}</tbody>
                            </table>
                          </div>
                          <button onClick={exportCsvErros} style={{padding:'6px 12px',borderRadius:7,border:'1px solid #e5e7eb',background:'#f9fafb',fontSize:11,fontWeight:600,cursor:'pointer',color:'#374151',outline:'none'}}>⬇ Exportar CSV</button>
                        </>
                      ))}
                      {resTab==='preview'&&<pre style={{padding:12,fontFamily:'"JetBrains Mono","Courier New",monospace',fontSize:11,color:'#94a3b8',background:'#0f172a',borderRadius:8,maxHeight:260,overflowY:'auto',margin:0,whiteSpace:'pre-wrap',wordBreak:'break-all',lineHeight:1.6}}>{output.slice(0,3000)}{output.length>3000?'\n…':''}</pre>}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

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
