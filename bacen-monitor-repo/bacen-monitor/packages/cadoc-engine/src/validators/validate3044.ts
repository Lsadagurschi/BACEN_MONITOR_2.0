// ============================================================
// Validador CADOC 3044 — Eventos de Crédito
// Regras: T01–T13, B01 (Manual BCB, mar/2026)
// ============================================================

import type { Cadoc3044Input, Cadoc3044Operacao, ValidationError } from '@bacen-monitor/types'

export interface Validate3044Result {
  valid: boolean
  erros: ValidationError[]
  avisos: ValidationError[]
  meta: {
    cnpjIF: string
    dataHoraRemessa: string
    envia3050: string
    nOperacoes: number
  }
}

export function validate3044(input: Cadoc3044Input): Validate3044Result {
  const erros: ValidationError[] = []
  const avisos: ValidationError[] = []

  const addErr  = (cod: string, msg: string, op?: string) => erros.push({ tipo: 'erro', cod, msg, op })
  const addWarn = (cod: string, msg: string, op?: string) => avisos.push({ tipo: 'aviso', cod, msg, op })

  // ── B01: campos obrigatórios do cabeçalho ─────────────────
  if (!input.cnpjIF)           addErr('B01', 'cnpjIF ausente ou inválido')
  if (!input.dataHoraRemessa)  addErr('B01', 'dataHoraRemessa ausente')
  if (!input.envia3050)        addErr('B01', 'envia3050 ausente (S ou N)')
  if (!Array.isArray(input.operacoes) || input.operacoes.length === 0) {
    addErr('B01', 'operacoes deve ser array não vazio')
    return { valid: erros.length === 0, erros, avisos, meta: buildMeta(input, 0) }
  }

  // ── T04: dataHoraRemessa não pode ser futura ──────────────
  const tsRemessa = parseDateTime(input.dataHoraRemessa)
  if (tsRemessa && tsRemessa > new Date()) {
    addErr('T04', `dataHoraRemessa ${input.dataHoraRemessa} é posterior ao momento atual`)
  }

  // ── Cutoff: 24 meses atrás ────────────────────────────────
  const cutoff24m = new Date()
  cutoff24m.setMonth(cutoff24m.getMonth() - 24)

  // ── Validação por operação ────────────────────────────────
  const seenIpoc = new Map<string, Map<string, Set<string>>>()  // ipoc → tipo → Set<data>

  for (const op of input.operacoes) {
    const ipoc = op.ipoc || '(sem IPOC)'

    // B01: campos obrigatórios por acao
    if (op.acao === 1) {
      if (!op.ipoc)              addErr('B01', 'ipoc obrigatório para acao=1', ipoc)
      if (op.saldoDevedor === undefined) addErr('B01', 'saldoDevedor obrigatório para acao=1', ipoc)
      if (!op.dataSaldoDevedor)  addErr('B01', 'dataSaldoDevedor obrigatório para acao=1', ipoc)
      if (!op.atraso)            addErr('B01', 'atraso obrigatório para acao=1 (S ou N)', ipoc)
    } else if (op.acao === 2) {
      if (!op.ipoc)              addErr('B01', 'ipoc obrigatório para acao=2', ipoc)
      continue                   // exclusão: sem mais validações
    } else {
      addErr('B01', `acao inválida: ${op.acao} (esperado 1 ou 2)`, ipoc)
      continue
    }

    const dataSaldo = parseDate(op.dataSaldoDevedor!)

    // T01: dataSaldoDevedor não pode ser posterior à remessa
    if (dataSaldo && tsRemessa && dataSaldo > tsRemessa) {
      addErr('T01', `dataSaldoDevedor (${op.dataSaldoDevedor}) posterior à remessa`, ipoc)
    }

    // T11: dataSaldoDevedor não pode ser anterior ao cutoff de 24 meses
    if (dataSaldo && dataSaldo < cutoff24m) {
      addErr('T11', `dataSaldoDevedor (${op.dataSaldoDevedor}) anterior ao limite de 24 meses`, ipoc)
    }

    // T07/T08: class3050 — obrigatoriedade condicionada ao envia3050
    if (input.envia3050 === 'N' && op.class3050) {
      addErr('T07', `class3050 preenchido mas envia3050=N`, ipoc)
    }
    if (input.envia3050 === 'S') {
      if (!op.class3050) {
        addErr('T08', `class3050 obrigatório quando envia3050=S`, ipoc)
      } else if (!/^\d{9}$/.test(op.class3050)) {
        addErr('T08', `class3050 deve ter exatamente 9 dígitos (valor: ${op.class3050})`, ipoc)
      }
    }

    // Validar pagamentos
    for (const pag of (op.pagamentos || [])) {
      const dataPag = parseDate(pag.data)

      // T02: data do pagamento não pode ser posterior ao saldoDevedor
      if (dataPag && dataSaldo && dataPag > dataSaldo) {
        addErr('T02', `pagamento.data (${pag.data}) posterior a dataSaldoDevedor`, ipoc)
      }

      // T12: data do pagamento anterior a 24 meses
      if (dataPag && dataPag < cutoff24m) {
        addErr('T12', `pagamento.data (${pag.data}) anterior ao limite de 24 meses`, ipoc)
      }

      // T05: duplicata de pagamento (mesmo ipoc + data)
      if (!seenIpoc.has(ipoc)) seenIpoc.set(ipoc, new Map())
      const tiposMap = seenIpoc.get(ipoc)!
      if (!tiposMap.has('pag')) tiposMap.set('pag', new Set())
      const pagDatas = tiposMap.get('pag')!
      if (pagDatas.has(pag.data)) {
        addErr('T05', `pagamento duplicado para a data ${pag.data}`, ipoc)
      }
      pagDatas.add(pag.data)
    }

    // Validar concessões
    for (const con of (op.concessoes || [])) {
      const dataCon = parseDate(con.data)

      // T03: data da concessão não pode ser posterior ao saldoDevedor
      if (dataCon && dataSaldo && dataCon > dataSaldo) {
        addErr('T03', `concessao.data (${con.data}) posterior a dataSaldoDevedor`, ipoc)
      }

      // T13: data da concessão anterior a 24 meses
      if (dataCon && dataCon < cutoff24m) {
        addErr('T13', `concessao.data (${con.data}) anterior ao limite de 24 meses`, ipoc)
      }

      // T06: duplicata de concessão (mesmo ipoc + data)
      const tiposMap = seenIpoc.get(ipoc) || new Map()
      seenIpoc.set(ipoc, tiposMap)
      if (!tiposMap.has('con')) tiposMap.set('con', new Set())
      const conDatas = tiposMap.get('con')!
      if (conDatas.has(con.data)) {
        addErr('T06', `concessao duplicada para a data ${con.data}`, ipoc)
      }
      conDatas.add(con.data)
    }

    // Aviso: operação sem nenhum evento
    const hasEvents = (op.pagamentos?.length ?? 0) +
                      (op.concessoes?.length ?? 0) +
                      (op.cessoes?.length ?? 0) +
                      (op.aquisicoes?.length ?? 0)
    if (hasEvents === 0) {
      addWarn('W01', `operação sem eventos de pagamento, concessão, cessão ou aquisição`, ipoc)
    }

    // Aviso: saldo zerado sem pagamento
    if (op.saldoDevedor === 0 && (op.pagamentos?.length ?? 0) === 0) {
      addWarn('W02', `saldoDevedor zerado sem registro de pagamento`, ipoc)
    }
  }

  return {
    valid: erros.length === 0,
    erros,
    avisos,
    meta: buildMeta(input, input.operacoes.length),
  }
}

// ── Helpers ──────────────────────────────────────────────────
function parseDate(s?: string): Date | null {
  if (!s) return null
  const d = new Date(s + 'T00:00:00Z')
  return isNaN(d.getTime()) ? null : d
}

function parseDateTime(s?: string): Date | null {
  if (!s) return null
  const d = new Date(s.replace(' ', 'T') + 'Z')
  return isNaN(d.getTime()) ? null : d
}

function buildMeta(input: Cadoc3044Input, nOperacoes: number) {
  return {
    cnpjIF: input.cnpjIF || '',
    dataHoraRemessa: input.dataHoraRemessa || '',
    envia3050: input.envia3050 || '',
    nOperacoes,
  }
}
