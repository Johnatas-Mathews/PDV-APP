import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { gerarComprovanteVenda, gerarTextoCupomWhatsApp, formatarIdVenda } from '../utils/pdfGenerator'
import { useAuth } from '../context/AuthContext'

// Ícones SVG minimalistas
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)

const IconReceipt = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17V7" />
  </svg>
)

const IconWhatsApp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

const formatarDataInput = (data) => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export default function HistoricoVendas() {
  const { isAdmin } = useAuth()
  const [vendas, setVendas] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroPagto, setFiltroPagto] = useState('todos')

  // Filtros de Data / Período
  const [periodoData, setPeriodoData] = useState('todos') // 'hoje', '7dias', 'mes', 'todos', 'custom'
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return formatarDataInput(d)
  })
  const [dataFim, setDataFim] = useState(() => formatarDataInput(new Date()))

  // Modal de Edição de Venda
  const [modalEditAberto, setModalEditAberto] = useState(false)
  const [vendaEditando, setVendaEditando] = useState(null)
  const [novoClienteId, setNovoClienteId] = useState('')
  const [novaFormaPagto, setNovaFormaPagto] = useState('dinheiro')
  const [novoTotal, setNovoTotal] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const carregarVendas = async () => {
    setLoading(true)
    try {
      const { data: vData, error } = await supabase
        .from('vendas')
        .select('*, clientes(id, nome, telefone, saldo_cashback)')
        .order('id', { ascending: false })

      const { data: cData } = await supabase.from('clientes').select('id, nome, telefone').order('nome')

      if (error) throw error
      if (vData) setVendas(vData)
      if (cData) setClientes(cData)
    } catch (err) {
      alert('Erro ao carregar vendas: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarVendas()
  }, [])

  const abrirEdicaoVenda = (venda) => {
    setVendaEditando(venda)
    setNovoClienteId(venda.cliente_id ? String(venda.cliente_id) : '')
    setNovaFormaPagto(venda.forma_pagamento || 'dinheiro')
    setNovoTotal(String(Number(venda.total || 0).toFixed(2)))
    setModalEditAberto(true)
  }

  const salvarEdicaoVenda = async (e) => {
    e.preventDefault()
    if (!vendaEditando) return

    const totalNum = parseFloat(String(novoTotal).replace(',', '.')) || 0
    if (totalNum <= 0) return alert('Informe um valor de venda válido.')
    if (novaFormaPagto === 'crediario' && !novoClienteId) {
      return alert('Para venda em Crediário, é obrigatório selecionar o cliente!')
    }

    setSalvandoEdicao(true)
    try {
      const clienteIdFinal = novoClienteId ? parseInt(novoClienteId) : null

      const { error: erroUpdate } = await supabase
        .from('vendas')
        .update({
          total: totalNum,
          forma_pagamento: novaFormaPagto,
          cliente_id: clienteIdFinal
        })
        .eq('id', vendaEditando.id)

      if (erroUpdate) throw erroUpdate

      const { data: contaExistente } = await supabase
        .from('contas_a_receber')
        .select('*')
        .ilike('descricao', `%Venda #${vendaEditando.id}%`)
        .maybeSingle()

      if (novaFormaPagto === 'crediario') {
        const clienteObj = clientes.find(c => c.id === clienteIdFinal)
        const descCompleta = `Venda #${vendaEditando.id} - ${clienteObj?.nome || 'Cliente'}`

        if (contaExistente) {
          await supabase.from('contas_a_receber').update({
            valor: totalNum,
            cliente_id: clienteIdFinal,
            descricao: descCompleta
          }).eq('id', contaExistente.id)
        } else {
          const dataVenc = new Date()
          dataVenc.setDate(dataVenc.getDate() + 30)

          await supabase.from('contas_a_receber').insert([{
            descricao: descCompleta,
            valor: totalNum,
            valor_pago: 0,
            vencimento: dataVenc.toISOString().split('T')[0],
            status: 'pendente',
            cliente_id: clienteIdFinal
          }])
        }
      } else {
        if (contaExistente) {
          await supabase.from('contas_a_receber').delete().eq('id', contaExistente.id)
        }
      }

      alert('Venda atualizada com sucesso!')
      setModalEditAberto(false)
      setVendaEditando(null)
      await carregarVendas()
    } catch (err) {
      alert('Erro ao atualizar venda: ' + err.message)
    }
    setSalvandoEdicao(false)
  }

  const excluirVenda = async (venda) => {
    const cod = formatarIdVenda(venda.id)
    if (!confirm(`Deseja realmente CANCELAR e estornar a venda #${cod}?\nAs peças serão devolvidas automaticamente ao estoque!`)) {
      return
    }

    try {
      const itens = Array.isArray(venda.itens) ? venda.itens : []
      for (const item of itens) {
        if (item.variacaoId) {
          const { data: vVar } = await supabase.from('variacoes_grade').select('estoque').eq('id', item.variacaoId).single()
          if (vVar) {
            await supabase.from('variacoes_grade').update({ estoque: (vVar.estoque || 0) + item.quantidade }).eq('id', item.variacaoId)
          }
        }
        if (item.produtoId) {
          const { data: pProd } = await supabase.from('produtos').select('estoque').eq('id', item.produtoId).single()
          if (pProd) {
            await supabase.from('produtos').update({ estoque: (pProd.estoque || 0) + item.quantidade }).eq('id', item.produtoId)
          }
        }
      }

      await supabase.from('contas_a_receber').delete().ilike('descricao', `%Venda #${venda.id}%`)

      const { error } = await supabase.from('vendas').delete().eq('id', venda.id)
      if (error) throw error

      alert(`Venda #${cod} cancelada com sucesso e estoque estornado!`)
      await carregarVendas()
    } catch (err) {
      alert('Erro ao cancelar venda: ' + err.message)
    }
  }

  const enviarWhatsApp = (venda) => {
    if (!venda.clientes?.telefone) return alert('Cliente sem telefone cadastrado!')
    const numLimpo = venda.clientes.telefone.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo
    const textoCupom = gerarTextoCupomWhatsApp(venda)
    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${encodeURIComponent(textoCupom)}`, '_blank')
  }

  // Filtragem completa: Busca textual + Forma de Pagamento + Data (Fuso Brasil)
  const vendasFiltradas = vendas.filter(v => {
    const cod = formatarIdVenda(v.id)
    const nomeCli = (v.clientes?.nome || '').toLowerCase()
    const telCli = (v.clientes?.telefone || '')
    const t = busca.toLowerCase()
    const bateTexto = cod.includes(t) || nomeCli.includes(t) || telCli.includes(t)

    const batePagto = filtroPagto === 'todos' || v.forma_pagamento === filtroPagto

    // Filtro por Data
    let bateData = true
    if (periodoData !== 'todos') {
      const dt = new Date(v.created_at)
      const agora = new Date()

      if (periodoData === 'hoje') {
        bateData = dt.getDate() === agora.getDate() && dt.getMonth() === agora.getMonth() && dt.getFullYear() === agora.getFullYear()
      } else if (periodoData === '7dias') {
        const seteDiasAtras = new Date()
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
        seteDiasAtras.setHours(0, 0, 0, 0)
        bateData = dt >= seteDiasAtras
      } else if (periodoData === 'mes') {
        bateData = dt.getMonth() === agora.getMonth() && dt.getFullYear() === agora.getFullYear()
      } else if (periodoData === 'custom') {
        const dInicio = dataInicio ? new Date(`${dataInicio}T00:00:00`) : new Date('1970-01-01')
        const dFim = dataFim ? new Date(`${dataFim}T23:59:59.999`) : new Date('2099-12-31')
        bateData = dt >= dInicio && dt <= dFim
      }
    }

    return bateTexto && batePagto && bateData
  })

  // Totalizador rápido das vendas visíveis
  const totalFaturadoFiltrado = vendasFiltradas.reduce((s, v) => s + Number(v.total || 0), 0)

  return (
    <div className="hist-wrapper">
      <style>{`
        .hist-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }

        .filter-panel { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 10px; }
        
        .filter-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .filter-pills { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; flex-wrap: wrap; }
        .pill-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; color: #64748b; font-size: 0.82rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
        .pill-btn.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }

        .custom-dates-bar { display: flex; align-items: center; gap: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0; flex-wrap: wrap; }
        .date-input-group { display: flex; align-items: center; gap: 6px; }
        .date-input-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .date-input-group input { height: 34px; padding: 0 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; color: #0f172a; outline: none; }

        .search-box { display: flex; align-items: center; gap: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; height: 38px; width: 280px; }
        .search-box input { border: none; outline: none; width: 100%; font-size: 0.85rem; color: #0f172a; background: transparent; }

        .summary-bar { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; flex-wrap: wrap; gap: 8px; }

        .table-responsive { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 760px; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        td { padding: 0.85rem 1rem; font-size: 0.88rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }

        .badge-forma { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .badge-dinheiro { background: #dcfce7; color: #15803d; }
        .badge-pix { background: #e0f2fe; color: #0369a1; }
        .badge-cartao { background: #f1f5f9; color: #334155; }
        .badge-crediario { background: #fef3c7; color: #b45309; }
        .badge-misto { background: #fae8ff; color: #86198f; }

        .btn-act { padding: 0.4rem 0.65rem; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
        .btn-act:hover { background: #f1f5f9; }
        .btn-act-zap { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
        .btn-act-zap:hover { background: #bbf7d0; }
        .btn-act-danger { color: #dc2626; border-color: #fecaca; }
        .btn-act-danger:hover { background: #fef2f2; }

        /* Modal Edição */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 1rem; }
        .modal-card { background: #ffffff; width: 100%; max-width: 480px; border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem; }
        .form-group-modal { display: flex; flex-direction: column; margin-bottom: 1rem; }
        .form-group-modal label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; }
        .form-group-modal input, .form-group-modal select { height: 42px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 10px; font-size: 0.95rem; color: #0f172a; }

        @media (max-width: 768px) {
          .filter-row { flex-direction: column; align-items: stretch; }
          .search-box { width: 100%; }
          .custom-dates-bar { flex-direction: column; align-items: stretch; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de Vendas</h1>
          <p className="page-subtitle">Consulte vendas por data, reimprima cupons, altere dados ou realize estornos</p>
        </div>
      </div>

      {/* PAINEL COMPLETO DE FILTROS */}
      <div className="filter-panel">
        {/* Linha 1: Filtros de Data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Período:</span>
          <div className="filter-pills">
            <button className={`pill-btn ${periodoData === 'hoje' ? 'active' : ''}`} onClick={() => setPeriodoData('hoje')}>Hoje</button>
            <button className={`pill-btn ${periodoData === '7dias' ? 'active' : ''}`} onClick={() => setPeriodoData('7dias')}>Últimos 7 Dias</button>
            <button className={`pill-btn ${periodoData === 'mes' ? 'active' : ''}`} onClick={() => setPeriodoData('mes')}>Mês Atual</button>
            <button className={`pill-btn ${periodoData === 'todos' ? 'active' : ''}`} onClick={() => setPeriodoData('todos')}>Todo o Histórico</button>
            <button className={`pill-btn ${periodoData === 'custom' ? 'active' : ''}`} onClick={() => setPeriodoData('custom')}>📅 Personalizado (De ➔ Até)</button>
          </div>
        </div>

        {/* Linha 1.1: Inputs De -> Até quando o personalizado for ativo */}
        {periodoData === 'custom' && (
          <div className="custom-dates-bar">
            <div className="date-input-group">
              <label>De:</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div className="date-input-group">
              <label>Até:</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
            <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>
              Filtrando de {new Date(`${dataInicio}T12:00:00`).toLocaleDateString('pt-BR')} até {new Date(`${dataFim}T12:00:00`).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}

        {/* Linha 2: Filtros de Forma de Pagamento e Busca por Texto */}
        <div className="filter-row" style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Forma:</span>
            <div className="filter-pills">
              <button className={`pill-btn ${filtroPagto === 'todos' ? 'active' : ''}`} onClick={() => setFiltroPagto('todos')}>Todas</button>
              <button className={`pill-btn ${filtroPagto === 'pix' ? 'active' : ''}`} onClick={() => setFiltroPagto('pix')}>PIX</button>
              <button className={`pill-btn ${filtroPagto === 'dinheiro' ? 'active' : ''}`} onClick={() => setFiltroPagto('dinheiro')}>Dinheiro</button>
              <button className={`pill-btn ${filtroPagto === 'credito' ? 'active' : ''}`} onClick={() => setFiltroPagto('credito')}>Crédito</button>
              <button className={`pill-btn ${filtroPagto === 'debito' ? 'active' : ''}`} onClick={() => setFiltroPagto('debito')}>Débito</button>
              <button className={`pill-btn ${filtroPagto === 'crediario' ? 'active' : ''}`} onClick={() => setFiltroPagto('crediario')}>Crediário</button>
              <button className={`pill-btn ${filtroPagto === 'misto' ? 'active' : ''}`} onClick={() => setFiltroPagto('misto')}>Misto</button>
            </div>
          </div>

          <div className="search-box">
            <IconSearch />
            <input 
              type="text" 
              placeholder="Buscar por #pedido ou cliente..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca && <button onClick={() => setBusca('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>✕</button>}
          </div>
        </div>
      </div>

      {/* RESUMO DOS RESULTADOS FILTRADOS */}
      <div className="summary-bar">
        <span>Mostrando <strong>{vendasFiltradas.length}</strong> vendas no filtro selecionado</span>
        <span>Total faturado no período: <strong style={{ color: '#2563eb', fontSize: '1.05rem' }}>R$ {totalFaturadoFiltrado.toFixed(2)}</strong></span>
      </div>

      {/* TABELA DE VENDAS */}
      <div className="table-responsive">
        {loading ? (
          <p style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Carregando histórico de vendas...</p>
        ) : vendasFiltradas.length === 0 ? (
          <p style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Nenhuma venda encontrada para o período e filtros aplicados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Data & Hora</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Pagamento</th>
                <th>Total</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vendasFiltradas.map(v => {
                const cod = formatarIdVenda(v.id)
                const dataFormatada = new Date(v.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                const itens = Array.isArray(v.itens) ? v.itens : []
                const totalPecas = itens.reduce((s, i) => s + Number(i.quantidade || 1), 0)

                let classeBadge = 'badge-cartao'
                if (v.forma_pagamento === 'dinheiro') classeBadge = 'badge-dinheiro'
                else if (v.forma_pagamento === 'pix') classeBadge = 'badge-pix'
                else if (v.forma_pagamento === 'crediario') classeBadge = 'badge-crediario'
                else if (v.forma_pagamento === 'misto') classeBadge = 'badge-misto'

                return (
                  <tr key={v.id}>
                    <td><strong>#{cod}</strong></td>
                    <td>{dataFormatada}</td>
                    <td>
                      <div><strong>{v.clientes?.nome || 'Cliente Avulso'}</strong></div>
                      {v.clientes?.telefone && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.clientes.telefone}</span>}
                    </td>
                    <td>{totalPecas} un</td>
                    <td>
                      <span className={`badge-forma ${classeBadge}`}>
                        {v.forma_pagamento || 'dinheiro'}
                      </span>
                    </td>
                    <td><strong>R$ {Number(v.total || 0).toFixed(2)}</strong></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button className="btn-act" onClick={() => gerarComprovanteVenda(v)} title="Imprimir Comprovante">
                          <IconReceipt /> Recibo
                        </button>

                        {v.clientes?.telefone && (
                          <button className="btn-act btn-act-zap" onClick={() => enviarWhatsApp(v)} title="Enviar no WhatsApp">
                            <IconWhatsApp /> Zap
                          </button>
                        )}

                        <button className="btn-act" onClick={() => abrirEdicaoVenda(v)} title="Editar Forma de Pagamento ou Cliente">
                          <IconEdit /> Editar
                        </button>

                        {isAdmin && (
                          <button className="btn-act btn-act-danger" onClick={() => excluirVenda(v)} title="Cancelar e Estornar Venda">
                            <IconTrash />
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

      {/* MODAL DE EDIÇÃO DE VENDA */}
      {modalEditAberto && vendaEditando && (
        <div className="modal-overlay" onClick={() => setModalEditAberto(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>Editar Venda #{formatarIdVenda(vendaEditando.id)}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Altere a forma de pagamento, valor ou cliente associado</span>
              </div>
              <button onClick={() => setModalEditAberto(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={salvarEdicaoVenda}>
              <div className="form-group-modal">
                <label>Cliente Associado</label>
                <select value={novoClienteId} onChange={e => setNovoClienteId(e.target.value)}>
                  <option value="">Cliente Avulso (Sem cadastro)</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} {c.telefone ? `(${c.telefone})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-modal">
                <label>Forma de Pagamento</label>
                <select value={novaFormaPagto} onChange={e => setNovaFormaPagto(e.target.value)}>
                  <option value="dinheiro">Dinheiro (À Vista)</option>
                  <option value="pix">PIX (À Vista)</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="credito">Cartão de Crédito</option>
                  <option value="crediario">Crediário (A Prazo / Caderno)</option>
                  <option value="misto">Misto (Dividido)</option>
                </select>
              </div>

              <div className="form-group-modal">
                <label>Valor Total Cobrado (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={novoTotal} 
                  onChange={e => setNovoTotal(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
                <button type="button" className="btn-act" onClick={() => setModalEditAberto(false)}>Cancelar</button>
                <button 
                  type="submit" 
                  disabled={salvandoEdicao}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
