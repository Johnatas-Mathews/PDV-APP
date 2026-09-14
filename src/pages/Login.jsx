import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const IconLoja = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" />
  </svg>
)

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

export default function Login() {
  const { autenticar, loadingAuth } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')

  const handleSubmeter = async (e) => {
    e.preventDefault()
    if (!usuario.trim() || !senha.trim()) {
      return alert('Preencha seu usuário e senha.')
    }
    await autenticar(usuario, senha)
  }

  return (
    <div className="login-screen">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-screen {
          min-height: 100vh;
          width: 100%;
          background: #090d16;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .login-card {
          background: #ffffff;
          width: 100%;
          max-width: 400px;
          border-radius: 20px;
          padding: 2.25rem 2rem;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          text-align: center;
        }
        .brand-logo-box {
          width: 54px;
          height: 54px;
          background: #2563eb;
          color: #ffffff;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem auto;
          box-shadow: 0 10px 15px -3px rgba(37,99,235,0.3);
        }
        .login-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .login-subtitle {
          font-size: 0.85rem;
          color: #64748b;
          margin-top: 4px;
          margin-bottom: 1.75rem;
        }
        .login-field {
          text-align: left;
          margin-bottom: 1.25rem;
        }
        .login-field label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }
        .input-wrapper {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 0 12px;
          height: 46px;
          transition: all 0.15s ease;
        }
        .input-wrapper:focus-within {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .input-wrapper input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          height: 100%;
          padding-left: 10px;
          font-size: 0.95rem;
          color: #0f172a;
        }
        .btn-entrar {
          width: 100%;
          height: 48px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
          margin-top: 0.5rem;
        }
        .btn-entrar:hover {
          background: #1d4ed8;
        }
        .btn-entrar:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
        .login-footer {
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }
      `}</style>

      <div className="login-card">
        <div className="brand-logo-box">
          <IconLoja />
        </div>
        <h1 className="login-title">TECCO PDV</h1>
        <p className="login-subtitle">Acesse com suas credenciais de operador</p>

        <form onSubmit={handleSubmeter}>
          <div className="login-field">
            <label>Usuário</label>
            <div className="input-wrapper">
              <IconUser />
              <input
                type="text"
                placeholder="Ex: admin ou seu nome"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label>Senha</label>
            <div className="input-wrapper">
              <IconLock />
              <input
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-entrar" disabled={loadingAuth}>
            {loadingAuth ? 'Verificando acesso...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="login-footer">
          Sistema de Gestão Comercial • Varejo & Moda
        </div>
      </div>
    </div>
  )
}
