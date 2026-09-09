import { useState, useEffect } from 'react'
import '../styles/pages.css'

export default function Relatorios() {
  const [vendas, setVendas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [contas, setContas] = useState([])
  
  const [filtroData, setFiltroData] = useState('todos') // todos, hoje, semana, mes
  const [relatorio, setRelatorio] = useState({})

  useEffect(() => {
    const vendas = JSON.parse(localStorage.getItem('pdv_vendas') || '[]')
    const produtos = JSON.parse(localStorage.getItem('pdv_produtos') || '[]')
    const clientes = JSON.parse(localStorage.getItem('pdv_clientes') || '[]')
    const contas = JSON.parse(localStorage.getItem('pdv_contas') || '[]')

    setVendas(vendas)
    setProdutos(produtos)
    setClientes(clientes)
    setContas(contas)

    gerarRelatorio(vendas, produtos, clientes, contas, 'todos')
  }, [])

  const gerarRelatorio = (vendas, produtos, clientes, contas, filtro) => {
    let vendasFiltradas = vendas

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    if (filtro === 'hoje') {
      vendasFiltradas = vendas.filter(v => {
        const dataVenda = new Date(v.data.split(' ')[0].split('/').reverse().join('-'))
        return dataVenda.getTime() === hoje.getTime()
      })
    } else if (filtro === 'semana') {
      const semanaAtras = new Date(hoje)
      semanaAtras.setDate(semanaAtras.getDate() - 7)
      vendasFiltradas = vendas.filter(v => {
        const dataVenda = new Date(v.data.split(' ')[0].split('/').reverse().join('-'))
        return dataVenda >= semanaAtras
      })
    } else if (filtro === 'mes') {
      vendasFiltradas = vendas.filter(v => {
        const dataVenda = new Date(v.data.split(' ')[0].split('/').reverse().join('-'))
        return dataVenda.getMonth() === hoje.getMonth() && dataVenda.getFullYear() === hoje.getFullYear()
      })
    }

    const totalVendas = vendasFiltradas.reduce((sum, v) => sum + v.total, 0)
    const quantidadeVendas = vendasFiltradas.length
    const totalPago = vendasFiltradas.filter(v => v.status === 'pago').reduce((sum, v) => sum + v.total, 0)
    const totalPendente = vendasFiltradas.filter(v => v.status === 'pendente').reduce((sum, v) => sum + v.total, 0)

    // Produtos mais vendidos
    const produtosMaisVendidos = {}
    vendasFiltradas.forEach(venda => {
      venda.itens.forEach(item => {
        produtosMaisVendidos[item.nomeProduto] = (produtosMaisVendidos[item.nomeProduto] || 0) + item.quantidade
      })
    })

    // Clientes que mais compraram
    const clientesMaisVendas = {}
    vendasFiltradas.forEach(venda => {
      const cliente = venda.cliente
      if (!clientesMaisVendas[cliente]) {
        clientesMaisVendas[cliente] = { total: 0, quantidade: 0 }
      }
      clientesMaisVendas[cliente].total += venda.total
      clientesMaisVendas[cliente].quantidade++
    })

    setRelatorio({
      totalVendas,
      quantidadeVendas,
      totalPago,
      totalPendente,
      produtosMaisVendidos: Object.entries(produtosMaisVendidos).sort((a, b) => b[1] - a[1]).slice(0, 10),
      clientesMaisVendas: Object.entries(clientesMaisVendas).sort((a, b) => b[1].total - a[1].total).slice(0, 10),
      ticketMedio: quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0,
      contas: contas
    })
  }

  const handleFiltro = (filtro) => {
    setFiltroData(filtro)
    gerarRelatorio(vendas, produtos, clientes, contas, filtro)
  }

  return (
    <div>
      <h1 className="page-title">Relatórios</h1>

      <div className="filter-buttons">
        <button 
          className={`btn ${filtroData === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleFiltro('todos')}
        >
          Todos os períodos
        </button>
        <button 
          className={`btn ${filtroData === 'mes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleFiltro('mes')}
        >
          Este mês
        </button>
        <button 
          className={`btn ${filtroData === 'semana' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleFiltro('semana')}
        >
          Última semana
        </button>
        <button 
          className={`btn ${filtroData === 'hoje' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleFiltro('hoje')}
        >
          Hoje
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <p className="metric-label">Total de Vendas</p>
            <p className="metric-value">R$ {relatorio.totalVendas?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🧾</div>
          <div className="metric-content">
            <p className="metric-label">Quantidade de Vendas</p>
            <p className="metric-value">{relatorio.quantidadeVendas || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💳</div>
          <div className="metric-content">
            <p className="metric-label">Ticket Médio</p>
            <p className="metric-value">R$ {relatorio.ticketMedio?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <p className="metric-label">Total Pago</p>
            <p className="metric-value">R$ {relatorio.totalPago?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <p className="metric-label">Total Pendente</p>
            <p className="metric-value">R$ {relatorio.totalPendente?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <p className="metric-label">Contas a Receber</p>
            <p className="metric-value">R$ {relatorio.contas?.reduce((sum, c) => sum + (c.pago ? 0 : c.valor), 0).toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>

      {relatorio.produtosMaisVendidos && relatorio.produtosMaisVendidos.length > 0 && (
        <div className="table-container">
          <h2>Top 10 Produtos Mais Vendidos</h2>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.produtosMaisVendidos.map(([nome, quantidade], idx) => (
                <tr key={idx}>
                  <td>{nome}</td>
                  <td>
                    <span className="badge badge-success">
                      {quantidade} un{quantidade > 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {relatorio.clientesMaisVendas && relatorio.clientesMaisVendas.length > 0 && (
        <div className="table-container">
          <h2>Top 10 Clientes</h2>
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Compras</th>
                <th>Total Gasto</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.clientesMaisVendas.map(([nome, dados], idx) => (
                <tr key={idx}>
                  <td>{nome}</td>
                  <td>{dados.quantidade}</td>
                  <td>R$ {dados.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vendas.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma venda registrada ainda</p>
        </div>
      )}
    </div>
  )
}
