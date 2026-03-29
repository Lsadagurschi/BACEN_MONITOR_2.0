import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BACEN Monitor — RegTech para IFs',
  description: 'Plataforma RegTech para geração, validação e gestão de CADOCs do Banco Central do Brasil',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
