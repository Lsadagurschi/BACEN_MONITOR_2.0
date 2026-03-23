// ============================================================
// Validador CADOC 3044 — Eventos de Crédito
// Regras: T01–T13, B01 (Manual BCB, mar/2026)
// ============================================================

// ── Local types (inline to avoid workspace resolution issues) ─
interface ValidationError {
  tipo: 'erro' | 'aviso'
  cod: string
  msg: string
  arquivo?: string
  linha?: number
  campo?: string
  op?: string
}

interface Cadoc3044Evento {
  acao: 1 | 2
  data: string
  valor?: number
  tpMotivo?: string
}

interface Cadoc3044Operacao {
  acao: 1 | 2
  ipoc?: string
  saldoDevedor?: number
  dataSaldoDevedor?: string
  atraso?: 'S' | 'N'
  class3050?: string
  pagamentos?: Cadoc3044Evento[]
  concessoes?: Cadoc3044Evento[]
  cessoes?: Cadoc3044Evento[]
  aquisicoes?: Cadoc3044Evento[]
}

interface Cadoc3044Input {
  cnpjIF?: string
  dataHoraRemessa?: string
  envia3050?: 'S' | 'N'
  operacoes?: Cadoc3044Operacao[]
}

export interface Validate3044Result {
  valid: boolean
  error?: string
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

  const addErr  = (cod: string, msg: string, op?: string) =>
    erros.push({ tipo: 'erro', cod, msg, op })
  const addWarn = (cod: string, msg: string, op?: string) =>
    avisos.push({ tipo: 'aviso', cod, msg, op })

  // B01: campos obrigatórios do cabeçalho
  if (!input.cnpjIF)          addErr('B01', 'cnpjIF ausente ou inválido')
  if (!input.dataHoraRemessa) addErr('B01', 'dataHoraRemessa ausente')
  if (!input.envia3050)       addErr('B01', 'envia3050 ausente (S ou N)')
  if (!Array.isArray(input.operacoes) || input.operacoes.length === 0) {
    addErr('B01', 'operacoes deve ser array não vazio')
    return { valid: false, erros, avisos, meta: buildMeta(input, 0) }
  }

  // T04: dataHoraRemessa não pode ser futura
  const tsRemessa = parseDateTime(input.dataHoraRemessa)
  if (tsRemessa && tsRemessa > new Date())
    addErr('T04', `dataHoraRemessa ${input.dataHoraRemessa} é posterior ao momento atual`)

  const cutoff24m = new Date()
  cutoff24m.setMonth(cutoff24m.getMonth() - 24)

  const seenIpoc = new Map<string, Map<string, Set<string>>>()

  for (const op of input.operacoes!) {
    const ipoc = op.ipoc || '(sem IPOC)'

    if (op.acao === 1) {
      if (!op.ipoc)                      addErr('B01', 'ipoc obrigatório para acao=1', ipoc)
      if (op.saldoDevedor === undefined) addErr('B01', 'saldoDevedor obrigatório para acao=1', ipoc)
      if (!op.dataSaldoDevedor)          addErr('B01', 'dataSaldoDevedor obrigatório para acao=1', ipoc)
      if (!op.atraso)                    addErr('B01', 'atraso obrigatório para acao=1 (S ou N)', ipoc)
    } else if (op.acao === 2) {
      if (!op.ipoc) addErr('B01', 'ipoc obrigatório para acao=2', ipoc)
      continue
    } else {
      addErr('B01', `acao inválida: ${op.acao} (esperado 1 ou 2)`, ipoc)
      continue
    }

    const dataSaldo = parseDate(op.dataSaldoDevedor)

    // T01: dataSaldoDevedor não pode ser posterior à remessa
    if (dataSaldo && tsRemessa && dataSaldo > tsRemessa)
      addErr('T01', `dataSaldoDevedor (${op.dataSaldoDevedor}) posterior à remessa`, ipoc)

    // T11: cutoff 24 meses
    if (dataSaldo && dataSaldo < cutoff24m)
      addErr('T11', `dataSaldoDevedor (${op.dataSaldoDevedor}) anterior ao limite de 24 meses`, ipoc)

    // T07/T08: class3050
    if (input.envia3050 === 'N' && op.class3050)
      addErr('T07', `class3050 preenchido mas envia3050=N`, ipoc)
    if (input.envia3050 === 'S') {
      if (!op.class3050)
        addErr('T08', `class3050 obrigatório quando envia3050=S`, ipoc)
      else if (!/^\d{9}$/.test(op.class3050))
        addErr('T08', `class3050 deve ter 9 dígitos (valor: ${op.class3050})`, ipoc)
    }

    // Pagamentos
    for (const pag of (op.pagamentos || [])) {
      const dataPag = parseDate(pag.data)
      if (dataPag && dataSaldo && dataPag > dataSaldo)
        addErr('T02', `pagamento.data (${pag.data}) posterior a dataSaldoDevedor`, ipoc)
      if (dataPag && dataPag < cutoff24m)
        addErr('T12', `pagamento.data (${pag.data}) anterior ao limite de 24 meses`, ipoc)

      if (!seenIpoc.has(ipoc)) seenIpoc.set(ipoc, new Map())
      const tiposMap = seenIpoc.get(ipoc)!
      if (!tiposMap.has('pag')) tiposMap.set('pag', new Set())
      const pagDatas = tiposMap.get('pag')!
      if (pagDatas.has(pag.data)) addErr('T05', `pagamento duplicado na data ${pag.data}`, ipoc)
      pagDatas.add(pag.data)
    }

    // Concessões
    for (const con of (op.concessoes || [])) {
      const dataCon = parseDate(con.data)
      if (dataCon && dataSaldo && dataCon > dataSaldo)
        addErr('T03', `concessao.data (${con.data}) posterior a dataSaldoDevedor`, ipoc)
      if (dataCon && dataCon < cutoff24m)
        addErr('T13', `concessao.data (${con.data}) anterior ao limite de 24 meses`, ipoc)

      const tiposMap = seenIpoc.get(ipoc) || new Map()
      seenIpoc.set(ipoc, tiposMap)
      if (!tiposMap.has('con')) tiposMap.set('con', new Set())
      const conDatas = tiposMap.get('con')!
      if (conDatas.has(con.data)) addErr('T06', `concessao duplicada na data ${con.data}`, ipoc)
      conDatas.add(con.data)
    }

    // Aviso: sem eventos
    const hasEvents = (op.pagamentos?.length ?? 0) + (op.concessoes?.length ?? 0) +
                      (op.cessoes?.length ?? 0)    + (op.aquisicoes?.length ?? 0)
    if (hasEvents === 0)
      addWarn('W01', `operação sem eventos de pagamento, concessão, cessão ou aquisição`, ipoc)
  }

  return {
    valid: erros.length === 0,
    erros,
    avisos,
    meta: buildMeta(input, input.operacoes!.length),
  }
}

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
    cnpjIF:           input.cnpjIF || '',
    dataHoraRemessa:  input.dataHoraRemessa || '',
    envia3050:        input.envia3050 || '',
    nOperacoes,
  }
}
