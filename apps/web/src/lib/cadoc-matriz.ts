// Tipos e matriz de CADOCs por instituição — extraído para lib para evitar conflito com Next.js page exports

export type CRow = { cod: string; nome: string; per: string; obrig: 'SIM' | 'COND'; obs?: string }
export type CMatrix = { desc: string; obrig: CRow[]; cond: CRow[] }

export const MATRIZ: Record<string, CMatrix> = {
  s1: {
    desc: 'Banco sistemicamente importante (PR >= R$245bi ou G-SIB). Basileia III completo com TLAC, LCR e NSFR individuais.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',          per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',           per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',         per:'Diaria',     obrig:'SIM' },
      { cod:'2020', nome:'Capital — PR e Indices Basileia III',     per:'Mensal',     obrig:'SIM' },
      { cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',      per:'Mensal',     obrig:'SIM' },
      { cod:'2025', nome:'LCR — Liquidity Coverage Ratio',          per:'Mensal',     obrig:'SIM' },
      { cod:'2030', nome:'NSFR — Net Stable Funding Ratio',         per:'Mensal',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Credito', per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Credito',                per:'Por evento', obrig:'SIM' },
      { cod:'2055', nome:'Pix — Informacoes Operacionais',          per:'Mensal',     obrig:'SIM' },
    ],
    cond: [
      { cod:'6334', nome:'Cartoes Credenciadores (ASPB034)', per:'Trimestral', obrig:'COND', obs:'Apenas se atuar como credenciador' },
      { cod:'6308', nome:'Cartoes Emissores',                per:'Trimestral', obrig:'COND', obs:'Apenas se emitir cartoes em arranjo' },
    ],
  },
  s2: {
    desc: 'Banco medio com atividade internacional (PR R$100-244bi). Basileia III completo (sem TLAC), LCR e NSFR.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',          per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',           per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',         per:'Diaria',     obrig:'SIM' },
      { cod:'2020', nome:'Capital — PR e Indices Basileia III',     per:'Mensal',     obrig:'SIM' },
      { cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',      per:'Mensal',     obrig:'SIM' },
      { cod:'2025', nome:'LCR — Liquidity Coverage Ratio',          per:'Mensal',     obrig:'SIM' },
      { cod:'2030', nome:'NSFR — Net Stable Funding Ratio',         per:'Mensal',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Credito', per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Credito',                per:'Por evento', obrig:'SIM' },
      { cod:'2055', nome:'Pix — Informacoes Operacionais',          per:'Mensal',     obrig:'SIM' },
    ],
    cond: [{ cod:'6334', nome:'Cartoes Credenciadores', per:'Trimestral', obrig:'COND', obs:'Apenas se credenciador' }],
  },
  s3: {
    desc: 'IF de medio porte (PR R$2,3-99,9bi). Basileia III simplificado com ILC em vez de LCR, sem NSFR individual.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',           per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',            per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',          per:'Diaria',     obrig:'SIM' },
      { cod:'2020', nome:'Capital — PR e Indices (Basileia simpl.)', per:'Mensal',     obrig:'SIM' },
      { cod:'2045', nome:'RWA — Ativos Ponderados pelo Risco',       per:'Mensal',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Credito',  per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Credito',                 per:'Por evento', obrig:'SIM' },
    ],
    cond: [
      { cod:'2055', nome:'Pix — Informacoes Operacionais', per:'Mensal',     obrig:'COND', obs:'Se participante direto com ISPB' },
      { cod:'6334', nome:'Cartoes Credenciadores',         per:'Trimestral', obrig:'COND', obs:'Se atuar como credenciador' },
    ],
  },
  s4: {
    desc: 'IF de menor porte (PR R$500M-2,29bi). ICP simplificado no lugar do RWA. SCR e Pix condicionais.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF',            per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',             per:'Semestral', obrig:'SIM' },
      { cod:'2020', nome:'Capital — Indice de Capital Proprio (ICP)', per:'Mensal',   obrig:'SIM' },
    ],
    cond: [
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',         per:'Diaria',     obrig:'COND', obs:'Apenas se mantiver conta reservas BCB' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Credito', per:'Mensal',     obrig:'COND', obs:'Apenas se possuir carteira de credito' },
      { cod:'3044', nome:'SCR — Eventos de Credito',                per:'Por evento', obrig:'COND', obs:'Condicional ao SCR 3040' },
      { cod:'2055', nome:'Pix — Informacoes Operacionais',          per:'Mensal',     obrig:'COND', obs:'Apenas se participante direto com ISPB' },
    ],
  },
  s5: {
    desc: 'Microinstituicao (PR < R$500M). Menor carga regulatoria do SFN. Sem LCR, NSFR nem DLO.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal (D+15)', obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',  per:'Semestral',    obrig:'SIM' },
      { cod:'2020', nome:'Capital — ICP Simplificado',     per:'Trimestral',   obrig:'SIM' },
    ],
    cond: [{ cod:'3040', nome:'SCR — Dados de Credito', per:'Mensal', obrig:'COND', obs:'Apenas se possuir exposicoes >= R$200' }],
  },
  adquirente: {
    desc: 'Credenciador/Adquirente: habilita ECs e participa da liquidacao. Capital minimo R$2M (Res. BCB 407/2024).',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
      { cod:'6334', nome:'Cartoes Credenciadores — ASPB034',    per:'Trimestral',obrig:'SIM' },
    ],
    cond: [
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO', per:'Diaria',     obrig:'COND', obs:'Se mantiver conta de liquidacao relevante no BCB' },
      { cod:'2055', nome:'Pix — Informacoes Operacionais',  per:'Mensal',     obrig:'COND', obs:'Apenas se participante direto do Pix com ISPB' },
      { cod:'2050', nome:'Arranjos de Pagamento',           per:'Trimestral', obrig:'COND', obs:'Apenas se tambem for instituidor do arranjo' },
      { cod:'3040', nome:'SCR — Dados de Credito',          per:'Mensal',     obrig:'COND', obs:'Apenas se oferecer credito (antecipacao, BNPL)' },
    ],
  },
  subadquirente: {
    desc: 'Habilita ECs sem participar diretamente da liquidacao. Res. BCB 522/2025: liquidacao centralizada obrigatoria a partir de 09/05/2026.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
    ],
    cond: [
      { cod:'2055', nome:'Pix — Informacoes Operacionais', per:'Mensal', obrig:'COND', obs:'Se participante direto com ISPB proprio' },
      { cod:'3040', nome:'SCR — Dados de Credito',         per:'Mensal', obrig:'COND', obs:'Se oferecer credito proprio' },
    ],
  },
  emissor_pre: {
    desc: 'Emissor de instrumento pre-pago: conta digital, cartao pre-pago, carteira eletronica.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',     per:'Diaria',    obrig:'SIM' },
      { cod:'2055', nome:'Pix — Informacoes Operacionais',      per:'Mensal',    obrig:'SIM', obs:'Se participante direto do SPI' },
    ],
    cond: [{ cod:'3040', nome:'SCR — Dados de Credito', per:'Mensal', obrig:'COND', obs:'Apenas se oferecer credito (SCD cumulativa)' }],
  },
  emissor_pos: {
    desc: 'Emissor pos-pago: cartao de credito, conta pos-paga. Obrigatoriamente sujeito ao SCR.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)',     per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',           per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',         per:'Diaria',     obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados Individualizados de Credito', per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Credito',                per:'Por evento', obrig:'SIM' },
      { cod:'6308', nome:'Cartoes de Pagamento — Emissores',        per:'Trimestral', obrig:'SIM' },
    ],
    cond: [{ cod:'2055', nome:'Pix — Informacoes Operacionais', per:'Mensal', obrig:'COND', obs:'Se participante direto do Pix' }],
  },
  itp: {
    desc: 'Iniciador de Transacao de Pagamento via Open Finance. Nao detem fundos. Menor carga entre as IPs.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF (IP)', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',       per:'Semestral', obrig:'SIM' },
    ],
    cond: [{ cod:'2055', nome:'Pix — Informacoes Operacionais', per:'Mensal', obrig:'COND', obs:'Apenas se possuir ISPB proprio' }],
  },
  scd: {
    desc: 'Sociedade de Credito Direto: fintech de credito com recursos proprios. IF autorizada pelo BCB. Sem Basileia III.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal',     obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',  per:'Semestral',  obrig:'SIM' },
      { cod:'4111', nome:'Posicao Financeira Diaria — DLO',per:'Diaria',    obrig:'SIM' },
      { cod:'3040', nome:'SCR — Dados de Credito',         per:'Mensal',     obrig:'SIM' },
      { cod:'3044', nome:'SCR — Eventos de Credito',       per:'Por evento', obrig:'SIM' },
    ],
    cond: [{ cod:'2055', nome:'Pix — Informacoes Operacionais', per:'Mensal', obrig:'COND', obs:'Apenas se for tambem EME com ISPB' }],
  },
  psav: {
    desc: 'PSAV: exchange, custodiante ou intermediaria de ativos virtuais. Marco regulatorio desde 02/02/2026.',
    obrig: [
      { cod:'4010', nome:'Balancete Patrimonial — COSIF', per:'Mensal',    obrig:'SIM' },
      { cod:'4016', nome:'Balanco Patrimonial Semestral',  per:'Semestral', obrig:'SIM' },
      { cod:'C212', nome:'Servicos de Ativos Virtuais',   per:'Mensal',    obrig:'SIM', obs:'A partir de mai/2026 — IN BCB 693/2025' },
    ],
    cond: [],
  },
}

