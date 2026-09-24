import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

const IconPrinter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)

export default function Estoque() {
  const { operador } = useAuth()
  const [loading, setLoading] = useState(true)
  const [produtos, setProdutos] = useState([])
  const [variacoes, setVariacoes] = useState([])
  const [movimentacoes, setMovimentacoes] = useState([])
  const [busca, setBusca] = useState('')
  const [abaAtiva, setAbaAtiva] = useState('catalogo')

  // Modal de Ajuste de Saldo
  const [modalAberto, setModalAberto] = useState(false)
  const [itemSelecionado, setItemSelecionado] = useState(null)
  const [tipoOperacao, setTipoOperacao] = useState('entrada')
  const [quantidadeAjuste, setQuantidadeAjuste] = useState('')
  const [motivo, setMotivo] = useState('Ajuste de Balanço / Inventário')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregarDados = async () => {
    setLoading(true)
    try {
      const { data: pData } = await supabase.from('produtos').select('*').order('nome')
      const { data: vData } = await supabase.from('variacoes_grade').select('*')
      const { data: mData } = await supabase
        .from('estoque_movimentacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (pData) setProdutos(pData)
      if (vData) setVariacoes(vData)
      if (mData) setMovimentacoes(mData)
    } catch (err) {
      console.error('Erro ao carregar estoque:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Métricas do Patrimônio
  let totalPecas = 0
  let custoImobilizado = 0
  let potencialVenda = 0
  let itensCriticos = 0

  produtos.forEach(p => {
    const vars = variacoes.filter(v => v.produto_id === p.id)
    const precoVenda = Number(p.preco || 0)
    const precoCusto = Number(p.preco_custo || 0)

    if (vars.length > 0) {
      vars.forEach(v => {
        const est = Number(v.estoque || 0)
        totalPecas += est
        custoImobilizado += est * precoCusto
        potencialVenda += est * precoVenda
        if (est <= 1) itensCriticos += 1
      })
    } else {
      const est = Number(p.estoque || 0)
      totalPecas += est
      custoImobilizado += est * precoCusto
      potencialVenda += est * precoVenda
      if (est <= 1) itensCriticos += 1
    }
  })

  const abrirAjuste = (item) => {
    setItemSelecionado(item)
    setTipoOperacao('entrada')
    setQuantidadeAjuste('')
    setMotivo('Ajuste de Balanço / Inventário')
    setObservacao('')
    setModalAberto(true)
  }

  const confirmarAjuste = async (e) => {
    e.preventDefault()
    if (!itemSelecionado) return

    const qtd = parseInt(quantidadeAjuste)
    if (isNaN(qtd) || qtd <= 0) {
      return alert('Informe uma quantidade válida e positiva.')
    }

    const estAtual = Number(itemSelecionado.estoqueAtual || 0)
    let novoEstoque = estAtual

    if (tipoOperacao === 'entrada') {
      novoEstoque = estAtual + qtd
    } else if (tipoOperacao === 'saida') {
      if (qtd > estAtual) {
        return alert(`A quantidade de saída (${qtd}) não pode ser maior que o saldo em estoque (${estAtual})!`)
      }
      novoEstoque = estAtual - qtd
    } else if (tipoOperacao === 'balanco') {
      novoEstoque = qtd
    }

    setSalvando(true)
    try {
      if (itemSelecionado.tipo === 'variacao') {
        const { error } = await supabase
          .from('variacoes_grade')
          .update({ estoque: novoEstoque })
          .eq('id', itemSelecionado.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('produtos')
          .update({ estoque: novoEstoque })
          .eq('id', itemSelecionado.id)
        if (error) throw error
      }

      try {
        await supabase.from('estoque_movimentacoes').insert([{
          produto_id: itemSelecionado.produtoId,
          variacao_id: itemSelecionado.tipo === 'variacao' ? itemSelecionado.id : null,
          tipo: tipoOperacao,
          quantidade: qtd,
          estoque_anterior: estAtual,
          estoque_novo: novoEstoque,
          motivo: `${motivo}${observacao ? ` - ${observacao}` : ''}`,
          usuario_nome: operador?.nome || 'Admin'
        }])
      } catch (logErr) {
        console.warn('Registro de log ignorado:', logErr)
      }

      alert(`Estoque de "${itemSelecionado.nome}" atualizado para ${novoEstoque} un!`)
      setModalAberto(false)
      await carregarDados()
    } catch (err) {
      alert('Erro ao atualizar estoque: ' + err.message)
    }
    setSalvando(false)
  }

  // Lista linear de itens para a tabela e para a impressão do inventário
  const listaItensInventario = []
  produtos.forEach(prod => {
    const vars = variacoes.filter(v => v.produto_id === prod.id)
    if (vars.length > 0) {
      vars.forEach(v => {
        listaItensInventario.push({
          id: `v-${v.id}`,
          rawId: v.id,
          produtoId: prod.id,
          tipo: 'variacao',
          nome: prod.nome,
          grade: [v.tamanho, v.cor].filter(Boolean).join(' / ') || 'Variação',
          codigo: prod.codigo_barras || '-',
          precoCusto: Number(prod.preco_custo || 0),
          precoVenda: Number(prod.preco || 0),
          estoque: Number(v.estoque || 0)
        })
      })
    } else {
      listaItensInventario.push({
        id: `p-${prod.id}`,
        rawId: prod.id,
        produtoId: prod.id,
        tipo: 'produto',
        nome: prod.nome,
        grade: '-',
        codigo: prod.codigo_barras || '-',
        precoCusto: Number(prod.preco_custo || 0),
        precoVenda: Number(prod.preco || 0),
        estoque: Number(prod.estoque || 0)
      })
    }
  })

  // Filtro de Busca
  const itensFiltrados = listaItensInventario.filter(item => {
    const t = busca.toLowerCase()
    return item.nome.toLowerCase().includes(t) || item.codigo.toLowerCase().includes(t)
  })

  const acionarImpressao = () => {
    window.print()
  }

  return (
    <div className="est-wrapper">
      <style>{`
        .est-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .kpi-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .kpi-title { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; }
        .kpi-val { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 4px; display: block; }
        .kpi-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

        .card-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .tabs-nav { display: flex; gap: 8px; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.25rem; }
        .tab-btn { padding: 8px 16px; border: none; background: transparent; font-size: 0.88rem; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }

        .search-box { height: 40px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0 12px; font-size: 0.9rem; width: 280px; outline: none; }
        .search-box:focus { border-color: #2563eb; }

        .btn-print {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-print:hover { background: #f8fafc; border-color: #2563eb; color: #2563eb; }

        .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 720px; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 0.85rem 1rem; font-size: 0.88rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }

        .badge-status { padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
        .badge-ok { background: #dcfce7; color: #15803d; }
        .badge-critico { background: #fee2e2; color: #dc2626; }

        .btn-ajustar { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
        .btn-ajustar:hover { background: #dbeafe; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 1rem; }
        .modal-card { background: #ffffff; width: 100%; max-width: 460px; border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .form-group-modal { display: flex; flex-direction: column; margin-bottom: 1rem; }
        .form-group-modal label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; }
        .form-group-modal input, .form-group-modal select { height: 40px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 10px; font-size: 0.92rem; }

        /* CABEÇALHO EXCLUSIVO PARA O PAPEL IMPRESSO */
        .print-only-header { display: none; }

        /* ESTILOS DE IMPRESSÃO (A4 / PAPEL) */
        @media print {
          body * { visibility: hidden; }
          .est-wrapper, .est-wrapper * { visibility: visible; }
          .est-wrapper { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          
          /* Oculta tudo que não faz parte da folha de contagem */
          .page-header, .kpi-grid, .tabs-nav, .search-box, .btn-print, .btn-ajustar, .modal-overlay, th:last-child, td:last-child {
            display: none !important;
          }

          .card-box { border: none !important; box-shadow: none !important; padding: 0 !important; }
          
          .print-only-header {
            display: block !important;
            margin-bottom: 1.25rem;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 0.75rem;
          }
          .print-title { font-size: 1.4rem; font-weight: 800; color: #000; margin: 0; }
          .print-meta { font-size: 0.8rem; color: #333; margin-top: 4px; display: flex; justify-content: space-between; }

          table { min-width: 100% !important; font-size: 0.82rem !important; border: 1px solid #000 !important; }
          th { background: #f1f5f9 !important; color: #000 !important; border: 1px solid #000 !important; padding: 6px !important; }
          td { border: 1px solid #000 !important; padding: 6px !important; color: #000 !important; }

          .col-contagem {
            display: table-cell !important;
            width: 120px !important;
            text-align: center !important;
          }
        }

        .col-contagem { display: none; }

        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns: 1fr; }
          .search-box { width: 100%; }
        }
      `}</style>

      {/* CABEÇALHO QUE SÓ APARECE NA FOLHA IMPRESSA */}
      <div className="print-only-header">
        <h1 className="print-title">📋 Folha de Contagem & Conferência de Estoque</h1>
        <div className="print-meta">
          <span>Emitido em: {new Date().toLocaleString('pt-BR')} • Operador: {operador?.nome || 'Admin'}</span>
          <span>Total de Itens Listados: {itensFiltrados.length}</span>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Gestão de Estoque</h1>
          <p className="page-subtitle">Acompanhamento de patrimônio, inventário e ajustes com rastreabilidade</p>
        </div>

        <button type="button" className="btn-print" onClick={acionarImpressao}>
          <IconPrinter /> Imprimir Folha de Contagem
        </button>
      </div>

      {/* CARDS DE PATRIMÔNIO */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-title">Total de Peças em Loja</span>
          <span className="kpi-val" style={{ color: '#2563eb' }}>{totalPecas} un</span>
          <span className="kpi-sub">Físico em araras e depósito</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Capital a Custo (CMV)</span>
          <span className="kpi-val" style={{ color: '#64748b' }}>R$ {custoImobilizado.toFixed(2)}</span>
          <span className="kpi-sub">Total pago pelas peças</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Potencial de Faturamento</span>
          <span className="kpi-val" style={{ color: '#16a34a' }}>R$ {potencialVenda.toFixed(2)}</span>
          <span className="kpi-sub">Preço de venda nas etiquetas</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Itens Críticos / Esgotados</span>
          <span className="kpi-val" style={{ color: itensCriticos > 0 ? '#dc2626' : '#16a34a' }}>{itensCriticos}</span>
          <span className="kpi-sub">Peças com saldo ≤ 1 un</span>
        </div>
      </div>

      <div className="card-box">
        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
          <div className="tabs-nav" style={{ marginBottom: 0 }}>
            <button className={`tab-btn ${abaAtiva === 'catalogo' ? 'active' : ''}`} onClick={() => setAbaAtiva('catalogo')}>
              📋 Catálogo & Saldos Físicos ({itensFiltrados.length})
            </button>
            <button className={`tab-btn ${abaAtiva === 'historico' ? 'active' : ''}`} onClick={() => setAbaAtiva('historico')}>
              🕒 Histórico de Movimentações ({movimentacoes.length})
            </button>
          </div>

          {abaAtiva === 'catalogo' && (
            <input 
              type="text" 
              className="search-box" 
              placeholder="Buscar por nome ou código..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          )}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Carregando dados de estoque...</p>
        ) : abaAtiva === 'catalogo' ? (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Grade (Tam/Cor)</th>
                  <th>Preço Custo</th>
                  <th>Preço Venda</th>
                  <th style={{ textAlign: 'center' }}>Saldo Sistema</th>
                  <th className="col-contagem">Contagem Física</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>{item.codigo}</td>
                    <td><strong>{item.nome}</strong></td>
                    <td>{item.grade}</td>
                    <td>R$ {item.precoCusto.toFixed(2)}</td>
                    <td>R$ {item.precoVenda.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1rem' }}>
                      {item.estoque} un
                    </td>
                    <td className="col-contagem" style={{ textAlign: 'center' }}>
                      [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]
                    </td>
                    <td>
                      <span className={`badge-status ${item.estoque <= 1 ? 'badge-critico' : 'badge-ok'}`}>
                        {item.estoque === 0 ? 'Esgotado' : item.estoque <= 1 ? 'Crítico' : 'Normal'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-ajustar"
                        onClick={() => abrirAjuste({
                          tipo: item.tipo,
                          id: item.rawId,
                          produtoId: item.produtoId,
                          nome: `${item.nome} ${item.grade !== '-' ? `(${item.grade})` : ''}`,
                          estoqueAtual: item.estoque
                        })}
                      >
                        ⚡ Ajustar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-responsive">
            {movimentacoes.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Nenhuma movimentação manual registrada ainda.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Data & Hora</th>
                    <th>Operação</th>
                    <th>Qtd</th>
                    <th>Saldo Anterior ➔ Novo</th>
                    <th>Motivo / Observação</th>
                    <th>Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.map(m => (
                    <tr key={m.id}>
                      <td>{new Date(m.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td>
                        <strong style={{ color: m.tipo === 'entrada' ? '#16a34a' : m.tipo === 'saida' ? '#dc2626' : '#2563eb' }}>
                          {m.tipo === 'entrada' ? '+ Entrada' : m.tipo === 'saida' ? '- Saída' : '⚡ Balanço'}
                        </strong>
                      </td>
                      <td><strong>{m.quantidade} un</strong></td>
                      <td>{m.estoque_anterior} un ➔ <strong>{m.estoque_novo} un</strong></td>
                      <td>{m.motivo || '-'}</td>
                      <td><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.usuario_nome || 'Admin'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE AJUSTE MANUAL */}
      {modalAberto && itemSelecionado && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>Ajustar Estoque</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{itemSelecionado.nome}</span>
              </div>
              <button onClick={() => setModalAberto(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
              Saldo Físico Atual: <strong>{itemSelecionado.estoqueAtual} un</strong>
            </div>

            <form onSubmit={confirmarAjuste}>
              <div className="form-group-modal">
                <label>Tipo de Ajuste</label>
                <select value={tipoOperacao} onChange={e => setTipoOperacao(e.target.value)}>
                  <option value="entrada">+ Entrada de Peças (Sobra / Ajuste)</option>
                  <option value="saida">- Saída de Peças (Avaria / Perda / Uso)</option>
                  <option value="balanco">= Definir Saldo Contado Exato (Balanço)</option>
                </select>
              </div>

              <div className="form-group-modal">
                <label>{tipoOperacao === 'balanco' ? 'Quantidade Contada Fielmente' : 'Quantidade a Movimentar'}</label>
                <input 
                  type="number" 
                  min="1" 
                  placeholder="Ex: 2" 
                  value={quantidadeAjuste}
                  onChange={e => setQuantidadeAjuste(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group-modal">
                <label>Motivo</label>
                <select value={motivo} onChange={e => setMotivo(e.target.value)}>
                  <option value="Ajuste de Balanço / Inventário">Ajuste de Balanço / Inventário</option>
                  <option value="Avaria / Defeito no Tecido/Zíper">Avaria / Defeito no Tecido/Zíper</option>
                  <option value="Uso Próprio / Mostruário / Vitrine">Uso Próprio / Mostruário / Vitrine</option>
                  <option value="Perda / Extravio">Perda / Extravio</option>
                  <option value="Brinde / Parceria / Influencer">Brinde / Parceria / Influencer</option>
                  <option value="Outro">Outro Motivo</option>
                </select>
              </div>

              <div className="form-group-modal">
                <label>Observação Adicional (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Peça manchada no transporte"
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalAberto(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  {salvando ? 'Salvando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
