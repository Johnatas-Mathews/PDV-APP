import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const IconTrendingUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)

const IconAlertTriangle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
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
  const [dadosEmpresa, setDadosEmpresa] = useState(null)
  
  // Filtros de Período
  const [periodoTipo, setPeriodoTipo] = useState('mes')
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return formatarDataInput(d)
  })
  const [dataFim, setDataFim] = useState(() => formatarDataInput(new Date()))

  // Filtro por Categoria
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')

  // Filtro de Sensibilidade de Estoque Parado
  const [diasCorteEstoque, setDiasCorteEstoque] = useState(45)

  const carregarDados = async () => {
    setLoading(true)
    try {
      const { data: vData } = await supabase.from('vendas').select('*, clientes(id, nome, telefone, saldo_cashback)').order('created_at', { ascending: false })
      const { data: pData } = await supabase.from('produtos').select('*').order('nome')
      const { data: cData } = await supabase.from('clientes').select('*').order('nome')
      const { data: cfgData } = await supabase.from('configuracoes').select('*')

      if (vData) setVendas(vData)
      if (pData) setProdutos(pData)
      if (cData) setClientes(cData)

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

  // Mapa rápido de ProdutoId -> Categoria
  const mapaCategoriasProdutos = {}
  produtos.forEach(p => {
    mapaCategoriasProdutos[p.id] = (p.categoria || 'Geral').trim()
  })

  // Lista única de categorias para o seletor
  const listaCategoriasDisponiveis = Array.from(
    new Set(produtos.map(p => (p.categoria || 'Geral').trim()).filter(Boolean))
  ).sort()

  // 1. Filtro temporal das vendas
  const vendasNoPeriodo = vendas.filter(v => {
    if (periodoTipo === 'todos') return true

    const dt = new Date(v.created_at)
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
  })

  // 2. Cálculo do DRE e Resumo por Categoria
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

      // Acúmulo por categoria para a tabela comparativa
      if (!desempenhoPorCategoria[catItem]) {
        desempenhoPorCategoria[catItem] = {
          categoria: catItem,
          faturamento: 0,
          custo: 0,
          qtdPecas: 0
        }
      }
      desempenhoPorCategoria[catItem].faturamento += subtotalItem
      desempenhoPorCategoria[catItem].custo += custoTotalItem
      desempenhoPorCategoria[catItem].qtdPecas += qtd

      // Se houver filtro de categoria ativo, computa apenas os itens da categoria escolhida
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

  // 3. Curva ABC (Produtos Mais Vendidos) respeitando o filtro de categoria
  const mapaProdutos = {}
  vendasNoPeriodo.forEach(v => {
    const itens = Array.isArray(v.itens) ? v.itens : []
    itens.forEach(item => {
      const catItem = mapaCategoriasProdutos[item.produtoId] || 'Geral'
      if (categoriaFiltro !== 'todas' && catItem.toLowerCase() !== categoriaFiltro.toLowerCase()) {
        return
      }

      const idProd = item.produtoId || item.nomeProduto
      if (!mapaProdutos[idProd]) {
        mapaProdutos[idProd] = {
          nome: item.nomeProduto,
          categoria: catItem,
          qtd: 0,
          faturamento: 0
        }
      }
      const qtd = Number(item.quantidade || 1)
      const preco = Number(item.preco || 0)
      mapaProdutos[idProd].qtd += qtd
      mapaProdutos[idProd].faturamento += (qtd * preco)
    })
  })

  const rankingProdutos = Object.values(mapaProdutos).sort((a, b) => b.faturamento - a.faturamento).slice(0, 8)

  // 4. Estoque Parado
  const dataLimiteParado = new Date()
  dataLimiteParado.setDate(dataLimiteParado.getDate() - diasCorteEstoque)
  dataLimiteParado.setHours(23, 59, 59, 999)

  const produtosParados = produtos.map(p => {
    if ((p.estoque || 0) <= 0) return null
    if (categoriaFiltro !== 'todas' && (p.categoria || 'Geral').toLowerCase() !== categoriaFiltro.toLowerCase()) {
      return null
    }

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

    if (!dataReferencia || dataReferencia >= dataLimiteParado) {
      return null
    }

    const diffTempo = Math.abs(new Date() - dataReferencia)
    const diasSemGiro = Math.floor(diffTempo / (1000 * 60 * 60 * 24))

    return {
      ...p,
      diasSemGiro,
      motivo,
      dataUltimaAtividade: dataReferencia.toLocaleDateString('pt-BR')
    }
  }).filter(Boolean).sort((a, b) => b.diasSemGiro - a.diasSemGiro).slice(0, 10)

  // Radar de Clientes Inativos com Saldo
  const clientesInativosComSaldo = clientes.filter(c => {
    const saldo = Number(c.saldo_cashback || 0)
    if (saldo <= 0.5) return false
    const ultimaVenda = vendas.find(v => v.cliente_id === c.id)
    if (!ultimaVenda) return true
    return new Date(ultimaVenda.created_at) < dataLimiteParado
  })

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

        .dre-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .dre-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .dre-title { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; }
        .dre-val { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 4px; display: block; }
        .dre-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

        .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .card-panel { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); box-sizing: border-box; }
        .panel-heading { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; }

        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 0.85rem 1rem; font-size: 0.88rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }

        .badge-warning { background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
        .btn-zap-mini { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
        .btn-zap-mini:hover { background: #bbf7d0; }

        .selector-dias { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600; color: #475569; }
        .selector-dias select { height: 28px; padding: 0 6px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; font-size: 0.78rem; font-weight: 700; color: #0f172a; }

        @media (max-width: 900px) {
          .dre-grid { grid-template-columns: 1fr 1fr; }
          .two-cols { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .dre-grid { grid-template-columns: 1fr; }
          .filter-row-top { flex-direction: column; align-items: stretch; }
          .custom-dates-bar { flex-direction: column; align-items: stretch; }
          .date-input-group { justify-content: space-between; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios Gerenciais</h1>
          <p className="page-subtitle">DRE, Margem Real, Vendas por Categoria e Giro de Estoque</p>
        </div>
      </div>

      {/* BARRA DE FILTROS (DATA + CATEGORIA) */}
      <div className="filter-container">
        <div className="filter-row-top">
          <div className="filter-periodo">
            <button className={`btn-p ${periodoTipo === 'hoje' ? 'active' : ''}`} onClick={() => setPeriodoTipo('hoje')}>Hoje</button>
            <button className={`btn-p ${periodoTipo === '7dias' ? 'active' : ''}`} onClick={() => setPeriodoTipo('7dias')}>Últimos 7 Dias</button>
            <button className={`btn-p ${periodoTipo === 'mes' ? 'active' : ''}`} onClick={() => setPeriodoTipo('mes')}>Mês Atual</button>
            <button className={`btn-p ${periodoTipo === 'todos' ? 'active' : ''}`} onClick={() => setPeriodoTipo('todos')}>Todo o Período</button>
            <button className={`btn-p ${periodoTipo === 'custom' ? 'active' : ''}`} onClick={() => setPeriodoTipo('custom')}>📅 Intervalo (De ➔ Até)</button>
          </div>

          {/* SELETOR DE CATEGORIA */}
          <div className="category-select-box">
            <label>Filtrar Categoria:</label>
            <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}>
              <option value="todas">Todas as Categorias</option>
              {listaCategoriasDisponiveis.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
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
              ✓ De {new Date(`${dataInicio}T12:00:00`).toLocaleDateString('pt-BR')} até {new Date(`${dataFim}T12:00:00`).toLocaleDateString('pt-BR')} {categoriaFiltro !== 'todas' ? `• Categoria: ${categoriaFiltro}` : ''}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Processando inteligência de negócio...</p>
      ) : (
        <>
          {/* CARDS DRE / LUCRATIVIDADE CALIBRADOS */}
          <div className="dre-grid">
            <div className="dre-card">
              <span className="dre-title">Faturamento {categoriaFiltro !== 'todas' ? `(${categoriaFiltro})` : 'Líquido'}</span>
              <span className="dre-val" style={{ color: '#2563eb' }}>R$ {receitaTotal.toFixed(2)}</span>
              <span className="dre-sub">{qtdItensTotal} unidades vendidas</span>
            </div>

            <div className="dre-card">
              <span className="dre-title">Custo das Peças (CMV)</span>
              <span className="dre-val" style={{ color: '#64748b' }}>R$ {custoTotal.toFixed(2)}</span>
              <span className="dre-sub">Baseado no preço de custo</span>
            </div>

            <div className="dre-card">
              <span className="dre-title">Lucro Bruto Real</span>
              <span className="dre-val" style={{ color: '#10b981' }}>R$ {lucroBruto.toFixed(2)}</span>
              <span className="dre-sub">Faturamento - Custo</span>
            </div>

            <div className="dre-card">
              <span className="dre-title">Margem de Lucro</span>
              <span className="dre-val" style={{ color: margemPercentual >= 40 ? '#10b981' : '#f59e0b' }}>
                {margemPercentual.toFixed(1)}%
              </span>
              <span className="dre-sub">Retorno sobre faturamento</span>
            </div>
          </div>

          {/* TABELA: DESEMPENHO POR CATEGORIA */}
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
            {/* CURVA ABC (PRODUTOS MAIS VENDIDOS) */}
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

            {/* ALERTA DE ESTOQUE PARADO */}
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

          {/* RADAR DE CLIENTES INATIVOS COM CASHBACK */}
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