export const TIPOS = [
  { id:'s1',           l:'S1 — Banco Sistemico',          g:'Segmentos Prudenciais' },
  { id:'s2',           l:'S2 — Banco Medio Internacional', g:'Segmentos Prudenciais' },
  { id:'s3',           l:'S3 — IF Medio Porte',            g:'Segmentos Prudenciais' },
  { id:'s4',           l:'S4 — IF Menor Porte',            g:'Segmentos Prudenciais' },
  { id:'s5',           l:'S5 — Microinstituicao',          g:'Segmentos Prudenciais' },
  { id:'adquirente',   l:'Adquirente / Credenciador',      g:'Instituicoes de Pagamento' },
  { id:'subadquirente',l:'Subadquirente',                  g:'Instituicoes de Pagamento' },
  { id:'emissor_pre',  l:'Emissor Pre-pago',               g:'Instituicoes de Pagamento' },
  { id:'emissor_pos',  l:'Emissor Pos-pago',               g:'Instituicoes de Pagamento' },
  { id:'itp',          l:'ITP — Iniciador',                g:'Instituicoes de Pagamento' },
  { id:'scd',          l:'SCD — Credito Direto',           g:'Credito' },
  { id:'psav',         l:'PSAV — Ativos Virtuais',         g:'Outros' },
]

export const SEGS = [
  { id:'S1', l:'S1 — Porte Sistemico (PR >= R$245bi)' },
  { id:'S2', l:'S2 — Porte Grande (PR R$100-244bi)' },
  { id:'S3', l:'S3 — Porte Medio (PR R$2,3-99,9bi)' },
  { id:'S4', l:'S4 — Porte Menor (PR R$500M-2,29bi)' },
  { id:'S5', l:'S5 — Microinstituicao (PR < R$500M)' },
  { id:'N',  l:'Nao sujeito a segmento prudencial' },
]
