import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { gerarComprovanteVenda, formatarIdVenda, DADOS_EMPRESA } from '../utils/pdfGenerator'

// Ícones SVG minimalistas nativos
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)

const IconFileText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
  </svg>
)

const IconWhatsApp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

export default function HistoricoVendas() {
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [busca, setBusca] = useState('')
  const [atalhoPeriodo, setAtalhoPeriodo] = useState('mes') // 'hoje', '7dias', 'mes', 'custom'
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroPagamento, setFiltroPagamento] = useState('todos')

  // Aplica as datas conforme o atalho escolhido
  useEffect(() => {
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]

    if (atalhoPeriodo === 'hoje') {
      setDataInicio(hojeStr)
      setDataFim(hojeStr)
    } else if (atalhoPeriodo === '7dias') {
      const seteAtras = new Date()
      seteAtras.setDate(seteAtras.getDate() - 7)
      setDataInicio(seteAtras.toISOString().split('T')[0])
      setDataFim(hojeStr)
    } else if (atalhoPeriodo === 'mes') {
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      setDataInicio(primeiroDiaMes.toISOString().split('T')[0])
      setDataFim(hojeStr)
    }
  }, [atalhoPeriodo])

  const carregarVendas = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('vendas')
        .select('*, clientes(nome, telefone, saldo_cashback)')
        .order('created_at', { ascending: false })

      // Filtro de Data no Supabase
      if (dataInicio) {
        const dIni = new Date(`${dataInicio}T00:00:00`)
        query = query.gte('created_at', dIni.toISOString())
      }
      if (dataFim) {
        const dFim = new Date(`${dataFim}T23:59:59`)
        query = query.lte('created_at', dFim.toISOString())
      }

      // Filtro de Forma de Pagamento no Supabase
      if (filtroPagamento !== 'todos') {
        query = query.eq('forma_pagamento', filtroPagamento)
      }

      const { data, error } = await query
      if (error) throw error
      if (data) setVendas(data)
    } catch (err) {
      alert('Erro ao carregar histórico: ' + err.message)
    }
    setLoading(false)
  }

  // Recarrega sempre que mudar as datas ou a forma de pagamento
  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarVendas()
    }
  }, [dataInicio, dataFim, filtroPagamento])

  const enviarWhatsApp = (venda) => {
    const tel = venda.clientes?.telefone
    if (!tel) return alert('Este cliente não possui telefone cadastrado!')

    const numLimpo = tel.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo
    const codFormatado = formatarIdVenda(venda.id)
    const nome = venda.clientes?.nome || 'Cliente'

    const mensagem = encodeURIComponent(
      `Olá, ${nome}!\n` +
      `Aqui está o comprovante da sua compra no *${DADOS_EMPRESA.nome}*:\n\n` +
      `Pedido: *#${codFormatado}*\n` +
      `Total: *R$ ${Number(venda.total).toFixed(2)}*\n` +
      `Forma de Pagto: *${(venda.forma_pagamento || '').toUpperCase()}*\n\n` +
      `Agradecemos pela preferência!`
    )

    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${mensagem}`, '_blank')
  }

  // Filtro em memória pelo campo de busca livre (código, nome, telefone)
  const vendasFiltradas = vendas.filter(v => {
    if (!busca.trim()) return true
    const termo = busca.toLowerCase()
    const cod = formatarIdVenda(v.id).toLowerCase()
    const nome = (v.clientes?.nome || '').toLowerCase()
    const tel = (v.clientes?.telefone || '').toLowerCase()
    return cod.includes(termo) || nome.includes(termo) || tel.includes(termo)
  })

  // Estatísticas calculadas na hora com base no filtro atual
  const totalFaturado = vendasFiltradas.reduce((s, v) => s + Number(v.total || 0), 0)
  const qtdPedidos = vendasFiltradas.length
  const ticketMedio = qtdPedidos > 0 ? (totalFaturado / qtdPedidos) : 0

  return (
    <div className="hv-wrapper">
      <style>{`
        .hv-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; }
        .hv-header { margin-bottom: 1.5rem; }
        .hv-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .hv-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }

        /* Cards de Métricas do Filtro */
        .kpi-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .kpi-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.1rem 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .kpi-card-title { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; }
        .kpi-card-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 4px; display: block; }
        
        /* Bloco de Filtros */
        .filter-container { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .filter-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .atalhos-periodo { display: flex; gap: 6px; }
        .btn-periodo { padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
        .btn-periodo.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }

        .filter-inputs-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .input-group { display: flex; flex-direction: column; }
        .input-group label { font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
        .input-date, .select-pagto { height: 38px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; color: #0f172a; background: #ffffff; }

        .search-box { display: flex; align-items: center; gap: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; height: 38px; width: 280px; }
        .search-box input { border: none; outline: none; width: 100%; font-size: 0.85rem; color: #0f172a; background: transparent; }
        
        /* Tabela */
        .table-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.02); width: 100%; }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 820px; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1.25rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        td { padding: 1rem 1.25rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; white-space: nowrap; }
        tbody tr:hover { background: #f8fafc; }
        
        .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-info { background: #e0f2fe; color: #0369a1; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .badge-success { background: #dcfce7; color: #15803d; }
        
        .btn-action { display: inline-flex; align-items: center; gap: 4px; padding: 0.45rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; background: #2563eb; color: #ffffff; }
        .btn-action:hover { background: #1d4ed8; }
        .btn-sec { background: #f1f5f9; color: #475569; }
        .btn-sec:hover { background: #e2e8f0; color: #0f172a; }
        .btn-zap { background: #dcfce7; color: #15803d; }
        .btn-zap:hover { background: #bbf7d0; }

        @media (max-width: 768px) {
          .kpi-cards-grid { grid-template-columns: 1fr; gap: 0.75rem; }
          .filter-inputs-row { flex-direction: column; align-items: stretch; }
          .search-box { width: 100%; }
        }
      `}</style>

      <div className="hv-header">
        <h1 className="hv-title">Vendas Realizadas</h1>
        <p className="hv-subtitle">Histórico consolidado com busca por cliente, período e forma de pagamento</p>
      </div>

      {/* Cards de Métricas em Tempo Real */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <span className="kpi-card-title">Faturamento no Período</span>
          <span className="kpi-card-value" style={{ color: '#2563eb' }}>R$ {totalFaturado.toFixed(2)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-card-title">Volume de Pedidos</span>
          <span className="kpi-card-value">{qtdPedidos} vendas</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-card-title">Ticket Médio</span>
          <span className="kpi-card-value" style={{ color: '#059669' }}>R$ {ticketMedio.toFixed(2)}</span>
        </div>
      </div>

      {/* Bloco Avançado de Filtros */}
      <div className="filter-container">
        <div className="filter-row">
          <div className="atalhos-periodo">
            <button 
              className={`btn-periodo ${atalhoPeriodo === 'hoje' ? 'active' : ''}`}
              onClick={() => setAtalhoPeriodo('hoje')}
            >
              Hoje
            </button>
            <button 
              className={`btn-periodo ${atalhoPeriodo === '7dias' ? 'active' : ''}`}
              onClick={() => setAtalhoPeriodo('7dias')}
            >
              Últimos 7 dias
            </button>
            <button 
              className={`btn-periodo ${atalhoPeriodo === 'mes' ? 'active' : ''}`}
              onClick={() => setAtalhoPeriodo('mes')}
            >
              Mês Atual
            </button>
            <button 
              className={`btn-periodo ${atalhoPeriodo === 'custom' ? 'active' : ''}`}
              onClick={() => setAtalhoPeriodo('custom')}
            >
              Personalizado
            </button>
          </div>

          <div className="search-box">
            <IconSearch />
            <input 
              type="text" 
              placeholder="Buscar código, cliente ou WhatsApp..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca && (
              <button 
                onClick={() => setBusca('')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '13px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Linha de seleção de datas e forma de pagamento */}
        <div className="filter-inputs-row">
          <div className="input-group">
            <label>Data Início</label>
            <input 
              type="date" 
              className="input-date"
              value={dataInicio} 
              onChange={e => { setDataInicio(e.target.value); setAtalhoPeriodo('custom'); }} 
            />
          </div>

          <div className="input-group">
            <label>Data Fim</label>
            <input 
              type="date" 
              className="input-date"
              value={dataFim} 
              onChange={e => { setDataFim(e.target.value); setAtalhoPeriodo('custom'); }} 
            />
          </div>

          <div className="input-group" style={{ minWidth: '180px' }}>
            <label>Forma de Pagamento</label>
            <select 
              className="select-pagto"
              value={filtroPagamento} 
              onChange={e => setFiltroPagamento(e.target.value)}
            >
              <option value="todos">Todas as Formas</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="debito">Cartão de Débito</option>
              <option value="credito">Cartão de Crédito</option>
              <option value="crediario">Crediário (A Prazo)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela do Histórico */}
      <div className="table-box">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Carregando dados das vendas...</p>
        ) : vendasFiltradas.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Nenhuma venda encontrada com os filtros selecionados.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código ID</th>
                <th>Data & Hora</th>
                <th>Cliente</th>
                <th>Total Pago</th>
                <th>Forma de Pagto</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vendasFiltradas.map(venda => {
                const cod = formatarIdVenda(venda.id)
                const isCrediario = venda.forma_pagamento === 'crediario'
                const isPix = venda.forma_pagamento === 'pix'
                const temTelefone = Boolean(venda.clientes?.telefone)

                let badgeClass = 'badge-info'
                if (isCrediario) badgeClass = 'badge-warning'
                else if (isPix) badgeClass = 'badge-success'

                return (
                  <tr key={venda.id}>
                    <td><strong>#{cod}</strong></td>
                    <td>{new Date(venda.created_at).toLocaleString('pt-BR')}</td>
                    <td>
                      <div><strong>{venda.clientes?.nome || 'Cliente Avulso'}</strong></div>
                      {temTelefone && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{venda.clientes.telefone}</span>}
                    </td>
                    <td><strong>R$ {Number(venda.total).toFixed(2)}</strong></td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {venda.forma_pagamento?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          className="btn-action btn-sec" 
                          onClick={() => gerarComprovanteVenda(venda)}
                          title="Abrir comprovante em nova aba"
                        >
                          <IconFileText /> PDF
                        </button>
                        {temTelefone && (
                          <button 
                            className="btn-action btn-zap" 
                            onClick={() => enviarWhatsApp(venda)}
                            title="Reenviar pelo WhatsApp"
                          >
                            <IconWhatsApp /> Zap
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
