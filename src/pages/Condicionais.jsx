import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { gerarComprovanteCondicional, formatarIdVenda } from '../utils/pdfGenerator'

// Ícones SVG minimalistas nativos
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
)

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconFileText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
  </svg>
)

const IconShoppingBag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

export default function Condicionais() {
  const [condicionais, setCondicionais] = useState([])
  const [clientes, setClientes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('aberto') // 'aberto', 'finalizado', 'todos'
  const [busca, setBusca] = useState('')

  // Modal Nova Mala
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [clienteSel, setClienteSel] = useState(null)
  const [termoCli, setTermoCli] = useState('')
  const [dropdownCliAberto, setDropdownCliAberto] = useState(false)
  const dropdownCliRef = useRef(null)

  const [itensMala, setItensMala] = useState([])
  const [termoProd, setTermoProd] = useState('')
  const [prodSel, setProdSel] = useState(null)
  const [qtdProd, setQtdProd] = useState('1')
  const [dropdownProdAberto, setDropdownProdAberto] = useState(false)
  const dropdownProdRef = useRef(null)

  const [dataPrevista, setDataPrevista] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3) // Padrão: 3 dias
    return d.toISOString().split('T')[0]
  })
  const [obsMala, setObsMala] = useState('')
  const [salvandoMala, setSalvandoMala] = useState(false)

  // Modal Acerto / Devolução
  const [modalAcertoAberto, setModalAcertoAberto] = useState(false)
  const [condAcerto, setCondAcerto] = useState(null)
  const [statusItensAcerto, setStatusItensAcerto] = useState({}) // { [index]: 'ficou' | 'devolveu' }
  const [formaPagamentoAcerto, setFormaPagamentoAcerto] = useState('pix')
  const [salvandoAcerto, setSalvandoAcerto] = useState(false)

  const carregarDados = async () => {
    setLoading(true)
    try {
      const { data: cliData } = await supabase.from('clientes').select('id, nome, telefone, cpf').order('nome')
      const { data: prodData } = await supabase.from('produtos').select('*').order('nome')
      let q = supabase.from('condicionais').select('*, clientes(nome, telefone)').order('id', { ascending: false })

      if (filtroStatus !== 'todos') {
        q = q.eq('status', filtroStatus)
      }

      const { data: condData, error } = await q
      if (error) throw error

      if (cliData) setClientes(cliData)
      if (prodData) setProdutos(prodData)
      if (condData) setCondicionais(condData)
    } catch (err) {
      alert('Erro ao carregar dados: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [filtroStatus])

  // Fecha dropdowns se clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownCliRef.current && !dropdownCliRef.current.contains(e.target)) setDropdownCliAberto(false)
      if (dropdownProdRef.current && !dropdownProdRef.current.contains(e.target)) setDropdownProdAberto(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  // Filtros de busca no modal
  const clientesFiltrados = clientes.filter(c => {
    if (!termoCli) return true
    const t = termoCli.toLowerCase()
    return c.nome.toLowerCase().includes(t) || (c.telefone && c.telefone.includes(t))
  }).slice(0, 6)

  const produtosFiltrados = produtos.filter(p => {
    if (!termoProd) return true
    const t = termoProd.toLowerCase()
    return p.nome.toLowerCase().includes(t) || (p.codigo_barras && p.codigo_barras.toLowerCase().includes(t))
  }).slice(0, 6)

  const addItemMala = () => {
    if (!prodSel) return alert('Selecione um produto.')
    const qtd = parseInt(qtdProd) || 1

    if (prodSel.estoque < qtd) {
      return alert(`Estoque insuficiente de "${prodSel.nome}"! Disponível: ${prodSel.estoque} un.`)
    }

    const existe = itensMala.find(i => i.produtoId === prodSel.id)
    if (existe) {
      setItensMala(itensMala.map(i => i.produtoId === prodSel.id ? { ...i, quantidade: i.quantidade + qtd } : i))
    } else {
      setItensMala([...itensMala, {
        id: Date.now(),
        produtoId: prodSel.id,
        nomeProduto: prodSel.nome,
        preco: Number(prodSel.preco || 0),
        quantidade: qtd
      }])
    }

    setProdSel(null)
    setTermoProd('')
    setQtdProd('1')
  }

  const removerItemMala = (id) => {
    setItensMala(itensMala.filter(i => i.id !== id))
  }

  // Registrar Retirada da Mala
  const salvarNovaMala = async (e) => {
    e.preventDefault()
    if (!clienteSel) return alert('Selecione o cliente.')
    if (itensMala.length === 0) return alert('Adicione ao menos uma peça na mala.')

    setSalvandoMala(true)
    try {
      // 1. Grava condicional
      const { data: condCriado, error: erroCond } = await supabase
        .from('condicionais')
        .insert([{
          cliente_id: clienteSel.id,
          data_devolucao_prevista: dataPrevista || null,
          itens: itensMala,
          observacoes: obsMala.trim() || null,
          status: 'aberto'
        }])
        .select('*, clientes(nome, telefone)')
        .single()

      if (erroCond) throw erroCond

      // 2. Subtrai temporariamente do estoque disponível
      for (const item of itensMala) {
        const prod = produtos.find(p => p.id === item.produtoId)
        if (prod) {
          await supabase
            .from('produtos')
            .update({ estoque: Math.max(0, prod.estoque - item.quantidade) })
            .eq('id', item.produtoId)
        }
      }

      alert(`Mala #${formatarIdVenda(condCriado.id)} criada com sucesso!`)
      if (confirm('Deseja imprimir o comprovante de condicional com termo de prova?')) {
        gerarComprovanteCondicional(condCriado)
      }

      setModalNovoAberto(false)
      setClienteSel(null)
      setTermoCli('')
      setItensMala([])
      setObsMala('')
      await carregarDados()
    } catch (err) {
      alert('Erro ao criar condicional: ' + err.message)
    }
    setSalvandoMala(false)
  }

  // Abrir Acerto / Devolução
  const abrirModalAcerto = (cond) => {
    setCondAcerto(cond)
    const estadoInicial = {}
    // Padrão inicial: assume que vai ficar ou devolver
    ;(cond.itens || []).forEach((_, idx) => {
      estadoInicial[idx] = 'ficou' // Usuário muda para 'devolveu' o que voltar
    })
    setStatusItensAcerto(estadoInicial)
    setFormaPagamentoAcerto('pix')
    setModalAcertoAberto(true)
  }

  // Processar o Fechamento da Mala
  const confirmarAcertoMala = async () => {
    if (!condAcerto) return
    setSalvandoAcerto(true)

    try {
      const itensFicaram = []
      const itensDevolvidos = []

      condAcerto.itens.forEach((item, idx) => {
        if (statusItensAcerto[idx] === 'ficou') {
          itensFicaram.push(item)
        } else {
          itensDevolvidos.push(item)
        }
      })

      // 1. Devolve para o estoque as peças que não foram compradas
      for (const item of itensDevolvidos) {
        const prod = produtos.find(p => p.id === item.produtoId)
        if (prod) {
          await supabase
            .from('produtos')
            .update({ estoque: (prod.estoque || 0) + item.quantidade })
            .eq('id', item.produtoId)
        }
      }

      let idVendaGerada = null

      // 2. Se o cliente ficou com alguma peça, gera a Venda no Caixa automaticamente!
      if (itensFicaram.length > 0) {
        const totalVenda = itensFicaram.reduce((s, i) => s + (Number(i.preco) * Number(i.quantidade)), 0)

        const { data: vendaCriada, error: erroVenda } = await supabase
          .from('vendas')
          .insert([{
            total: totalVenda,
            forma_pagamento: formaPagamentoAcerto,
            itens: itensFicaram,
            cliente_id: condAcerto.cliente_id
          }])
          .select()
          .single()

        if (erroVenda) throw erroVenda
        idVendaGerada = vendaCriada.id

        // Se foi crediário, lança em Contas a Receber
        if (formaPagamentoAcerto === 'crediario') {
          const dataVenc = new Date()
          dataVenc.setDate(dataVenc.getDate() + 30)

          await supabase.from('contas_a_receber').insert([{
            descricao: `Acerto Condicional #${condAcerto.id} - ${condAcerto.clientes?.nome}`,
            valor: totalVenda,
            valor_pago: 0,
            vencimento: dataVenc.toISOString().split('T')[0],
            status: 'pendente',
            cliente_id: condAcerto.cliente_id
          }])
        }
      }

      // 3. Finaliza a Mala no banco
      const { error: erroUpdate } = await supabase
        .from('condicionais')
        .update({
          status: 'finalizado',
          venda_id: idVendaGerada
        })
        .eq('id', condAcerto.id)

      if (erroUpdate) throw erroUpdate

      alert('Acerto realizado com sucesso!\nPeças devolvidas retornaram ao estoque e peças compradas foram registradas no caixa.')
      setModalAcertoAberto(false)
      setCondAcerto(null)
      await carregarDados()
    } catch (err) {
      alert('Erro no acerto: ' + err.message)
    }

    setSalvandoAcerto(false)
  }

  // Filtragem livre na tabela principal
  const condicionaisFiltrados = condicionais.filter(c => {
    if (!busca.trim()) return true
    const termo = busca.toLowerCase()
    const nome = (c.clientes?.nome || '').toLowerCase()
    const tel = (c.clientes?.telefone || '').toLowerCase()
    const cod = formatarIdVenda(c.id).toLowerCase()
    return nome.includes(termo) || tel.includes(termo) || cod.includes(termo)
  })

  // Total de peças na rua no momento
  const pecasNaRua = condicionais
    .filter(c => c.status === 'aberto')
    .reduce((sum, c) => sum + (c.itens || []).reduce((s, i) => s + Number(i.quantidade || 1), 0), 0)

  const valorNaRua = condicionais
    .filter(c => c.status === 'aberto')
    .reduce((sum, c) => sum + (c.itens || []).reduce((s, i) => s + (Number(i.quantidade || 1) * Number(i.preco || 0)), 0), 0)

  return (
    <div className="cond-wrapper">
      <style>{`
        .cond-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
        
        .kpi-cards { display: flex; gap: 12px; flex-wrap: wrap; }
        .kpi-box { background: #ffffff; border: 1px solid #fef08a; border-radius: 12px; padding: 0.85rem 1.25rem; min-width: 180px; }
        .kpi-box span { font-size: 0.7rem; font-weight: 700; color: #854d0e; text-transform: uppercase; letter-spacing: 0.05em; display: block; }
        .kpi-box strong { font-size: 1.35rem; font-weight: 800; color: #a16207; margin-top: 2px; display: block; }

        .controls-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .filter-bar { display: flex; gap: 8px; }
        .filter-btn { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; color: #64748b; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
        .filter-btn.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }

        .search-box { display: flex; align-items: center; gap: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; height: 38px; width: 280px; }
        .search-box input { border: none; outline: none; width: 100%; font-size: 0.85rem; color: #0f172a; background: transparent; }

        .btn-primary { background: #2563eb; color: #ffffff; padding: 0.65rem 1.25rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-action { display: inline-flex; align-items: center; gap: 4px; padding: 0.45rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; }
        .btn-acerto { background: #10b981; color: #ffffff; }
        .btn-acerto:hover { background: #059669; }
        .btn-sec { background: #f1f5f9; color: #475569; }
        .btn-sec:hover { background: #e2e8f0; color: #0f172a; }

        .table-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.02); width: 100%; }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 820px; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1.25rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        td { padding: 1rem 1.25rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; white-space: nowrap; }
        tbody tr:hover { background: #f8fafc; }

        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-aberto { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
        .badge-vencido { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-finalizado { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }

        /* Modais */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 1rem; }
        .modal-card { background: #ffffff; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem; }
        .modal-title { font-size: 1.15rem; font-weight: 700; color: #0f172a; }

        .form-group-modal { display: flex; flex-direction: column; margin-bottom: 1rem; position: relative; }
        .form-group-modal label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 5px; text-transform: uppercase; }
        .form-group-modal input, .form-group-modal select { height: 40px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 10px; font-size: 0.9rem; color: #0f172a; }
        .form-group-modal input:focus { outline: none; border-color: #2563eb; }

        .drop-auto { position: absolute; top: 100%; left: 0; right: 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-height: 200px; overflow-y: auto; z-index: 50; margin-top: 4px; }
        .drop-item { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; }
        .drop-item:hover { background: #eff6ff; }
        .badge-selected { display: flex; justify-content: space-between; align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px 12px; border-radius: 8px; margin-top: 6px; font-size: 0.88rem; color: #1e40af; }

        .mala-item-card { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 6px; font-size: 0.88rem; }
        
        .acerto-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 8px; }
        .btn-toggle-acerto { padding: 6px 12px; border-radius: 6px; border: none; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
        .btn-toggle-ficou { background: #dcfce7; color: #15803d; }
        .btn-toggle-devolveu { background: #fee2e2; color: #dc2626; }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: stretch; }
          .controls-row { flex-direction: column; align-items: stretch; }
          .search-box { width: 100%; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Mala de Roupas (Condicionais)</h1>
          <p className="page-subtitle">Controle de peças enviadas para prova em casa e acerto ágil no balcão</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="kpi-cards">
            <div className="kpi-box">
              <span>Peças em Prova (Rua)</span>
              <strong>{pecasNaRua} un</strong>
            </div>
            <div className="kpi-box">
              <span>Valor sob Custódia</span>
              <strong>R$ {valorNaRua.toFixed(2)}</strong>
            </div>
          </div>

          <button className="btn-primary" onClick={() => setModalNovoAberto(true)}>
            <IconPlus /> Nova Mala
          </button>
        </div>
      </div>

      <div className="controls-row">
        <div className="filter-bar">
          <button 
            className={`filter-btn ${filtroStatus === 'aberto' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('aberto')}
          >
            Em Aberto
          </button>
          <button 
            className={`filter-btn ${filtroStatus === 'finalizado' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('finalizado')}
          >
            Finalizadas / Acertadas
          </button>
          <button 
            className={`filter-btn ${filtroStatus === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('todos')}
          >
            Todas
          </button>
        </div>

        <div className="search-box">
          <IconSearch />
          <input 
            type="text" 
            placeholder="Buscar por cliente, telefone ou ID..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {busca && (
            <button onClick={() => setBusca('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
          )}
        </div>
      </div>

      <div className="table-box">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Carregando condicionais...</p>
        ) : condicionaisFiltrados.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Nenhuma mala encontrada.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Data Retirada</th>
                <th>Prazo Devolução</th>
                <th>Qtd Peças</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {condicionaisFiltrados.map(cond => {
                const cod = formatarIdVenda(cond.id)
                const itens = Array.isArray(cond.itens) ? cond.itens : []
                const totalQtd = itens.reduce((s, i) => s + Number(i.quantidade || 1), 0)
                const totalVal = itens.reduce((s, i) => s + (Number(i.quantidade || 1) * Number(i.preco || 0)), 0)

                const hojeStr = new Date().toISOString().split('T')[0]
                const isVencido = cond.status === 'aberto' && cond.data_devolucao_prevista && cond.data_devolucao_prevista < hojeStr

                return (
                  <tr key={cond.id}>
                    <td><strong>#{cod}</strong></td>
                    <td>
                      <div><strong>{cond.clientes?.nome || 'Não identificado'}</strong></div>
                      {cond.clientes?.telefone && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{cond.clientes.telefone}</span>}
                    </td>
                    <td>{cond.data_retirada ? new Date(`${cond.data_retirada}T12:00:00`).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                      {cond.data_devolucao_prevista ? (
                        <span style={{ color: isVencido ? '#dc2626' : '#0f172a', fontWeight: isVencido ? '700' : '500' }}>
                          {new Date(`${cond.data_devolucao_prevista}T12:00:00`).toLocaleDateString('pt-BR')}
                          {isVencido && ' (VENCIDA)'}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{totalQtd} peças</td>
                    <td><strong>R$ {totalVal.toFixed(2)}</strong></td>
                    <td>
                      {cond.status === 'aberto' ? (
                        <span className={`badge ${isVencido ? 'badge-vencido' : 'badge-aberto'}`}>
                          <IconClock /> {isVencido ? 'Vencida' : 'Em Prova'}
                        </span>
                      ) : (
                        <span className="badge badge-finalizado">
                          <IconCheck /> Finalizada
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {cond.status === 'aberto' && (
                          <button className="btn-action btn-acerto" onClick={() => abrirModalAcerto(cond)}>
                            <IconCheck /> Fazer Acerto
                          </button>
                        )}
                        <button className="btn-action btn-sec" onClick={() => gerarComprovanteCondicional(cond)}>
                          <IconFileText /> Termo
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL NOVA MALA */}
      {modalNovoAberto && (
        <div className="modal-overlay" onClick={() => setModalNovoAberto(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Liberar Mala de Roupas (Condicional)</h3>
              <button onClick={() => setModalNovoAberto(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={salvarNovaMala}>
              {/* Autocomplete Cliente */}
              <div className="form-group-modal" ref={dropdownCliRef}>
                <label>Cliente Solicitante</label>
                {!clienteSel ? (
                  <>
                    <input 
                      type="text" 
                      placeholder="Digite o nome ou telefone..." 
                      value={termoCli}
                      onChange={e => { setTermoCli(e.target.value); setDropdownCliAberto(true); }}
                      onFocus={() => setDropdownCliAberto(true)}
                      required
                    />
                    {dropdownCliAberto && (
                      <div className="drop-auto">
                        {clientesFiltrados.map(c => (
                          <div key={c.id} className="drop-item" onClick={() => { setClienteSel(c); setTermoCli(c.nome); setDropdownCliAberto(false); }}>
                            <strong>{c.nome}</strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.telefone || ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="badge-selected">
                    <div><strong>{clienteSel.nome}</strong> ({clienteSel.telefone || 'Sem fone'})</div>
                    <button type="button" onClick={() => { setClienteSel(null); setTermoCli(''); }} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>✕ Trocar</button>
                  </div>
                )}
              </div>

              {/* Data Prevista Devolução */}
              <div className="form-group-modal">
                <label>Prazo Limite para Devolução / Acerto</label>
                <input 
                  type="date" 
                  value={dataPrevista}
                  onChange={e => setDataPrevista(e.target.value)}
                  required
                />
              </div>

              {/* Adicionar Peças */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Adicionar Peças na Mala
                </span>

                <div style={{ display: 'flex', gap: '8px', position: 'relative' }} ref={dropdownProdRef}>
                  <div style={{ flex: 3, position: 'relative' }}>
                    <input 
                      type="text"
                      placeholder="Buscar por nome ou código..."
                      value={termoProd}
                      onChange={e => { setTermoProd(e.target.value); setDropdownProdAberto(true); }}
                      onFocus={() => setDropdownProdAberto(true)}
                      style={{ height: '38px', width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px', fontSize: '0.85rem' }}
                    />
                    {dropdownProdAberto && (
                      <div className="drop-auto">
                        {produtosFiltrados.map(p => (
                          <div key={p.id} className="drop-item" onClick={() => { setProdSel(p); setTermoProd(p.nome); setDropdownProdAberto(false); }}>
                            <div>
                              <div><strong>{p.nome}</strong></div>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Estoque: {p.estoque} un</span>
                            </div>
                            <strong style={{ color: '#2563eb' }}>R$ {Number(p.preco).toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <input 
                    type="number" 
                    min="1" 
                    value={qtdProd} 
                    onChange={e => setQtdProd(e.target.value)}
                    style={{ width: '60px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '8px', textAlign: 'center' }}
                  />

                  <button type="button" className="btn-primary" onClick={addItemMala} style={{ padding: '0 12px', height: '38px' }}>
                    <IconPlus /> Adicionar
                  </button>
                </div>

                {/* Lista de Peças Adicionadas */}
                <div style={{ marginTop: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                  {itensMala.map(item => (
                    <div key={item.id} className="mala-item-card">
                      <div>
                        <strong>{item.quantidade}x</strong> {item.nomeProduto}
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>R$ {item.preco.toFixed(2)} unit.</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong>R$ {(item.quantidade * item.preco).toFixed(2)}</strong>
                        <button type="button" onClick={() => removerItemMala(item.id)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group-modal">
                <label>Observações (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Cliente vai experimentar para evento no sábado"
                  value={obsMala}
                  onChange={e => setObsMala(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
                <button type="button" className="btn-action btn-sec" onClick={() => setModalNovoAberto(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={salvandoMala}>
                  {salvandoMala ? 'Salvando...' : 'Confirmar Saída da Mala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ACERTO / DEVOLUÇÃO */}
      {modalAcertoAberto && condAcerto && (
        <div className="modal-overlay" onClick={() => setModalAcertoAberto(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Acerto da Mala #{formatarIdVenda(condAcerto.id)}</h3>
              <button onClick={() => setModalAcertoAberto(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1rem' }}>
              Cliente: <strong>{condAcerto.clientes?.nome}</strong>. Marque o que o cliente <strong>ficou</strong> e o que <strong>devolveu</strong>:
            </p>

            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '1.25rem' }}>
              {(condAcerto.itens || []).map((item, idx) => {
                const ficou = statusItensAcerto[idx] === 'ficou'
                return (
                  <div key={idx} className="acerto-row">
                    <div>
                      <strong>{item.quantidade}x</strong> {item.nomeProduto}
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>R$ {Number(item.preco).toFixed(2)} cada</div>
                    </div>

                    <button 
                      type="button" 
                      className={`btn-toggle-acerto ${ficou ? 'btn-toggle-ficou' : 'btn-toggle-devolveu'}`}
                      onClick={() => setStatusItensAcerto({ ...statusItensAcerto, [idx]: ficou ? 'devolveu' : 'ficou' })}
                    >
                      {ficou ? '✓ Ficou (Comprar)' : '✕ Devolveu (Estoque)'}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Total a Pagar das Peças Compradas */}
            {(() => {
              const totalComprado = (condAcerto.itens || []).reduce((s, item, idx) => {
                return statusItensAcerto[idx] === 'ficou' ? s + (Number(item.preco) * Number(item.quantidade)) : s
              }, 0)

              return (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Total a pagar pelas peças que ficaram:</span>
                    <strong style={{ fontSize: '1.3rem', color: '#16a34a' }}>R$ {totalComprado.toFixed(2)}</strong>
                  </div>

                  {totalComprado > 0 && (
                    <div className="form-group-modal" style={{ marginBottom: 0 }}>
                      <label>Forma de Pagamento das Peças Compradas</label>
                      <select value={formaPagamentoAcerto} onChange={e => setFormaPagamentoAcerto(e.target.value)}>
                        <option value="pix">PIX (À Vista)</option>
                        <option value="dinheiro">Dinheiro (À Vista)</option>
                        <option value="debito">Cartão de Débito</option>
                        <option value="credito">Cartão de Crédito</option>
                        <option value="crediario">Crediário (A Prazo / Caderno)</option>
                      </select>
                    </div>
                  )}
                </div>
              )
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-action btn-sec" onClick={() => setModalAcertoAberto(false)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={confirmarAcertoMala} disabled={salvandoAcerto} style={{ background: '#10b981' }}>
                <IconCheck /> {salvandoAcerto ? 'Processando...' : 'Finalizar Acerto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
