import { useEffect, useState } from 'react'
import '../styles/pages.css'

export default function Dashboard() {
  const [dados, setDados] = useState({
    totalVendas: 0,
    quantidadeVendas: 0,
    clientesAtivos: 0,
    produtosAtivos: 0,
    aReceber: 0,
  })

  useEffect(() => {
    // Carregar dados do localStorage
    const vendas = JSON.parse(localStorage.getItem('pdv_vendas') || '[]')
    const clientes = JSON.parse(localStorage.getItem('pdv_clientes') || '[]')
    const produtos = JSON.parse(localStorage.getItem('pdv_produtos') || '[]')
    const contas = JSON.parse(localStorage.getItem('pdv_contas') || '[]')

    const totalVendas = vendas.reduce((sum, v) => sum + (v.total || 0), 0)
    const aReceber = contas.reduce((sum, c) => sum + (c.valor || 0), 0)

    setDados({
      totalVendas,
      quantidadeVendas: vendas.length,
      clientesAtivos: clientes.length,
      produtosAtivos: produtos.length,
      aReceber,
    })
  }, [])

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <p className="metric-label">Total de Vendas</p>
            <p className="metric-value">R$ {dados.totalVendas.toFixed(2)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🧾</div>
          <div className="metric-content">
            <p className="metric-label">Número de Vendas</p>
            <p className="metric-value">{dados.quantidadeVendas}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <p className="metric-label">Clientes Cadastrados</p>
            <p className="metric-value">{dados.clientesAtivos}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <p className="metric-label">Produtos Cadastrados</p>
            <p className="metric-value">{dados.produtosAtivos}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <p className="metric-label">A Receber</p>
            <p className="metric-value">R$ {dados.aReceber.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="welcome-section">
        <h2>Bem-vindo ao PDV Sistema!</h2>
        <p>Use o menu ao lado para começar a gerenciar suas vendas.</p>
      </div>
    </div>
  )
}
