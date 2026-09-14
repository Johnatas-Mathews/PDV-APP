import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Vendas from './pages/Vendas' // PDV
import HistoricoVendas from './pages/HistoricoVendas' // Vendas
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
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

const IconLoja = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" />
  </svg>
)

export default function App() {
  const [sidebarAberta, setSidebarAberta] = useState(true)

  const links = [
    { to: '/', label: 'Dashboard', icon: IconDashboard },
    { to: '/pdv', label: 'PDV', icon: IconPDV },
    { to: '/vendas', label: 'Vendas', icon: IconVendasHistorico },
    { to: '/condicionais', label: 'Condicionais (Mala)', icon: IconCondicionais },
    { to: '/compras', label: 'Compras & Reposição', icon: IconCompras },
    { to: '/produtos', label: 'Produtos', icon: IconProdutos },
    { to: '/clientes', label: 'Clientes', icon: IconClientes },
    { to: '/fornecedores', label: 'Fornecedores', icon: IconFornecedores },
    { to: '/contas-receber', label: 'Contas a Receber', icon: IconContas },
    { to: '/relatorios', label: 'Relatórios', icon: IconRelatorios },
    { to: '/configuracoes', label: 'Minha Loja', icon: IconConfig },
  ]

  return (
    <BrowserRouter>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; overflow-x: hidden; }
        
        .app-layout { display: flex; min-height: 100vh; background-color: #f8fafc; position: relative; }
        
        /* Botão Hambúrguer: SÓ APARECE QUANDO A SIDEBAR ESTIVER FECHADA */
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

        /* Sidebar com Animação Fluida */
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

        /* Quando a Sidebar está Oculta */
        .app-sidebar.recolhida {
          margin-left: -250px;
        }

        .sidebar-brand { display: flex; align-items: center; justify-content: space-between; padding: 0 0.5rem 1.25rem 0.5rem; border-bottom: 1px solid #1e293b; margin-bottom: 1.25rem; }
        .brand-content { display: flex; align-items: center; gap: 10px; }
        .brand-badge { width: 36px; height: 36px; background: #2563eb; color: #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .brand-name { display: block; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.05em; color: #ffffff; }
        .brand-sub { display: block; font-size: 0.65rem; color: #64748b; font-weight: 600; }
        
        /* Botão X exclusivo da direita dentro da sidebar */
        .btn-fechar-sidebar {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .btn-fechar-sidebar:hover { color: #ffffff; background: #1e293b; }

        .nav-section-title { display: block; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; color: #475569; padding: 0 0.75rem 0.5rem; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 0.65rem 0.75rem; border-radius: 8px; color: #94a3b8; text-decoration: none; font-size: 0.88rem; font-weight: 500; transition: all 0.15s ease; margin-bottom: 4px; }
        .sidebar-link:hover { color: #ffffff; background: #1e293b; }
        .sidebar-link.active { color: #ffffff; background: #2563eb; }

        /* Área Principal */
        .app-main-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          min-width: 0;
          transition: all 0.25s ease;
        }

        /* Se a sidebar estiver fechada no Desktop, deixa margem para o botão de abrir */
        .app-main-content.sidebar-fechada {
          padding-left: 4.5rem;
        }

        /* Overlay Escuro para Celular */
        .sidebar-backdrop {
          display: none;
        }

        @media (max-width: 768px) {
          .app-sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(0);
            box-shadow: 10px 0 25px rgba(0,0,0,0.5);
          }
          .app-sidebar.recolhida {
            transform: translateX(-100%);
            margin-left: 0;
          }
          .sidebar-backdrop.visivel {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.65);
            z-index: 85;
            backdrop-filter: blur(2px);
          }
          .app-main-content {
            padding: 4.5rem 1rem 1.5rem 1rem;
          }
          .app-main-content.sidebar-fechada {
            padding-left: 1rem;
          }
        }
      `}</style>

      <div className="app-layout">
        {/* Botão Hambúrguer: SÓ APARECE QUANDO A SIDEBAR ESTIVER FECHADA */}
        {!sidebarAberta && (
          <button 
            className="btn-reabrir-sidebar" 
            onClick={() => setSidebarAberta(true)} 
            title="Abrir menu lateral"
          >
            <IconMenuHamburger />
          </button>
        )}

        {/* Backdrop no mobile */}
        <div 
          className={`sidebar-backdrop ${sidebarAberta ? 'visivel' : ''}`} 
          onClick={() => setSidebarAberta(false)}
        />

        {/* Barra Lateral */}
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

            {/* Único botão de fechar (X) da barra */}
            <button 
              className="btn-fechar-sidebar" 
              onClick={() => setSidebarAberta(false)} 
              title="Ocultar menu lateral"
            >
              <IconClose />
            </button>
          </div>

          <nav className="sidebar-nav">
            <span className="nav-section-title">MENU PRINCIPAL</span>
            {links.map((item) => {
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
        </aside>

        {/* Conteúdo da Página */}
        <main className={`app-main-content ${sidebarAberta ? '' : 'sidebar-fechada'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pdv" element={<Vendas />} />
            <Route path="/vendas" element={<HistoricoVendas />} />
            <Route path="/condicionais" element={<Condicionais />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/contas-receber" element={<ContasReceber />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
