'use client'

interface LinkItem {
  titulo: string
  desc: string
  url: string
  icon: string
  categoria: string
  destaque?: boolean
}

const LINKS: LinkItem[] = [
  // Portal principal BCB
  {
    titulo: 'Portal BCB',
    desc: 'Site oficial do Banco Central do Brasil — normativos, notícias e dados',
    url: 'https://www.bcb.gov.br',
    icon: '🏦',
    categoria: 'Portal Principal',
    destaque: true,
  },
  {
    titulo: 'Normatização & Regulamentação',
    desc: 'Busca de resoluções, circulares e instruções normativas vigentes',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/normatizacao_regulamentacao',
    icon: '📋',
    categoria: 'Portal Principal',
  },
  // CADOC / Relatórios
  {
    titulo: 'STA — Sistema de Transferência de Arquivos',
    desc: 'Envio de CADOCs, arquivos regulatórios e entregas ao BCB',
    url: 'https://www.bcb.gov.br/acessoinformacao/areastematicas/sta',
    icon: '📤',
    categoria: 'Envio de CADOCs',
    destaque: true,
  },
  {
    titulo: 'Manual do STA',
    desc: 'Documentação técnica, homologação e certificados do STA',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/sta',
    icon: '📗',
    categoria: 'Envio de CADOCs',
  },
  {
    titulo: 'Manual do CADOC',
    desc: 'Leiautes, regras e manuais técnicos de todos os CADOCs',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/cadocs',
    icon: '📘',
    categoria: 'Envio de CADOCs',
    destaque: true,
  },
  // SCR e Crédito
  {
    titulo: 'SCR — Sistema de Crédito (CADOC 3040/3044)',
    desc: 'Informações sobre o SCR, base do CADOC 3040 e eventos 3044',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/scr',
    icon: '💰',
    categoria: 'Crédito & SCR',
  },
  {
    titulo: 'Manual SCR (Nota Técnica)',
    desc: 'Definições de modalidades, IPOC, codificações e regras de validação',
    url: 'https://www.bcb.gov.br/content/estabilidadefinanceira/scr/manualscr.pdf',
    icon: '📄',
    categoria: 'Crédito & SCR',
  },
  // COSIF e Contabilidade
  {
    titulo: 'COSIF Online',
    desc: 'Plano contábil das IFs — contas, subcontas e codificação COSIF',
    url: 'https://www3.bcb.gov.br/aplica/cosif',
    icon: '📊',
    categoria: 'Contabilidade COSIF',
    destaque: true,
  },
  {
    titulo: 'Manual COSIF (PDF)',
    desc: 'Manual completo do Plano Contábil das Instituições do SFN',
    url: 'https://www.bcb.gov.br/content/estabilidadefinanceira/cosif/Manual-Cosif.pdf',
    icon: '📑',
    categoria: 'Contabilidade COSIF',
  },
  // Indicadores SGS
  {
    titulo: 'SGS — Sistema Gerenciador de Séries Temporais',
    desc: 'API de dados macroeconômicos: Selic, IPCA, PTAX, câmbio e mais',
    url: 'https://www.bcb.gov.br/acessoinformacao/areastematicas/sgs',
    icon: '📈',
    categoria: 'Dados & Indicadores',
    destaque: true,
  },
  {
    titulo: 'API SGS — Documentação',
    desc: 'Endpoints REST para consumo de séries temporais do BCB',
    url: 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/swagger-ui3',
    icon: '🔌',
    categoria: 'Dados & Indicadores',
  },
  {
    titulo: 'Focus — Boletim Expectativas',
    desc: 'Relatório Focus: projeções do mercado para IPCA, Selic, PIB, câmbio',
    url: 'https://www.bcb.gov.br/publicacoes/focus',
    icon: '🎯',
    categoria: 'Dados & Indicadores',
  },
  // Pix e Pagamentos
  {
    titulo: 'Pix — Regulamentação e Dados',
    desc: 'Regras operacionais, chaves Pix, limites, estatísticas e CADOC 2055',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/pix',
    icon: '⚡',
    categoria: 'Pix & Pagamentos',
    destaque: true,
  },
  {
    titulo: 'Open Finance Brasil',
    desc: 'Regulamentação, cronograma e Portal de Conformidade do Open Finance',
    url: 'https://openfinancebrasil.org.br',
    icon: '🌐',
    categoria: 'Pix & Pagamentos',
  },
  {
    titulo: 'DREX — Real Digital',
    desc: 'Projeto-piloto do real digital (CBDC) — documentação e normativos',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/drex',
    icon: '🪙',
    categoria: 'Pix & Pagamentos',
  },
  // Prudencial e Capital
  {
    titulo: 'Basileia III — Capital e Liquidez',
    desc: 'Regras prudenciais: RWA, LCR, NSFR, Tier 1/2 para S1/S2',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/basileia',
    icon: '🛡️',
    categoria: 'Prudencial & Capital',
  },
  {
    titulo: 'Segmentação Prudencial (Res. 197)',
    desc: 'Resolução BCB 197/2022 — definição dos segmentos S1 a S5',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolução%20BCB&numero=197',
    icon: '📐',
    categoria: 'Prudencial & Capital',
  },
  // Consultas e Ferramentas
  {
    titulo: 'CNPJ & IF — Consulta IF.data',
    desc: 'Consulta de dados cadastrais de IFs autorizadas pelo BCB',
    url: 'https://www.bcb.gov.br/acessoinformacao/legado?url=https%3A%2F%2Fifdata.bcb.gov.br%2F',
    icon: '🔎',
    categoria: 'Consultas & Ferramentas',
  },
  {
    titulo: 'Chave Pix — Consulta DICT',
    desc: 'Consulta ao Diretório de Identificadores de Contas Transacionais',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/chaves_pix',
    icon: '🗂️',
    categoria: 'Consultas & Ferramentas',
  },
  {
    titulo: 'Calendário Financeiro BCB',
    desc: 'Feriados bancários, prazos e datas de referência do SFN',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/feriados',
    icon: '📅',
    categoria: 'Consultas & Ferramentas',
  },
]

const categorias = Array.from(new Set(LINKS.map(l => l.categoria)))

export default function LinksPage() {
  return (
    <div style={{ padding: '28px 36px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0f1e', marginBottom: 4 }}>
          Links Úteis — Portal BCB & Ferramentas
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Acesso rápido aos portais, manuais, APIs e sistemas do Banco Central utilizados na conformidade regulatória.
        </p>
      </div>

      {/* Destaques */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Courier New', marginBottom: 12 }}>
          Acesso Rápido
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {LINKS.filter(l => l.destaque).map(l => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              background: '#fff', border: '2px solid #a7f3d0', borderRadius: 12,
              textDecoration: 'none', transition: 'border-color .15s',
            }}>
              <span style={{ fontSize: 24 }}>{l.icon}</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0a0f1e' }}>{l.titulo}</div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{l.categoria}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Por categoria */}
      {categorias.map(cat => {
        const links = LINKS.filter(l => l.categoria === cat)
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Courier New', marginBottom: 10 }}>
              {cat}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {links.map(l => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                  background: '#fff', border: '1px solid #d1c9b8', borderRadius: 10,
                  textDecoration: 'none', transition: 'border-color .15s',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{l.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0a0f1e' }}>{l.titulo}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{l.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
