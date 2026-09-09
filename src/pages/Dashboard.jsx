import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import '../styles/pages.css'

// SVGs minimalistas para os cards
const IconTrending = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
)

const IconOrders = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconProducts = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
)

const IconReceivables = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="dashboard-wrapper">
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>Visão geral do seu caixa e movimentações em tempo real</p>
      </header>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">TOTAL DE VENDAS</span>
            <div className="kpi-icon blue"><IconTrending /></div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">R$ {metricas.totalVendas.toFixed(2)}</span>
            <span className="kpi-hint" style={{ color: '#16a34a', fontWeight: 600 }}>● Atualizado</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">NÚMERO DE VENDAS</span>
            <div className="kpi-icon gray"><IconOrders /></div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{metricas.qtdVendas}</span>
            <span className="kpi-hint">pedidos concluídos</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">CLIENTES CADASTRADOS</span>
            <div className="kpi-icon gray"><IconUsers /></div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{metricas.clientes}</span>
            <span className="kpi-hint">na base ativa</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">PRODUTOS NO CATÁLOGO</span>
            <div className="kpi-icon gray"><IconProducts /></div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{metricas.produtos}</span>
            <span className="kpi-hint">itens disponíveis</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">SALDO A RECEBER</span>
            <div className="kpi-icon orange"><IconReceivables /></div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value" style={{ color: '#ea580c' }}>R$ {metricas.aReceber.toFixed(2)}</span>
            <span className="kpi-hint">pendente de quitação</span>
          </div>
        </div>
      </section>
    </div>
  )
}
