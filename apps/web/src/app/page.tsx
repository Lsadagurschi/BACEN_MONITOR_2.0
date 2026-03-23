// Redirect direto para dashboard — auth desabilitado temporariamente
import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/dashboard')
}
