import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Ícones SVG minimalistas nativos
const IconTrending = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
)

const IconOrders = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconProducts = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
)

const IconReceivables = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17V7" />
  </svg>
)

export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    totalVendas: 0,
    qtdVendas: 0,
    clientes: 0,
    produtos: 0,
    aReceber: 0
  })

  useEffect(() => {
    const carregarMetricas = async () => {
      const { data: vendas } = await supabase.from('vendas').select('total')
      const totalVendas = vendas?.reduce((acc, v) => acc + Number(v.total || 0), 0) || 0
      const qtdVendas = vendas?.length || 0

      const { count: countClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
      const { count: countProdutos } = await supabase.from('produtos').select('*', { count: 'exact', head: true })

      const { data: contas } = await supabase.from('contas_a_receber').select('valor, valor_pago, status')
      const aReceber = contas?.reduce((acc, c) => {
        if (c.status !== 'pago') {
          return acc + (Number(c.valor || 0) - Number(c.valor_pago || 0))
        }
        return acc
      }, 0) || 0

      setMetricas({
        totalVendas,
        qtdVendas,
        clientes: countClientes || 0,
        produtos: countProdutos || 0,
        aReceber
      })
    }

    carregarMetricas()
  }, [])

  return (
    <div className="dash-container">
      <style>{`
        .dash-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .dash-header {
          margin-bottom: 2rem;
        }
        .dash-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
        }
        .dash-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 4px;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.25rem;
        }
        .card-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        }
        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .card-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #64748b;
          text-transform: uppercase;
        }
        .card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-blue { background: #eff6ff; color: #2563eb; }
        .icon-purple { background: #f5f3ff; color: #7c3aed; }
        .icon-emerald { background: #ecfdf5; color: #059669; }
        .icon-slate { background: #f1f5f9; color: #475569; }
        .icon-orange { background: #fff7ed; color: #ea580c; }
        .card-number {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .card-footer {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .badge-live {
          color: #10b981;
          font-weight: 600;
        }
      `}</style>

      <div className="dash-header">
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-subtitle">Visão geral do seu caixa e movimentações em tempo real</p>
      </div>

      <div className="cards-grid">
        {/* Total de Vendas */}
        <div className="card-item">
          <div className="card-top">
            <span className="card-label">Total de Vendas</span>
            <div className="card-icon icon-blue">
              <IconTrending />
            </div>
          </div>
          <div className="card-number">
            R$ {metricas.totalVendas.toFixed(2)}
          </div>
          <div className="card-footer">
            <span className="badge-live">● Sincronizado</span>
          </div>
        </div>

        {/* Quantidade de Vendas */}
        <div className="card-item">
          <div className="card-top">
            <span className="card-label">Número de Vendas</span>
            <div className="card-icon icon-purple">
              <IconOrders />
            </div>
          </div>
          <div className="card-number">
            {metricas.qtdVendas}
          </div>
          <div className="card-footer">
            <span>pedidos concluídos</span>
          </div>
        </div>

        {/* Clientes Cadastrados */}
        <div className="card-item">
          <div className="card-top">
            <span className="card-label">Clientes Cadastrados</span>
            <div className="card-icon icon-emerald">
              <IconUsers />
            </div>
          </div>
          <div className="card-number">
            {metricas.clientes}
          </div>
          <div className="card-footer">
            <span>clientes na base</span>
          </div>
        </div>

        {/* Produtos Cadastrados */}
        <div className="card-item">
          <div className="card-top">
            <span className="card-label">Produtos no Catálogo</span>
            <div className="card-icon icon-slate">
              <IconProducts />
            </div>
          </div>
          <div className="card-number">
            {metricas.produtos}
          </div>
          <div className="card-footer">
            <span>itens registrados</span>
          </div>
        </div>

        {/* Saldo a Receber */}
        <div className="card-item">
          <div className="card-top">
            <span className="card-label">Saldo a Receber</span>
            <div className="card-icon icon-orange">
              <IconReceivables />
            </div>
          </div>
          <div className="card-number" style={{ color: '#ea580c' }}>
            R$ {metricas.aReceber.toFixed(2)}
          </div>
          <div className="card-footer">
            <span>vendas a prazo em aberto</span>
          </div>
        </div>
      </div>
    </div>
  )
}
