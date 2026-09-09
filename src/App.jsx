import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Vendas from './pages/Vendas'
import Clientes from './pages/Clientes'
import Produtos from './pages/Produtos'
import ContasReceber from './pages/ContasReceber'
import Relatorios from './pages/Relatorios'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  Receipt, 
  BarChart3,
  Store 
} from 'lucide-react'
import './styles/App.css'
import './styles/pages.css'

export default function App() {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/vendas', label: 'Vendas', icon: ShoppingCart },
    { to: '/clientes', label: 'Clientes', icon: Users },
    { to: '/produtos', label: 'Produtos', icon: Package },
    { to: '/contas-receber', label: 'Contas a Receber', icon: Receipt },
    { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  ]

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Menu Lateral Minimalista Moderno */}
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <div className="brand-badge">
              <Store size={18} />
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
                  <Icon size={18} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>

        {/* Conteúdo Principal da Aplicação */}
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
