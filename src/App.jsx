import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Vendas from './pages/Vendas'
import Clientes from './pages/Clientes'
import Produtos from './pages/Produtos'
import ContasReceber from './pages/ContasReceber'
import Relatorios from './pages/Relatorios'
import './styles/app.css'

export default function App() {
  return (
    <Router>
      <div className="app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">
            <h1>PDV</h1>
            <p>Sistema</p>
          </div>
          
          <nav className="menu">
            <Link to="/" className="menu-item">
              <span>📊</span> Dashboard
            </Link>
            <Link to="/vendas" className="menu-item">
              <span>💰</span> Vendas
            </Link>
            <Link to="/clientes" className="menu-item">
              <span>👥</span> Clientes
            </Link>
            <Link to="/produtos" className="menu-item">
              <span>📦</span> Produtos
            </Link>
            <Link to="/contas-receber" className="menu-item">
              <span>📋</span> Contas a Receber
            </Link>
            <Link to="/relatorios" className="menu-item">
              <span>📈</span> Relatórios
            </Link>
          </nav>

          <div className="sidebar-footer">
            <p>v1.0.0</p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
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
    </Router>
  )
}
