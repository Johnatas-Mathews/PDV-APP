import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vendas from './pages/Vendas'
import HistoricoVendas from './pages/HistoricoVendas'
import Condicionais from './pages/Condicionais'
import Compras from './pages/Compras'
import Clientes from './pages/Clientes'
import Fornecedores from './pages/Fornecedores'
import Produtos from './pages/Produtos'
import ContasReceber from './pages/ContasReceber'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'

// Ícones SVG minimalistas
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
)

const IconPDV = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
)

const IconVendasHistorico = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

const IconCondicionais = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const IconCompras = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-4v10" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
  </svg>
)

const IconClientes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconFornecedores = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
  </svg>
)

const IconProdutos = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
)

const IconContas = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17V7" />
  </svg>
)

const IconRelatorios = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
  </svg>
)

const IconConfig = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const IconMenuHamburger = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const IconLoja = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" />
  </svg>
)

function MainAppLayout() {
  const [sidebarAberta, setSidebarAberta] = useState(true)
  const { operador, isAdmin, logout } = useAuth()

  // Se NÃO estiver autenticado, exibe a tela cheia oficial de Login
  if (!operador) {
    return <Login />
  }

  // Links do menu filtrados por perfil de acesso
  const todosOsLinks = [
    { to: '/', label: 'Dashboard', icon: IconDashboard, apenasAdmin: true },
    { to: '/pdv', label: 'PDV', icon: IconPDV, apenasAdmin: false },
    { to: '/vendas', label: 'Vendas', icon: IconVendasHistorico, apenasAdmin: false },
    { to: '/condicionais', label: 'Condicionais (Mala)', icon: IconCondicionais, apenasAdmin: false },
    { to: '/compras', label: 'Compras & Reposição', icon: IconCompras, apenasAdmin: true },
    { to: '/produtos', label: 'Produtos', icon: IconProdutos, apenasAdmin: false },
    { to: '/clientes', label: 'Clientes', icon: IconClientes, apenasAdmin: false },
    { to: '/fornecedores', label: 'Fornecedores', icon: IconFornecedores, apenasAdmin: true },
    { to: '/contas-receber', label: 'Contas a Receber', icon: IconContas, apenasAdmin: true },
    { to: '/relatorios', label: 'Relatórios', icon: IconRelatorios, apenasAdmin: true },
    { to: '/configuracoes', label: 'Minha Loja', icon: IconConfig, apenasAdmin: true },
  ]

  const linksVisiveis = todosOsLinks.filter(item => !item.apenasAdmin || isAdmin)

  return (
    <div className="app-layout">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; overflow-x: hidden; }
        .app-layout { display: flex; min-height: 100vh; background-color: #f8fafc; position: relative; }
        
        .btn-reabrir-sidebar {
          position: fixed;
          top: 14px;
          left: 14px;
          z-index: 100;
          background: #090d16;
          color: #ffffff;
          border: 1px solid #1e293b;
          border-radius: 10px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
          transition: all 0.2s ease;
        }
        .btn-reabrir-sidebar:hover { background: #1e293b; color: #2563eb; }

        .app-sidebar {
          width: 250px;
          min-width: 250px;
          background-color: #090d16;
          border-right: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          padding: 1.25rem 1rem;
          transition: transform 0.25s ease, margin-left 0.25s ease;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          z-index: 90;
        }

        .app-sidebar.recolhida {
          margin-left: -250px;
        }

        .sidebar-brand { display: flex; align-items: center; justify-content: space-between; padding: 0 0.5rem 1.25rem 0.5rem; border-bottom: 1px solid #1e293b; margin-bottom: 1.25rem; }
        .brand-content { display: flex; align-items: center; gap: 10px; }
        .brand-badge { width: 36px; height: 36px; background: #2563eb; color: #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .brand-name { display: block; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.05em; color: #ffffff; }
        .brand-sub { display: block; font-size: 0.65rem; color: #64748b; font-weight: 600; }
        
        .btn-fechar-sidebar { background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .btn-fechar-sidebar:hover { color: #ffffff; background: #1e293b; }

        .nav-section-title { display: block; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; color: #475569; padding: 0 0.75rem 0.5rem; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 0.65rem 0.75rem; border-radius: 8px; color: #94a3b8; text-decoration: none; font-size: 0.88rem; font-weight: 500; transition: all 0.15s ease; margin-bottom: 4px; }
        .sidebar-link:hover { color: #ffffff; background: #1e293b; }
        .sidebar-link.active { color: #ffffff; background: #2563eb; }

        /* Rodapé com Perfil do Operador e Botão Sair */
        .sidebar-user-box {
          margin-top: auto;
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .user-info { display: flex; align-items: center; gap: 8px; }
        .user-avatar { width: 30px; height: 30px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; }
        .user-name { font-size: 0.82rem; font-weight: 700; color: #ffffff; display: block; }
        .user-role { font-size: 0.68rem; color: #9ca3af; display: block; text-transform: uppercase; }
        .btn-logout { background: transparent; border: none; color: #ef4444; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 700; padding: 4px 6px; border-radius: 6px; }
        .btn-logout:hover { background: rgba(239, 68, 68, 0.1); }

        .app-main-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          min-width: 0;
          transition: all 0.25s ease;
        }

        .app-main-content.sidebar-fechada { padding-left: 4.5rem; }
        .sidebar-backdrop { display: none; }

        @media (max-width: 768px) {
          .app-sidebar { position: fixed; top: 0; bottom: 0; left: 0; transform: translateX(0); box-shadow: 10px 0 25px rgba(0,0,0,0.5); }
          .app-sidebar.recolhida { transform: translateX(-100%); margin-left: 0; }
          .sidebar-backdrop.visivel { display: block; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 85; backdrop-filter: blur(2px); }
          .app-main-content { padding: 4.5rem 1rem 1.5rem 1rem; }
          .app-main-content.sidebar-fechada { padding-left: 1rem; }
        }
      `}</style>

      {!sidebarAberta && (
        <button className="btn-reabrir-sidebar" onClick={() => setSidebarAberta(true)} title="Abrir menu">
          <IconMenuHamburger />
        </button>
      )}

      <div 
        className={`sidebar-backdrop ${sidebarAberta ? 'visivel' : ''}`} 
        onClick={() => setSidebarAberta(false)}
      />

      <aside className={`app-sidebar ${sidebarAberta ? '' : 'recolhida'}`}>
        <div className="sidebar-brand">
          <div className="brand-content">
            <div className="brand-badge">
              <IconLoja />
            </div>
            <div className="brand-text">
              <span className="brand-name">TECCO</span>
              <span className="brand-sub">PDV SISTEMA</span>
            </div>
          </div>

          <button className="btn-fechar-sidebar" onClick={() => setSidebarAberta(false)} title="Ocultar menu">
            <IconClose />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-title">MENU PRINCIPAL</span>
          {linksVisiveis.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth <= 768) setSidebarAberta(false)
                }}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Rodapé do Operador com Botão Oficial de Sair */}
        <div className="sidebar-user-box">
          <div className="user-info">
            <div className="user-avatar">
              <IconUser />
            </div>
            <div>
              <span className="user-name">{operador.nome}</span>
              <span className="user-role">{operador.perfil === 'admin' ? 'Administrador' : 'Vendedor'}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={logout} title="Fazer Logout">
            <IconLogout /> Sair
          </button>
        </div>
      </aside>

      <main className={`app-main-content ${sidebarAberta ? '' : 'sidebar-fechada'}`}>
        <Routes>
          <Route path="/" element={isAdmin ? <Dashboard /> : <Navigate to="/pdv" replace />} />
          <Route path="/pdv" element={<Vendas />} />
          <Route path="/vendas" element={<HistoricoVendas />} />
          <Route path="/condicionais" element={<Condicionais />} />
          <Route path="/compras" element={isAdmin ? <Compras /> : <Navigate to="/pdv" replace />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/fornecedores" element={isAdmin ? <Fornecedores /> : <Navigate to="/pdv" replace />} />
          <Route path="/contas-receber" element={isAdmin ? <ContasReceber /> : <Navigate to="/pdv" replace />} />
          <Route path="/relatorios" element={isAdmin ? <Relatorios /> : <Navigate to="/pdv" replace />} />
          <Route path="/configuracoes" element={isAdmin ? <Configuracoes /> : <Navigate to="/pdv" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainAppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}
