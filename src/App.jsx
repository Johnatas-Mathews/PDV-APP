import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Vendas from './pages/Vendas'
import Clientes from './pages/Clientes'
import Produtos from './pages/Produtos'
import ContasReceber from './pages/ContasReceber'
import Relatorios from './pages/Relatorios'

// Ícones SVG minimalistas nativos
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
)

const IconVendas = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
)

const IconClientes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconProdutos = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
)

const IconContas = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17V7" />
  </svg>
)

const IconRelatorios = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
  </svg>
)

const IconLoja = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" />
  </svg>
)

export default function App() {
  const links = [
    { to: '/', label: 'Dashboard', icon: IconDashboard },
    { to: '/vendas', label: 'Vendas', icon: IconVendas },
    { to: '/clientes', label: 'Clientes', icon: IconClientes },
    { to: '/produtos', label: 'Produtos', icon: IconProdutos },
    { to: '/contas-receber', label: 'Contas a Receber', icon: IconContas },
    { to: '/relatorios', label: 'Relatórios', icon: IconRelatorios },
  ]

  return (
    <BrowserRouter>
      {/* Estilos Globais Injetados Diretamente (dispensa qualquer import de arquivo .css) */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; }
        .app-layout { display: flex; min-height: 100vh; background-color: #f8fafc; }
        .app-sidebar { width: 240px; min-width: 240px; background-color: #090d16; border-right: 1px solid #1e293b; display: flex; flex-direction: column; padding: 1.5rem 1rem; }
        .sidebar-brand { display: flex; align-items: center; gap: 12px; padding: 0 0.5rem 1.5rem 0.5rem; border-bottom: 1px solid #1e293b; margin-bottom: 1.5rem; }
        .brand-badge { width: 36px; height: 36px; background: #2563eb; color: #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .brand-name { display: block; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.05em; color: #ffffff; }
        .brand-sub { display: block; font-size: 0.68rem; color: #64748b; font-weight: 600; }
        .nav-section-title { display: block; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; color: #475569; padding: 0 0.75rem 0.5rem; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 0.65rem 0.75rem; border-radius: 8px; color: #94a3b8; text-decoration: none; font-size: 0.88rem; font-weight: 500; transition: all 0.15s ease; margin-bottom: 4px; }
        .sidebar-link:hover { color: #ffffff; background: #1e293b; }
        .sidebar-link.active { color: #ffffff; background: #2563eb; }
        .app-main-content { flex: 1; padding: 2rem; overflow-y: auto; }
        @media (max-width: 768px) {
          .app-layout { flex-direction: column; }
          .app-sidebar { width: 100%; min-width: 100%; min-height: auto; }
        }
      `}</style>

      <div className="app-layout">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <div className="brand-badge">
              <IconLoja />
            </div>
            <div className="brand-text">
              <span className="brand-name">TECCO</span>
              <span className="brand-sub">PDV SISTEMA</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <span className="nav-section-title">MENU PRINCIPAL</span>
            {links.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/contas-receber" element={<ContasReceber />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
