import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import '../styles/pages.css'

export default function Dashboard() {
  const [dados, setDados] = useState({
    totalVendas: 0,
    quantidadeVendas: 0,
    clientesAtivos: 0,
    produtosAtivos: 0,
    aReceber: 0,
  })
  const [carregando, setCarregando] = useState(true)

  const carregarIndicadores = async () => {
    setCarregando(true)

    try {
      // 1. Buscar vendas
      const { data: vendas, error: erroVendas } = await supabase
        .from('vendas')
        .select('total')

      // 2. Buscar clientes
      const { count: qtdClientes, error: erroClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      // 3. Buscar produtos
      const { count: qtdProdutos, error: erroProdutos } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })

      // 4. Buscar contas a receber
      const { data: contas, error: erroContas } = await supabase
        .from('contas_a_receber')
        .select('valor, valor_pago, status')

      if (erroVendas) console.error('Erro vendas:', erroVendas)
      if (erroClientes) console.error('Erro clientes:', erroClientes)
      if (erroProdutos) console.error('Erro produtos:', erroProdutos)
      if (erroContas) console.error('Erro contas:', erroContas)

      // Total financeiro de vendas
      const totalVendas = (vendas || []).reduce((sum, v) => sum + (Number(v.total) || 0), 0)

      // Saldo devedor pendente em aberto (valor - valor_pago)
      const saldoAReceber = (contas || []).reduce((sum, c) => {
        if (c.status === 'pago') return sum
        const total = Number(c.valor) || 0
        const pago = Number(c.valor_pago) || 0
        return sum + Math.max(0, total - pago)
      }, 0)

      setDados({
        totalVendas,
        quantidadeVendas: (vendas || []).length,
        clientesAtivos: qtdClientes || 0,
        produtosAtivos: qtdProdutos || 0,
        aReceber: saldoAReceber,
      })
    } catch (err) {
      console.error('Falha geral ao buscar métricas:', err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarIndicadores()
  }, [])

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      {carregando ? (
        <p>Atualizando indicadores em tempo real...</p>
      ) : (
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
              <p className="metric-value" style={{ color: '#ef4444' }}>
                R$ {dados.aReceber.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="welcome-section">
        <h2>Bem-vindo ao PDV Sistema!</h2>
        <p>Seus dados agora estão integrados à nuvem em tempo real.</p>
      </div>
    </div>
  )
}
