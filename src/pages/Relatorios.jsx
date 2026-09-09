import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import '../styles/pages.css'

export default function Relatorios() {
  const [vendas, setVendas] = useState([])
  const [contas, setContas] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [filtroRapido, setFiltroRapido] = useState('todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [relatorio, setRelatorio] = useState({})

  // 1. Buscar dados do Supabase
  const carregarDados = async () => {
    setCarregando(true)

    const { data: vendasData, error: errVendas } = await supabase
      .from('vendas')
      .select('*, clientes(nome)')
      .order('created_at', { ascending: false })

    const { data: contasData, error: errContas } = await supabase
      .from('contas_a_receber')
      .select('*')

    if (errVendas) console.error('Erro ao carregar vendas:', errVendas)
    if (errContas) console.error('Erro ao carregar contas:', errContas)

    const listaVendas = vendasData || []
    const listaContas = contasData || []

    setVendas(listaVendas)
    setContas(listaContas)
    processarRelatorio(listaVendas, listaContas, 'todos', '', '')
    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // 2. Filtrar e calcular métricas
  const processarRelatorio = useCallback((todasVendas, todasContas, modo, inicio, fim) => {
    let filtradas = [...todasVendas]
    const agora = new Date()

    if (modo === 'hoje') {
      const hojeStr = agora.toISOString().split('T')[0]
      filtradas = todasVendas.filter(v => v.created_at && v.created_at.startsWith(hojeStr))
    } else if (modo === 'semana') {
      const seteDiasAtras = new Date(agora)
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
      filtradas = todasVendas.filter(v => new Date(v.created_at) >= seteDiasAtras)
    } else if (modo === 'mes') {
      const mesAtual = agora.getMonth()
      const anoAtual = agora.getFullYear()
      filtradas = todasVendas.filter(v => {
        const d = new Date(v.created_at)
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
      })
    } else if (modo === 'personalizado' && (inicio || fim)) {
      filtradas = todasVendas.filter(v => {
        const dataVenda = v.created_at ? v.created_at.split('T')[0] : ''
        if (inicio && fim) return dataVenda >= inicio && dataVenda <= fim
        if (inicio) return dataVenda >= inicio
        if (fim) return dataVenda <= fim
        return true
      })
    }

    // Cálculos de faturamento
    let faturamentoBruto = 0
    let custoTotal = 0
    const produtosMaisVendidos = {}
    const clientesMaisVendas = {}

    filtradas.forEach(venda => {
      const totalVenda = Number(venda.total) || 0
      faturamentoBruto += totalVenda

      // Itens da venda
      const itens = Array.isArray(venda.itens) ? venda.itens : []
      itens.forEach(item => {
        const qtd = Number(item.quantidade) || 0
        const custoUnit = Number(item.preco_custo) || 0
        custoTotal += custoUnit * qtd

        const nomeP = item.nomeProduto || 'Produto'
        produtosMaisVendidos[nomeP] = (produtosMaisVendidos[nomeP] || 0) + qtd
      })

      // Clientes
      const nomeCliente = venda.clientes?.nome || 'Cliente Avulso'
      if (!clientesMaisVendas[nomeCliente]) {
        clientesMaisVendas[nomeCliente] = { total: 0, quantidade: 0 }
      }
      clientesMaisVendas[nomeCliente].total += totalVenda
      clientesMaisVendas[nomeCliente].quantidade += 1
    })

    const faturamentoLiquido = faturamentoBruto - custoTotal
    const margemLiquida = faturamentoBruto > 0 ? (faturamentoLiquido / faturamentoBruto) * 100 : 0
    const quantidadeVendas = filtradas.length
    const ticketMedio = quantidadeVendas > 0 ? faturamentoBruto / quantidadeVendas : 0

    // Contas a receber pendentes
    const totalContasPendentes = todasContas
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + (Number(c.valor) || 0), 0)

    setRelatorio({
      faturamentoBruto,
      custoTotal,
      faturamentoLiquido,
      margemLiquida,
      quantidadeVendas,
      ticketMedio,
      totalContasPendentes,
      produtosMaisVendidos: Object.entries(produtosMaisVendidos).sort((a, b) => b[1] - a[1]).slice(0, 10),
      clientesMaisVendas: Object.entries(clientesMaisVendas).sort((a, b) => b[1].total - a[1].total).slice(0, 10)
    })
  }, [])

  // Troca de filtro rápido
  const aplicarFiltroRapido = (tipo) => {
    setFiltroRapido(tipo)
    setDataInicio('')
    setDataFim('')
    processarRelatorio(vendas, contas, tipo, '', '')
  }

  // Troca de datas manuais
  const aplicarFiltroDatas = (novaDataInicio, novaDataFim) => {
    setFiltroRapido('personalizado')
    processarRelatorio(vendas, contas, 'personalizado', novaDataInicio, novaDataFim)
  }

  return (
    <div>
      <h1 className="page-title">Relatório de Faturamento</h1>

      {/* Botões de Filtros Rápidos */}
      <div className="filter-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${filtroRapido === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => aplicarFiltroRapido('todos')}
        >
          Todos os períodos
        </button>
        <button
          className={`btn ${filtroRapido === 'mes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => aplicarFiltroRapido('mes')}
        >
          Este mês
        </button>
        <button
          className={`btn ${filtroRapido === 'semana' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => aplicarFiltroRapido('semana')}
        >
          Última semana
        </button>
        <button
          className={`btn ${filtroRapido === 'hoje' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => aplicarFiltroRapido('hoje')}
        >
          Hoje
        </button>
      </div>

      {/* Filtro por Intervalo de Datas */}
      <div className="form-container" style={{ marginBottom: '24px' }}>
        <div className="form-section">
          <h2>Filtrar por Período Específico</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Data Inicial</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value)
                  aplicarFiltroDatas(e.target.value, dataFim)
                }}
              />
            </div>
            <div className="form-group">
              <label>Data Final</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => {
                  setDataFim(e.target.value)
                  aplicarFiltroDatas(dataInicio, e.target.value)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {carregando ? (
        <p>Carregando dados do Supabase...</p>
      ) : (
        <>
          {/* Grid de Métricas Financeiras */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <p className="metric-label">Faturamento Bruto</p>
                <p className="metric-value">
                  R$ {(relatorio.faturamentoBruto || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">📦</div>
              <div className="metric-content">
                <p className="metric-label">Custo dos Produtos</p>
                <p className="metric-value" style={{ color: '#ef4444' }}>
                  R$ {(relatorio.custoTotal || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="metric-icon">📈</div>
              <div className="metric-content">
                <p className="metric-label">Faturamento Líquido</p>
                <p className="metric-value" style={{ color: '#10b981' }}>
                  R$ {(relatorio.faturamentoLiquido || 0).toFixed(2)}
                </p>
                <small style={{ color: '#6b7280' }}>
                  Margem: {(relatorio.margemLiquida || 0).toFixed(1)}%
                </small>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🧾</div>
              <div className="metric-content">
                <p className="metric-label">Qtd. de Vendas</p>
                <p className="metric-value">{relatorio.quantidadeVendas || 0}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">💳</div>
              <div className="metric-content">
                <p className="metric-label">Ticket Médio</p>
                <p className="metric-value">
                  R$ {(relatorio.ticketMedio || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">⏳</div>
              <div className="metric-content">
                <p className="metric-label">Contas a Receber</p>
                <p className="metric-value">
                  R$ {(relatorio.totalContasPendentes || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Top 10 Produtos Mais Vendidos */}
          {relatorio.produtosMaisVendidos && relatorio.produtosMaisVendidos.length > 0 && (
            <div className="table-container">
              <h2>Top Produtos Vendidos no Período</h2>
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade Vendida</th>
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

          {/* Top 10 Clientes */}
          {relatorio.clientesMaisVendas && relatorio.clientesMaisVendas.length > 0 && (
            <div className="table-container">
              <h2>Top Clientes no Período</h2>
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Qtd. Compras</th>
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
              <p>Nenhuma venda registrada ainda no sistema.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
