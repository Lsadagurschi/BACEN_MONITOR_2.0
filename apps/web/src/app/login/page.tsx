'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f3ee',fontFamily:'Arial,sans-serif'}}>
      <div style={{background:'#fff',border:'1px solid #d1c9b8',borderRadius:16,padding:'48px 40px',width:400,boxShadow:'0 20px 60px rgba(10,15,30,0.08)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:48,height:48,background:'linear-gradient(135deg,#0a7c5c,#1d5fcc)',borderRadius:12,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:12}}>🏦</div>
          <div style={{fontSize:20,fontWeight:800,color:'#0a0f1e'}}>BACEN Monitor</div>
          <div style={{fontSize:13,color:'#6b7280',marginTop:4}}>Conformidade regulatória para IFs</div>
        </div>
        {sent ? (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:16}}>✅</div>
            <div style={{fontSize:16,fontWeight:700,color:'#0a0f1e',marginBottom:8}}>Redirecionando...</div>
            <a href="/dashboard" style={{display:'inline-block',marginTop:12,padding:'10px 24px',background:'#0a0f1e',color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:700}}>
              Acessar Dashboard →
            </a>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label style={{display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:6}}>E-mail</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="compliance@suaif.com.br" required
              style={{width:'100%',padding:'11px 14px',border:'1px solid #d1c9b8',borderRadius:8,fontSize:14,outline:'none',marginBottom:16,fontFamily:'Arial',boxSizing:'border-box'}}/>
            <button type="submit" style={{width:'100%',padding:12,background:'#0a0f1e',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>
              Entrar →
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
