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

const IconReceipt = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17V7" />
  </svg>
)

export default function HistoricoVendas() {
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes') // 'hoje', 'mes', 'todas'

  const carregarVendas = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('vendas')
        .select('*, clientes(nome, telefone, saldo_cashback)')
        .order('created_at', { ascending: false })

      if (filtroPeriodo === 'hoje') {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        query = query.gte('created_at', hoje.toISOString())
      } else if (filtroPeriodo === 'mes') {
        const trintaDiasAtras = new Date()
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
        query = query.gte('created_at', trintaDiasAtras.toISOString())
      }

      const { data, error } = await query
      if (error) throw error
      if (data) setVendas(data)
    } catch (err) {
      alert('Erro ao carregar histórico: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarVendas()
  }, [filtroPeriodo])

  const enviarWhatsApp = (venda) => {
    const tel = venda.clientes?.telefone
    if (!tel) return alert('Este cliente não possui telefone cadastrado!')

    const numLimpo = tel.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo
    const codFormatado = formatarIdVenda(venda.id)
    const nome = venda.clientes?.nome || 'Cliente'

    const mensagem = encodeURIComponent(
      `Olá, ${nome}!\n` +
      `Aqui está o resumo da sua compra no *${DADOS_EMPRESA.nome}*:\n\n` +
      `Pedido: *${codFormatado}*\n` +
      `Total: *R$ ${Number(venda.total).toFixed(2)}*\n` +
      `Pagamento: *${(venda.forma_pagamento || '').toUpperCase()}*\n\n` +
      `Agradecemos pela preferência!`
    )

    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${mensagem}`, '_blank')
  }

  const vendasFiltradas = vendas.filter(v => {
    if (!busca.trim()) return true
    const termo = busca.toLowerCase()
    const cod = formatarIdVenda(v.id).toLowerCase()
    const nome = (v.clientes?.nome || '').toLowerCase()
    const tel = (v.clientes?.telefone || '').toLowerCase()
    return cod.includes(termo) || nome.includes(termo) || tel.includes(termo)
  })

  const totalPeriodo = vendasFiltradas.reduce((s, v) => s + Number(v.total || 0), 0)

  return (
    <div className="hv-wrapper">
      <style>{`
        .hv-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; }
        .hv-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .hv-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .hv-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
        .summary-card { background: #ffffff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 0.85rem 1.25rem; display: flex; flex-direction: column; min-width: 220px; }
        .summary-card span { font-size: 0.7rem; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; }
        .summary-card strong { font-size: 1.45rem; font-weight: 800; color: #1e40af; letter-spacing: -0.02em; }
        
        .controls-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .filter-bar { display: flex; gap: 8px; }
        .filter-btn { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; color: #64748b; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
        .filter-btn.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }
        
        .search-box { display: flex; align-items: center; gap: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0 12px; height: 40px; width: 320px; }
        .search-box input { border: none; outline: none; width: 100%; font-size: 0.88rem; color: #0f172a; background: transparent; }
        
        .table-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.02); width: 100%; }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 800px; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1.25rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        td { padding: 1rem 1.25rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; white-space: nowrap; }
        tbody tr:hover { background: #f8fafc; }
        .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-info { background: #e0f2fe; color: #0369a1; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .btn-action { display: inline-flex; align-items: center; gap: 4px; padding: 0.45rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; background: #2563eb; color: #ffffff; }
        .btn-action:hover { background: #1d4ed8; }
        .btn-sec { background: #f1f5f9; color: #475569; }
        .btn-sec:hover { background: #e2e8f0; color: #0f172a; }
        .btn-zap { background: #dcfce7; color: #15803d; }
        .btn-zap:hover { background: #bbf7d0; }

        @media (max-width: 768px) {
          .hv-header { flex-direction: column; align-items: stretch; }
          .summary-card { width: 100%; }
          .controls-row { flex-direction: column; align-items: stretch; }
          .search-box { width: 100%; }
        }
      `}</style>

      <div className="hv-header">
        <div>
          <h1 className="hv-title">Histórico de Vendas</h1>
          <p className="hv-subtitle">Consulte pedidos passados, reimprima comprovantes e reenvie no WhatsApp</p>
        </div>

        <div className="summary-card">
          <span>Faturamento Filtrado</span>
          <strong>R$ {totalPeriodo.toFixed(2)}</strong>
        </div>
      </div>

      <div className="controls-row">
        <div className="filter-bar">
          <button 
            className={`filter-btn ${filtroPeriodo === 'hoje' ? 'active' : ''}`}
            onClick={() => setFiltroPeriodo('hoje')}
          >
            Hoje
          </button>
          <button 
            className={`filter-btn ${filtroPeriodo === 'mes' ? 'active' : ''}`}
            onClick={() => setFiltroPeriodo('mes')}
          >
            Últimos 30 Dias
          </button>
          <button 
            className={`filter-btn ${filtroPeriodo === 'todas' ? 'active' : ''}`}
            onClick={() => setFiltroPeriodo('todas')}
          >
            Todas
          </button>
        </div>

        <div className="search-box">
          <IconSearch />
          <input 
            type="text" 
            placeholder="Buscar por ID, cliente ou telefone..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {busca && (
            <button 
              onClick={() => setBusca('')} 
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="table-box">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Carregando histórico...</p>
        ) : vendasFiltradas.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Nenhuma venda encontrada no período.</p>
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
                const temTelefone = Boolean(venda.clientes?.telefone)

                return (
                  <tr key={venda.id}>
                    <td><strong>#{cod}</strong></td>
                    <td>{new Date(venda.created_at).toLocaleString('pt-BR')}</td>
                    <td>
                      <div>{venda.clientes?.nome || 'Cliente Avulso'}</div>
                      {temTelefone && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{venda.clientes.telefone}</span>}
                    </td>
                    <td><strong>R$ {Number(venda.total).toFixed(2)}</strong></td>
                    <td>
                      <span className={`badge ${isCrediario ? 'badge-warning' : 'badge-info'}`}>
                        {isCrediario ? 'CREDIÁRIO' : venda.forma_pagamento?.toUpperCase()}
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
