import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const IconTrendingUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconTag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><circle cx="7" cy="7" r="1.5" />
  </svg>
)

const IconWhatsApp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const IconDollar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const formatarDataInput = (data) => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export default function Relatorios() {
  const [loading, setLoading] = useState(true)
  const [vendas, setVendas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [contasReceber, setContasReceber] = useState([])
  const [dadosEmpresa, setDadosEmpresa] = useState(null)
  
  // Abas Principais
  const [abaAtiva, setAbaAtiva] = useState('dre') // 'dre' ou 'extrato'

  // Filtros de Período
  const [periodoTipo, setPeriodoTipo] = useState('mes')
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return formatarDataInput(d)
  })
  const [dataFim, setDataFim] = useState(() => formatarDataInput(new Date()))

  // Filtro por Categoria (Aba DRE)
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [diasCorteEstoque, setDiasCorteEstoque] = useState(45)

  // Filtro por Forma de Pagamento (Aba Extrato)
  const [filtroFormaExtrato, setFiltroFormaExtrato] = useState('todas')

  const carregarDados = async () => {
    setLoading(true)
    try {
      const { data: vData } = await supabase.from('vendas').select('*, clientes(id, nome, telefone, saldo_cashback)').order('created_at', { ascending: false })
      const { data: pData } = await supabase.from('produtos').select('*').order('nome')
      const { data: cData } = await supabase.from('clientes').select('*').order('nome')
      const { data: crData } = await supabase.from('contas_a_receber').select('*, clientes(id, nome, telefone)')
      const { data: cfgData } = await supabase.from('configuracoes').select('*')

      if (vData) setVendas(vData)
      if (pData) setProdutos(pData)
      if (cData) setClientes(cData)
      if (crData) setContasReceber(crData)

      if (cfgData) {
        const mapa = {}
        cfgData.forEach(c => { mapa[c.chave] = c.valor })
        setDadosEmpresa({ nome: mapa['empresa_nome'] || 'TECCO' })
      }
    } catch (err) {
      alert('Erro ao carregar relatórios: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Filtro temporal genérico
  const estaNoPeriodo = (dataIso) => {
    if (periodoTipo === 'todos') return true
    const dt = new Date(dataIso)
    const agora = new Date()

    if (periodoTipo === 'hoje') {
      return dt.getDate() === agora.getDate() && dt.getMonth() === agora.getMonth() && dt.getFullYear() === agora.getFullYear()
    }
    if (periodoTipo === '7dias') {
      const seteDiasAtras = new Date()
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
      seteDiasAtras.setHours(0, 0, 0, 0)
      return dt >= seteDiasAtras
    }
    if (periodoTipo === 'mes') {
      return dt.getMonth() === agora.getMonth() && dt.getFullYear() === agora.getFullYear()
    }
    if (periodoTipo === 'custom') {
      if (!dataInicio && !dataFim) return true
      const dInicio = dataInicio ? new Date(`${dataInicio}T00:00:00`) : new Date('1970-01-01')
      const dFim = dataFim ? new Date(`${dataFim}T23:59:59.999`) : new Date('2099-12-31')
      return dt >= dInicio && dt <= dFim
    }
    return true
  }

  // Mapa ProdutoId -> Categoria
  const mapaCategoriasProdutos = {}
  produtos.forEach(p => {
    mapaCategoriasProdutos[p.id] = (p.categoria || 'Geral').trim()
  })

  const listaCategoriasDisponiveis = Array.from(
    new Set(produtos.map(p => (p.categoria || 'Geral').trim()).filter(Boolean))
  ).sort()

  const vendasNoPeriodo = vendas.filter(v => estaNoPeriodo(v.created_at))

  // 1. Processamento DRE
  let receitaTotal = 0
  let custoTotal = 0
  let qtdItensTotal = 0
  const desempenhoPorCategoria = {}

  vendasNoPeriodo.forEach(v => {
    const itens = Array.isArray(v.itens) ? v.itens : []
    itens.forEach(item => {
      const catItem = mapaCategoriasProdutos[item.produtoId] || 'Geral'
      const qtd = Number(item.quantidade || 1)
      const precoUnit = Number(item.preco || 0)
      const custoUnit = Number(item.preco_custo || 0)

      const subtotalItem = qtd * precoUnit
      const custoTotalItem = qtd * custoUnit

      if (!desempenhoPorCategoria[catItem]) {
        desempenhoPorCategoria[catItem] = { categoria: catItem, faturamento: 0, custo: 0, qtdPecas: 0 }
      }
      desempenhoPorCategoria[catItem].faturamento += subtotalItem
      desempenhoPorCategoria[catItem].custo += custoTotalItem
      desempenhoPorCategoria[catItem].qtdPecas += qtd

      if (categoriaFiltro === 'todas' || catItem.toLowerCase() === categoriaFiltro.toLowerCase()) {
        receitaTotal += subtotalItem
        custoTotal += custoTotalItem
        qtdItensTotal += qtd
      }
    })
  })

  const listaDesempenhoCategorias = Object.values(desempenhoPorCategoria).sort((a, b) => b.faturamento - a.faturamento)
  const totalGeralTodasCategorias = listaDesempenhoCategorias.reduce((s, c) => s + c.faturamento, 0)
  const lucroBruto = Math.max(0, receitaTotal - custoTotal)
  const margemPercentual = receitaTotal > 0 ? ((lucroBruto / receitaTotal) * 100) : 0

  // 2. Curva ABC
  const mapaProdutos = {}
  vendasNoPeriodo.forEach(v => {
    const itens = Array.isArray(v.itens) ? v.itens : []
    itens.forEach(item => {
      const catItem = mapaCategoriasProdutos[item.produtoId] || 'Geral'
      if (categoriaFiltro !== 'todas' && catItem.toLowerCase() !== categoriaFiltro.toLowerCase()) return

      const idProd = item.produtoId || item.nomeProduto
      if (!mapaProdutos[idProd]) {
        mapaProdutos[idProd] = { nome: item.nomeProduto, categoria: catItem, qtd: 0, faturamento: 0 }
      }
      const qtd = Number(item.quantidade || 1)
      const preco = Number(item.preco || 0)
      mapaProdutos[idProd].qtd += qtd
      mapaProdutos[idProd].faturamento += (qtd * preco)
    })
  })
  const rankingProdutos = Object.values(mapaProdutos).sort((a, b) => b.faturamento - a.faturamento).slice(0, 8)

  // 3. Estoque Parado
  const dataLimiteParado = new Date()
  dataLimiteParado.setDate(dataLimiteParado.getDate() - diasCorteEstoque)
  dataLimiteParado.setHours(23, 59, 59, 999)

  const produtosParados = produtos.map(p => {
    if ((p.estoque || 0) <= 0) return null
    if (categoriaFiltro !== 'todas' && (p.categoria || 'Geral').toLowerCase() !== categoriaFiltro.toLowerCase()) return null

    const ultimaVenda = vendas.find(v => {
      const itens = Array.isArray(v.itens) ? v.itens : []
      return itens.some(i => i.produtoId === p.id)
    })

    let dataReferencia
    let motivo = ''

    if (ultimaVenda) {
      dataReferencia = new Date(ultimaVenda.created_at)
      motivo = 'Sem vendas recentes'
    } else {
      dataReferencia = p.created_at ? new Date(p.created_at) : null
      motivo = 'Cadastrado e nunca vendeu'
    }

    if (!dataReferencia || dataReferencia >= dataLimiteParado) return null

    const diffTempo = Math.abs(new Date() - dataReferencia)
    const diasSemGiro = Math.floor(diffTempo / (1000 * 60 * 60 * 24))

    return {
      ...p,
      diasSemGiro,
      motivo,
      dataUltimaAtividade: dataReferencia.toLocaleDateString('pt-BR')
    }
  }).filter(Boolean).sort((a, b) => b.diasSemGiro - a.diasSemGiro).slice(0, 10)

  // 4. Clientes Inativos com Cashback
  const clientesInativosComSaldo = clientes.filter(c => {
    const saldo = Number(c.saldo_cashback || 0)
    if (saldo <= 0.5) return false
    const ultimaVenda = vendas.find(v => v.cliente_id === c.id)
    if (!ultimaVenda) return true
    return new Date(ultimaVenda.created_at) < dataLimiteParado
  })

  // 5. PROCESSAMENTO DO EXTRATO UNIFICADO (FLUXO DE CAIXA REAL)
  const lancamentosExtrato = []

  // A) Vendas à vista / balcão (desconsiderando o que foi lançado a prazo 100% no crediário)
  vendasNoPeriodo.forEach(v => {
    const clienteNome = v.clientes?.nome || 'Cliente Avulso'

    if (v.forma_pagamento === 'misto' && Array.isArray(v.pagamentos_detalhe)) {
      v.pagamentos_detalhe.forEach((pag, idx) => {
        if (pag.tipo !== 'crediario') {
          lancamentosExtrato.push({
            id: `v-${v.id}-${idx}`,
            dataHora: v.created_at,
            origem: 'Venda Balcão (PDV)',
            descricao: `Venda #${v.id} (Parcela Mista)`,
            cliente: clienteNome,
            forma: pag.tipo.toUpperCase(),
            valor: Number(pag.valor || 0)
          })
        }
      })
    } else if (v.forma_pagamento !== 'crediario') {
      lancamentosExtrato.push({
        id: `v-${v.id}`,
        dataHora: v.created_at,
        origem: 'Venda Balcão (PDV)',
        descricao: `Venda #${v.id}`,
        cliente: clienteNome,
        forma: v.forma_pagamento.toUpperCase(),
        valor: Number(v.total || 0)
      })
    }
  })

  // B) Recebimentos de Crediário (Histórico de quitações no período)
  contasReceber.forEach(conta => {
    const hist = Array.isArray(conta.historico_pagamentos) ? conta.historico_pagamentos : []
    hist.forEach(h => {
      if (h.data && estaNoPeriodo(h.data) && Number(h.valor || 0) > 0) {
        lancamentosExtrato.push({
          id: `cr-${conta.id}-${h.id || Math.random()}`,
          dataHora: h.data,
          origem: 'Crediário (Recebimento)',
          descricao: conta.descricao || `Conta #${conta.id}`,
          cliente: conta.clientes?.nome || 'Cliente Avulso',
          forma: (h.forma || 'PIX / DINHEIRO').toUpperCase(),
          valor: Number(h.valor || 0)
        })
      }
    })
  })

  // Ordena os lançamentos por data decrescente
  lancamentosExtrato.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))

  // Filtra por forma se selecionada no extrato
  const extratoFiltrado = lancamentosExtrato.filter(l => {
    if (filtroFormaExtrato === 'todas') return true
    return l.forma.toLowerCase().includes(filtroFormaExtrato.toLowerCase())
  })

  // Totais do Extrato de Caixa
  const totalEntradaCaixa = extratoFiltrado.reduce((s, l) => s + l.valor, 0)
  const totalDinheiroCaixa = extratoFiltrado.filter(l => l.forma.includes('DINHEIRO')).reduce((s, l) => s + l.valor, 0)
  const totalPixCaixa = extratoFiltrado.filter(l => l.forma.includes('PIX')).reduce((s, l) => s + l.valor, 0)
  const totalCartaoCaixa = extratoFiltrado.filter(l => l.forma.includes('CART') || l.forma.includes('DEBITO') || l.forma.includes('CREDITO')).reduce((s, l) => s + l.valor, 0)

  const convidarClienteWhatsApp = (cliente) => {
    if (!cliente.telefone) return alert('Cliente sem telefone cadastrado!')
    const numLimpo = cliente.telefone.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo
    const nomeLoja = dadosEmpresa?.nome || 'nossa loja'

    const mensagem = encodeURIComponent(
      `Olá, ${cliente.nome}! Tudo bem? ✨\n\n` +
      `Passando para lembrar que você tem *R$ ${Number(cliente.saldo_cashback).toFixed(2)} de saldo de Cashback* disponível no *${nomeLoja}*!\n\n` +
      `Chegaram novidades imperdíveis na loja e o seu bônus já está liberado para abater na sua próxima compra. Esperamos você!`
    )

    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${mensagem}`, '_blank')
  }

  return (
    <div className="rel-wrapper">
      <style>{`
        .rel-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }

        .tabs-main-nav { display: flex; gap: 10px; margin-bottom: 1.25rem; border-bottom: 2px solid #e2e8f0; }
        .tab-main-btn { padding: 10px 18px; border: none; background: transparent; font-size: 0.95rem; font-weight: 700; color: #64748b; cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -2px; }
        .tab-main-btn.active { color: #2563eb; border-bottom-color: #2563eb; }

        .filter-container { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 12px; }
        .filter-row-top { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
        
        .filter-periodo { display: flex; gap: 6px; flex-wrap: wrap; }
        .btn-p { padding: 7px 14px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; color: #475569; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-p.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }

        .category-select-box { display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; }
        .category-select-box label { font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; }
        .category-select-box select { height: 32px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 10px; font-size: 0.85rem; font-weight: 700; color: #0f172a; background: #ffffff; outline: none; }

        .custom-dates-bar { display: flex; align-items: center; gap: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0; flex-wrap: wrap; }
        .date-input-group { display: flex; align-items: center; gap: 6px; }
        .date-input-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .date-input-group input { height: 34px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; color: #0f172a; outline: none; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .kpi-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .kpi-title { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; }
        .kpi-val { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 4px; display: block; }
        .kpi-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

        .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .card-panel { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); box-sizing: border-box; }
        .panel-heading { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; }

        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 0.85rem 1rem; font-size: 0.88rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }

        .badge-origem { padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
        .origem-pdv { background: #eff6ff; color: #1d4ed8; }
        .origem-cr { background: #fef3c7; color: #92400e; }

        .badge-warning { background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
        .btn-zap-mini { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
        .btn-zap-mini:hover { background: #bbf7d0; }

        .selector-dias { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600; color: #475569; }
        .selector-dias select { height: 28px; padding: 0 6px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; font-size: 0.78rem; font-weight: 700; color: #0f172a; }

        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: 1fr 1fr; }
          .two-cols { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns: 1fr; }
          .filter-row-top { flex-direction: column; align-items: stretch; }
          .custom-dates-bar { flex-direction: column; align-items: stretch; }
          .date-input-group { justify-content: space-between; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios & Inteligência Financeira</h1>
          <p className="page-subtitle">DRE Gerencial, Fluxo de Caixa Real e Análise de Desempenho</p>
        </div>
      </div>

      {/* NAVEGAÇÃO ENTRE AS ABAS PRINCIPAIS */}
      <div className="tabs-main-nav">
        <button className={`tab-main-btn ${abaAtiva === 'dre' ? 'active' : ''}`} onClick={() => setAbaAtiva('dre')}>
          📊 Visão DRE & Vendas
        </button>
        <button className={`tab-main-btn ${abaAtiva === 'extrato' ? 'active' : ''}`} onClick={() => setAbaAtiva('extrato')}>
          💵 Extrato de Recebimentos (Fluxo de Caixa)
        </button>
      </div>

      {/* BARRA DE FILTROS TEMPORAIS (COMPARTILHADA) */}
      <div className="filter-container">
        <div className="filter-row-top">
          <div className="filter-periodo">
            <button className={`btn-p ${periodoTipo === 'hoje' ? 'active' : ''}`} onClick={() => setPeriodoTipo('hoje')}>Hoje</button>
            <button className={`btn-p ${periodoTipo === '7dias' ? 'active' : ''}`} onClick={() => setPeriodoTipo('7dias')}>Últimos 7 Dias</button>
            <button className={`btn-p ${periodoTipo === 'mes' ? 'active' : ''}`} onClick={() => setPeriodoTipo('mes')}>Mês Atual</button>
            <button className={`btn-p ${periodoTipo === 'todos' ? 'active' : ''}`} onClick={() => setPeriodoTipo('todos')}>Todo o Período</button>
            <button className={`btn-p ${periodoTipo === 'custom' ? 'active' : ''}`} onClick={() => setPeriodoTipo('custom')}>📅 Intervalo (De ➔ Até)</button>
          </div>

          {abaAtiva === 'dre' ? (
            <div className="category-select-box">
              <label>Filtrar Categoria:</label>
              <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}>
                <option value="todas">Todas as Categorias</option>
                {listaCategoriasDisponiveis.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="category-select-box">
              <label>Filtrar Forma:</label>
              <select value={filtroFormaExtrato} onChange={e => setFiltroFormaExtrato(e.target.value)}>
                <option value="todas">Todas as Formas</option>
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="debito">Cartão de Débito</option>
                <option value="credito">Cartão de Crédito</option>
              </select>
            </div>
          )}
        </div>

        {periodoTipo === 'custom' && (
          <div className="custom-dates-bar">
            <div className="date-input-group">
              <label>De (Início):</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>

            <div className="date-input-group">
              <label>Até (Fim):</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>

            <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, marginLeft: 'auto' }}>
              ✓ De {new Date(`${dataInicio}T12:00:00`).toLocaleDateString('pt-BR')} até {new Date(`${dataFim}T12:00:00`).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Carregando dados financeiros...</p>
      ) : abaAtiva === 'extrato' ? (
        /* ======================== ABA EXTRATO DE RECEBIMENTOS ======================== */
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-title">Total Entrado no Caixa</span>
              <span className="kpi-val" style={{ color: '#16a34a' }}>R$ {totalEntradaCaixa.toFixed(2)}</span>
              <span className="kpi-sub">{extratoFiltrado.length} lançamentos de entrada</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">Dinheiro Físico (Gaveta)</span>
              <span className="kpi-val" style={{ color: '#047857' }}>R$ {totalDinheiroCaixa.toFixed(2)}</span>
              <span className="kpi-sub">Total recebido em espécie</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">PIX Instantâneo</span>
              <span className="kpi-val" style={{ color: '#0284c7' }}>R$ {totalPixCaixa.toFixed(2)}</span>
              <span className="kpi-sub">Entradas diretas na conta</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">Cartões (Débito/Crédito)</span>
              <span className="kpi-val" style={{ color: '#7c3aed' }}>R$ {totalCartaoCaixa.toFixed(2)}</span>
              <span className="kpi-sub">Processado na maquininha</span>
            </div>
          </div>

          <div className="card-panel">
            <div className="panel-heading">
              <span>🧾 Extrato Consolidado de Recebimentos (Vendas + Crediário)</span>
              <IconDollar />
            </div>

            {extratoFiltrado.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                Nenhum recebimento registrado no período selecionado.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Data / Hora</th>
                      <th>Origem</th>
                      <th>Referência / Descrição</th>
                      <th>Cliente</th>
                      <th>Forma de Pagamento</th>
                      <th style={{ textAlign: 'right' }}>Valor Recebido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extratoFiltrado.map(l => (
                      <tr key={l.id}>
                        <td>{new Date(l.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td>
                          <span className={`badge-origem ${l.origem.includes('PDV') ? 'origem-pdv' : 'origem-cr'}`}>
                            {l.origem}
                          </span>
                        </td>
                        <td><strong>{l.descricao}</strong></td>
                        <td>{l.cliente}</td>
                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                            {l.forma}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a', fontSize: '0.95rem' }}>
                          + R$ {l.valor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ======================== ABA DRE & VENDAS ======================== */
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-title">Faturamento {categoriaFiltro !== 'todas' ? `(${categoriaFiltro})` : 'Líquido'}</span>
              <span className="kpi-val" style={{ color: '#2563eb' }}>R$ {receitaTotal.toFixed(2)}</span>
              <span className="kpi-sub">{qtdItensTotal} unidades vendidas</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">Custo das Peças (CMV)</span>
              <span className="kpi-val" style={{ color: '#64748b' }}>R$ {custoTotal.toFixed(2)}</span>
              <span className="kpi-sub">Baseado no preço de custo</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">Lucro Bruto Real</span>
              <span className="kpi-val" style={{ color: '#10b981' }}>R$ {lucroBruto.toFixed(2)}</span>
              <span className="kpi-sub">Faturamento - Custo</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">Margem de Lucro</span>
              <span className="kpi-val" style={{ color: margemPercentual >= 40 ? '#10b981' : '#f59e0b' }}>
                {margemPercentual.toFixed(1)}%
              </span>
              <span className="kpi-sub">Retorno sobre faturamento</span>
            </div>
          </div>

          <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
            <div className="panel-heading">
              <span>📊 Desempenho por Categoria no Período</span>
              <IconTag />
            </div>

            {listaDesempenhoCategorias.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>Nenhuma venda registrada no período selecionado.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th style={{ textAlign: 'center' }}>Peças Vendidas</th>
                      <th style={{ textAlign: 'right' }}>Total Custo (CMV)</th>
                      <th style={{ textAlign: 'right' }}>Total Faturado</th>
                      <th style={{ textAlign: 'right' }}>Lucro Bruto</th>
                      <th style={{ textAlign: 'center' }}>% do Negócio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaDesempenhoCategorias.map((item, idx) => {
                      const lucroCat = Math.max(0, item.faturamento - item.custo)
                      const share = totalGeralTodasCategorias > 0 ? (item.faturamento / totalGeralTodasCategorias) * 100 : 0
                      const selecionada = categoriaFiltro.toLowerCase() === item.categoria.toLowerCase()

                      return (
                        <tr key={idx} style={{ background: selecionada ? '#eff6ff' : 'transparent' }}>
                          <td>
                            <strong>{item.categoria}</strong>
                            {selecionada && <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#2563eb', fontWeight: 800 }}>● FILTRO ATIVO</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>{item.qtdPecas} un</td>
                          <td style={{ textAlign: 'right', color: '#64748b' }}>R$ {item.custo.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>R$ {item.faturamento.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>R$ {lucroCat.toFixed(2)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 800, color: share >= 30 ? '#2563eb' : '#64748b' }}>
                              {share.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="two-cols">
            <div className="card-panel">
              <div className="panel-heading">
                <span>🏆 Curva ABC: Mais Vendidos {categoriaFiltro !== 'todas' ? `(${categoriaFiltro})` : ''}</span>
                <IconTrendingUp />
              </div>

              {rankingProdutos.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>Nenhum produto encontrado no filtro ativo.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th style={{ textAlign: 'center' }}>Qtd</th>
                      <th style={{ textAlign: 'right' }}>Total Venda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingProdutos.map((prod, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>#{idx + 1} {prod.nome}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{prod.categoria}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{prod.qtd} un</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                          R$ {prod.faturamento.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card-panel">
              <div className="panel-heading">
                <span>⚠️ Alerta de Estoque Parado {categoriaFiltro !== 'todas' ? `(${categoriaFiltro})` : ''}</span>
                <div className="selector-dias">
                  <span>Sem giro há:</span>
                  <select value={diasCorteEstoque} onChange={e => setDiasCorteEstoque(Number(e.target.value))}>
                    <option value={30}>+30 dias</option>
                    <option value={45}>+45 dias</option>
                    <option value={60}>+60 dias</option>
                    <option value={90}>+90 dias</option>
                  </select>
                </div>
              </div>

              {produtosParados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>🎉</span>
                  <strong style={{ color: '#10b981', display: 'block' }}>Giro Saudável!</strong>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Nenhum produto com saldo sem vendas há mais de {diasCorteEstoque} dias.
                  </span>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Última Saída</th>
                      <th style={{ textAlign: 'center' }}>Parado há</th>
                      <th style={{ textAlign: 'center' }}>Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosParados.map(prod => (
                      <tr key={prod.id}>
                        <td>
                          <strong>{prod.nome}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{prod.categoria || 'Geral'}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{prod.dataUltimaAtividade}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge-warning">{prod.diasSemGiro} dias</span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          {prod.estoque} un
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card-panel">
            <div className="panel-heading">
              <span>🎯 Radar de Clientes Inativos com Cashback Parado</span>
              <IconUsers />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Clientes que não compram há mais de {diasCorteEstoque} dias mas ainda possuem bônus de cashback na sua loja. Use o WhatsApp para lembrá-los e trazê-los de volta!
            </p>

            {clientesInativosComSaldo.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                Nenhum cliente inativo com cashback no momento.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Telefone</th>
                      <th>Saldo de Cashback</th>
                      <th style={{ textAlign: 'center' }}>Ação Rápida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesInativosComSaldo.map(cli => (
                      <tr key={cli.id}>
                        <td><strong>{cli.nome}</strong></td>
                        <td>{cli.telefone || 'Sem fone'}</td>
                        <td><strong style={{ color: '#16a34a' }}>R$ {Number(cli.saldo_cashback).toFixed(2)}</strong></td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn-zap-mini"
                            onClick={() => convidarClienteWhatsApp(cli)}
                            title="Enviar convite de resgate no WhatsApp"
                          >
                            <IconWhatsApp /> Chamar no Zap
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
