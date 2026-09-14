import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Ícones SVG minimalistas
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
)

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

const IconTag = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <circle cx="7" cy="7" r=".5" fill="currentColor" />
  </svg>
)

const IconBarcode = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" />
  </svg>
)

const IconLayers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
)

const IconZap = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const gerarCodigoEAN13 = () => {
  const prefixo = '20'
  const randomParte = String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 90 + 10))
  const base12 = (prefixo + randomParte).slice(0, 12)

  let soma = 0
  for (let i = 0; i < 12; i++) {
    const digito = parseInt(base12[i], 10)
    soma += (i % 2 === 0) ? digito * 1 : digito * 3
  }
  const digitoVerificador = (10 - (soma % 10)) % 10

  return base12 + digitoVerificador
}

const GRADES_PREDEFINIDAS = {
  vestuario: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  calcados: ['34', '35', '36', '37', '38', '39', '40', '41', '42', '44'],
  perfumaria: ['30ml', '50ml', '100ml', '200ml']
}

const CORES_COMUNS = [
  'Preto', 'Branco', 'Cinza', 'Azul Marinho', 'Nude', 'Off White', 'Vermelho', 'Verde Militar', 'Bege', 'Rosa'
]

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [variacoes, setVariacoes] = useState([])
  const [categoriasExistentes, setCategoriasExistentes] = useState([])
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [busca, setBusca] = useState('')

  // Formulário Produto
  const [idEditando, setIdEditando] = useState(null)
  const [nome, setNome] = useState('')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [categoria, setCategoria] = useState('')
  const [preco, setPreco] = useState('')
  const [precoCusto, setPrecoCusto] = useState('')
  const [estoque, setEstoque] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Modal Grade
  const [modalGradeAberto, setModalGradeAberto] = useState(false)
  const [produtoGradeSel, setProdutoGradeSel] = useState(null)
  const [variacoesDoProd, setVariacoesDoProd] = useState([])

  // Matriz
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState([])
  const [coresSelecionadas, setCoresSelecionadas] = useState([])
  const [customTamInput, setCustomTamInput] = useState('')
  const [customCorInput, setCustomCorInput] = useState('')
  const [estoquePadraoMatriz, setEstoquePadraoMatriz] = useState('1')
  const [gerandoMatriz, setGerandoMatriz] = useState(false)

  const carregarDados = async () => {
    const { data: prodData } = await supabase.from('produtos').select('*').order('nome', { ascending: true })
    const { data: varData } = await supabase.from('variacoes_grade').select('*')

    if (prodData) {
      setProdutos(prodData)
      const catsUnicas = Array.from(new Set(prodData.map(p => (p.categoria ? p.categoria.trim() : 'Geral')).filter(Boolean))).sort()
      setCategoriasExistentes(catsUnicas)
    }
    if (varData) setVariacoes(varData)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const limparFormulario = () => {
    setIdEditando(null)
    setNome('')
    setCodigoBarras('')
    setCategoria('')
    setPreco('')
    setPrecoCusto('')
    setEstoque('')
  }

  const iniciarEdicao = (prod) => {
    setIdEditando(prod.id)
    setNome(prod.nome || '')
    setCodigoBarras(prod.codigo_barras || '')
    setCategoria(prod.categoria || 'Geral')
    setPreco(prod.preco ? String(prod.preco) : '')
    setPrecoCusto(prod.preco_custo ? String(prod.preco_custo) : '')
    setEstoque(prod.estoque !== null ? String(prod.estoque) : '0')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salvarProduto = async (e) => {
    e.preventDefault()
    if (!nome.trim() || !preco) return alert('Preencha Nome e Preço de Venda.')

    setSalvando(true)
    const payload = {
      nome: nome.trim(),
      codigo_barras: codigoBarras.trim() || null,
      categoria: categoria.trim() || 'Geral',
      preco: parseFloat(String(preco).replace(',', '.')) || 0,
      preco_custo: precoCusto ? parseFloat(String(precoCusto).replace(',', '.')) : 0,
      estoque: parseInt(estoque) || 0
    }

    try {
      if (idEditando) {
        const { error } = await supabase.from('produtos').update(payload).eq('id', idEditando)
        if (error) throw error
        alert('Produto atualizado com sucesso!')
      } else {
        const { error } = await supabase.from('produtos').insert([payload])
        if (error) throw error
        alert('Produto cadastrado com sucesso!')
      }
      limparFormulario()
      await carregarDados()
    } catch (err) {
      alert('Erro ao salvar produto: ' + err.message)
    }
    setSalvando(false)
  }

  const excluirProduto = async (id, nomeProd) => {
    if (!confirm(`Deseja realmente excluir o produto "${nomeProd}"?`)) return
    const { error } = await supabase.from('produtos').delete().eq('id', id)
    if (error) alert('Erro ao excluir: ' + error.message)
    else carregarDados()
  }

  const abrirGrade = (prod) => {
    setProdutoGradeSel(prod)
    const vars = variacoes.filter(v => v.produto_id === prod.id)
    setVariacoesDoProd(vars)
    setTamanhosSelecionados([])
    setCoresSelecionadas([])
    setCustomTamInput('')
    setCustomCorInput('')
    setEstoquePadraoMatriz('1')
    setModalGradeAberto(true)
  }

  const toggleTamanho = (tam) => {
    setTamanhosSelecionados(prev => 
      prev.includes(tam) ? prev.filter(t => t !== tam) : [...prev, tam]
    )
  }

  const toggleCor = (cor) => {
    setCoresSelecionadas(prev => 
      prev.includes(cor) ? prev.filter(c => c !== cor) : [...prev, cor]
    )
  }

  const aplicarPredefinicaoTamanho = (tipo) => {
    const lista = GRADES_PREDEFINIDAS[tipo] || []
    setTamanhosSelecionados(lista)
  }

  const adicionarTamanhoCustom = () => {
    if (!customTamInput.trim()) return
    const tamUpper = customTamInput.trim().toUpperCase()
    if (!tamanhosSelecionados.includes(tamUpper)) {
      setTamanhosSelecionados([...tamanhosSelecionados, tamUpper])
    }
    setCustomTamInput('')
  }

  const adicionarCorCustom = () => {
    if (!customCorInput.trim()) return
    const corFormat = customCorInput.trim()
    if (!coresSelecionadas.includes(corFormat)) {
      setCoresSelecionadas([...coresSelecionadas, corFormat])
    }
    setCustomCorInput('')
  }

  const gerarMatrizCombinacoes = async () => {
    if (tamanhosSelecionados.length === 0 && coresSelecionadas.length === 0) {
      return alert('Selecione pelo menos um Tamanho ou uma Cor para gerar a grade.')
    }

    const tams = tamanhosSelecionados.length > 0 ? tamanhosSelecionados : [null]
    const cors = coresSelecionadas.length > 0 ? coresSelecionadas : [null]
    const qtdPadrao = parseInt(estoquePadraoMatriz) || 0

    const novasLinhas = []
    tams.forEach(tam => {
      cors.forEach(cor => {
        const jaExiste = variacoesDoProd.some(v => 
          (v.tamanho || null) === (tam || null) && (v.cor || null) === (cor || null)
        )

        if (!jaExiste) {
          novasLinhas.push({
            produto_id: produtoGradeSel.id,
            tamanho: tam,
            cor: cor,
            estoque: qtdPadrao,
            codigo_barras: gerarCodigoEAN13()
          })
        }
      })
    })

    if (novasLinhas.length === 0) {
      return alert('Todas as combinações selecionadas já existem cadastradas para este produto!')
    }

    setGerandoMatriz(true)
    try {
      const { data, error } = await supabase.from('variacoes_grade').insert(novasLinhas).select()
      if (error) throw error

      const listaAtualizada = [...variacoesDoProd, ...data]
      setVariacoesDoProd(listaAtualizada)

      const somaEstoqueGrade = listaAtualizada.reduce((s, v) => s + (v.estoque || 0), 0)
      await supabase.from('produtos').update({ estoque: somaEstoqueGrade }).eq('id', produtoGradeSel.id)

      alert(`✅ ${novasLinhas.length} variações geradas com sucesso!`)
      setTamanhosSelecionados([])
      setCoresSelecionadas([])
      await carregarDados()
    } catch (err) {
      alert('Erro ao gerar variações: ' + err.message)
    }
    setGerandoMatriz(false)
  }

  const excluirVariacao = async (idVar) => {
    if (!confirm('Deseja remover esta variação?')) return
    try {
      const { error } = await supabase.from('variacoes_grade').delete().eq('id', idVar)
      if (error) throw error

      const listaAtualizada = variacoesDoProd.filter(v => v.id !== idVar)
      setVariacoesDoProd(listaAtualizada)

      const somaEstoqueGrade = listaAtualizada.reduce((s, v) => s + (v.estoque || 0), 0)
      await supabase.from('produtos').update({ estoque: somaEstoqueGrade }).eq('id', produtoGradeSel.id)

      await carregarDados()
    } catch (err) {
      alert('Erro ao remover: ' + err.message)
    }
  }

  const atualizarEstoqueRapidoVar = async (idVar, novoEstoque) => {
    const qtd = parseInt(novoEstoque) || 0
    const { error } = await supabase.from('variacoes_grade').update({ estoque: qtd }).eq('id', idVar)
    if (!error) {
      const lista = variacoesDoProd.map(v => v.id === idVar ? { ...v, estoque: qtd } : v)
      setVariacoesDoProd(lista)
      const soma = lista.reduce((s, v) => s + (v.estoque || 0), 0)
      await supabase.from('produtos').update({ estoque: soma }).eq('id', produtoGradeSel.id)
      await carregarDados()
    }
  }

  const regenerarCodigoVar = async (idVar) => {
    const novoCode = gerarCodigoEAN13()
    const { error } = await supabase.from('variacoes_grade').update({ codigo_barras: novoCode }).eq('id', idVar)
    if (!error) {
      setVariacoesDoProd(variacoesDoProd.map(v => v.id === idVar ? { ...v, codigo_barras: novoCode } : v))
      await carregarDados()
    }
  }

  const produtosFiltrados = produtos.filter(p => {
    const termo = busca.toLowerCase()
    const atendeBusca = p.nome.toLowerCase().includes(termo) || (p.codigo_barras && p.codigo_barras.includes(termo))
    const catProd = (p.categoria || 'Geral').toLowerCase()
    const atendeCategoria = categoriaFiltro === 'todas' || catProd === categoriaFiltro.toLowerCase()
    return atendeBusca && atendeCategoria
  })

  return (
    <div className="prod-wrapper">
      <style>{`
        .prod-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
        
        /* CARD BRANCO COM BORDA SEGURA */
        .card-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          margin-bottom: 1.5rem;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden; /* Garante que nada vaze */
        }
        .card-box h2 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem; }

        /* GRID FLUIDO DO FORMULÁRIO (Substitui o flex que quebrava) */
        .form-grid-top {
          display: grid;
          grid-template-columns: 2fr 1.3fr 1.3fr;
          gap: 1rem;
          margin-bottom: 1rem;
          width: 100%;
          box-sizing: border-box;
        }

        .form-grid-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
          width: 100%;
          box-sizing: border-box;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          width: 100%;
          box-sizing: border-box;
          min-width: 0; /* Previne transbordo no grid */
        }
        .form-group label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .form-group input, .form-group select {
          height: 42px;
          padding: 0 0.85rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          color: #0f172a;
          font-size: 0.95rem;
          width: 100%;
          box-sizing: border-box;
        }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #2563eb; }
        
        .input-with-action { display: flex; gap: 6px; width: 100%; box-sizing: border-box; }
        .input-with-action input { flex: 1; min-width: 0; }
        .btn-gerar-code { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 10px; font-size: 0.78rem; font-weight: 700; color: #1e293b; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: all 0.15s; }
        .btn-gerar-code:hover { background: #e2e8f0; color: #0f172a; border-color: #94a3b8; }

        .chips-container { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; max-width: 100%; }
        .chip-cat { font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; cursor: pointer; }
        .chip-cat.selected { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; font-weight: 600; }

        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; padding: 0.65rem 1.25rem; font-size: 0.9rem; transition: all 0.15s ease; white-space: nowrap; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-grade { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .btn-grade:hover { background: #dcfce7; }
        .btn-sm { padding: 0.45rem 0.65rem; font-size: 0.8rem; border-radius: 6px; min-height: 32px; }

        .filter-section { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .search-input { height: 40px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 12px; font-size: 0.9rem; width: 280px; }
        .cat-pills { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; max-width: 100%; -webkit-overflow-scrolling: touch; }
        .pill { padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; color: #64748b; font-size: 0.82rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .pill.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }

        .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 680px; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        td { padding: 0.85rem 1rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }
        
        .col-acoes { text-align: center; white-space: nowrap; min-width: 180px; }
        .acoes-group { display: inline-flex; align-items: center; gap: 6px; }

        .badge-cat { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: #f1f5f9; color: #334155; font-size: 0.78rem; font-weight: 600; }
        .barcode-tag { display: inline-flex; align-items: center; gap: 4px; font-family: monospace; font-size: 0.75rem; color: #64748b; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0; margin-top: 3px; }
        .var-chip { display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px 6px; font-size: 0.75rem; margin: 2px; }

        /* Modal Grade */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 0.75rem; }
        .modal-card { background: #ffffff; width: 100%; max-width: 780px; max-height: 94vh; overflow-y: auto; border-radius: 16px; padding: 1.25rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); box-sizing: border-box; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem; }
        .modal-title { font-size: 1.15rem; font-weight: 700; color: #0f172a; }

        .matriz-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.1rem; margin-bottom: 1.25rem; }
        .matriz-section-title { font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }
        .presets-bar { display: flex; gap: 6px; flex-wrap: wrap; }
        .btn-preset { font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-weight: 600; cursor: pointer; }
        .btn-preset:hover { background: #f1f5f9; border-color: #94a3b8; }

        .chips-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
        .chip-selectable { padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; font-size: 0.85rem; font-weight: 600; color: #334155; cursor: pointer; transition: all 0.1s; }
        .chip-selectable.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }

        /* RESPONSIVIDADE REAL (TELAS MENORES E CELULARES) */
        @media (max-width: 900px) {
          .form-grid-top { grid-template-columns: 1fr 1fr; }
          .form-grid-bottom { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 640px) {
          .card-box { padding: 1.1rem; }
          .form-grid-top { grid-template-columns: 1fr; gap: 0.75rem; }
          .form-grid-bottom { grid-template-columns: 1fr; gap: 0.75rem; }
          .search-input { width: 100%; }
          .filter-section { flex-direction: column; align-items: stretch; }
          .modal-card { padding: 1rem; }
          .col-acoes { min-width: 130px; }
          .acoes-group { flex-direction: column; width: 100%; gap: 4px; }
          .acoes-group button { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Catálogo de Produtos</h1>
        <p className="page-subtitle">Cadastre modelos, gere códigos de barras e gerencie grades de tamanhos e cores</p>
      </div>

      <div className="card-box">
        <h2>{idEditando ? 'Editar Produto' : 'Novo Produto (Modelo Base)'}</h2>
        <form onSubmit={salvarProduto}>
          
          {/* LINHA SUPERIOR DO FORMULÁRIO (GRID RESPONSIVO) */}
          <div className="form-grid-top">
            <div className="form-group">
              <label>Nome do Produto / Modelo</label>
              <input 
                type="text" 
                placeholder="Ex: Camisa Polo Piquet"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Código de Barras (EAN-13)</label>
              <div className="input-with-action">
                <input 
                  type="text" 
                  placeholder="Ex: 789... ou gere ao lado"
                  value={codigoBarras}
                  onChange={e => setCodigoBarras(e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn-gerar-code"
                  onClick={() => setCodigoBarras(gerarCodigoEAN13())}
                  title="Gerar código de barras EAN-13 válido"
                >
                  <IconZap /> Gerar
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Categoria</label>
              <input 
                type="text" 
                list="lista-categorias"
                placeholder="Ex: Roupas, Perfumes"
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
              />
              <datalist id="lista-categorias">
                {categoriasExistentes.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>

              {categoriasExistentes.length > 0 && (
                <div className="chips-container">
                  {categoriasExistentes.map(cat => (
                    <button
                      type="button"
                      key={cat}
                      className={`chip-cat ${categoria.toLowerCase() === cat.toLowerCase() ? 'selected' : ''}`}
                      onClick={() => setCategoria(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LINHA INFERIOR DO FORMULÁRIO (GRID RESPONSIVO) */}
          <div className="form-grid-bottom">
            <div className="form-group">
              <label>Preço de Venda (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0,00"
                value={preco}
                onChange={e => setPreco(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Preço de Custo (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0,00"
                value={precoCusto}
                onChange={e => setPrecoCusto(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Estoque Inicial (Sem Grade)</label>
              <input 
                type="number" 
                placeholder="0"
                value={estoque}
                onChange={e => setEstoque(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={salvando} style={{ gap: '6px' }}>
              <IconPlus /> {salvando ? 'Salvando...' : (idEditando ? 'Salvar Alterações' : 'Cadastrar Produto')}
            </button>
            {idEditando && (
              <button type="button" className="btn btn-secondary" onClick={limparFormulario}>
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card-box">
        <div className="filter-section">
          <div className="cat-pills">
            <button 
              className={`pill ${categoriaFiltro === 'todas' ? 'active' : ''}`}
              onClick={() => setCategoriaFiltro('todas')}
            >
              Todas ({produtos.length})
            </button>
            {categoriasExistentes.map(cat => {
              const qtd = produtos.filter(p => (p.categoria || 'Geral').toLowerCase() === cat.toLowerCase()).length
              return (
                <button 
                  key={cat}
                  className={`pill ${categoriaFiltro.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setCategoriaFiltro(cat)}
                >
                  {cat} ({qtd})
                </button>
              )
            })}
          </div>

          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar por nome ou código de barras..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {produtosFiltrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
            Nenhum produto encontrado.
          </p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Produto / Grade</th>
                  <th>Categoria</th>
                  <th>Custo</th>
                  <th>Venda</th>
                  <th>Estoque Total</th>
                  <th className="col-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map(prod => {
                  const venda = Number(prod.preco || 0)
                  const custo = Number(prod.preco_custo || 0)
                  const varsDesteProd = variacoes.filter(v => v.produto_id === prod.id)
                  const temGrade = varsDesteProd.length > 0

                  return (
                    <tr key={prod.id}>
                      <td>
                        <div><strong>{prod.nome}</strong></div>
                        {prod.codigo_barras && (
                          <span className="barcode-tag">
                            <IconBarcode /> {prod.codigo_barras}
                          </span>
                        )}

                        {temGrade && (
                          <div style={{ marginTop: '4px' }}>
                            {varsDesteProd.map(v => (
                              <span key={v.id} className="var-chip">
                                <strong>{v.tamanho || 'U'}</strong>{v.cor ? ` (${v.cor})` : ''}: {v.estoque} un
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge-cat">
                          <IconTag /> {prod.categoria || 'Geral'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>R$ {custo.toFixed(2)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}><strong>R$ {venda.toFixed(2)}</strong></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong>{prod.estoque || 0} un</strong>
                      </td>
                      <td className="col-acoes">
                        <div className="acoes-group">
                          <button 
                            className="btn btn-sm btn-grade"
                            onClick={() => abrirGrade(prod)}
                            title="Gerenciar Grade de Tamanhos e Cores"
                            style={{ gap: '4px' }}
                          >
                            <IconLayers /> Grade ({varsDesteProd.length})
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={() => iniciarEdicao(prod)}
                            title="Editar dados"
                          >
                            <IconEdit />
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => excluirProduto(prod.id, prod.nome)}
                            title="Excluir produto"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CONSTRUTOR DE MATRIZ DE GRADE */}
      {modalGradeAberto && produtoGradeSel && (
        <div className="modal-overlay" onClick={() => setModalGradeAberto(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Grade: {produtoGradeSel.nome}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Gere combinações em lote com códigos EAN-13 exclusivos</span>
              </div>
              <button onClick={() => setModalGradeAberto(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '20px', color: '#64748b', padding: '4px' }}>✕</button>
            </div>

            <div className="matriz-box">
              <div className="matriz-section-title">
                <span>1. Escolha os Tamanhos</span>
                <div className="presets-bar">
                  <button type="button" className="btn-preset" onClick={() => aplicarPredefinicaoTamanho('vestuario')}>
                    👕 Vestuário (PP-GG)
                  </button>
                  <button type="button" className="btn-preset" onClick={() => aplicarPredefinicaoTamanho('calcados')}>
                    👟 Calçados (34-44)
                  </button>
                  <button type="button" className="btn-preset" onClick={() => aplicarPredefinicaoTamanho('perfumaria')}>
                    🧴 Perfumes
                  </button>
                  <button type="button" className="btn-preset" onClick={() => setTamanhosSelecionados([])} style={{ color: '#dc2626' }}>
                    Limpar
                  </button>
                </div>
              </div>

              <div className="chips-grid">
                {['PP', 'P', 'M', 'G', 'GG', 'XGG', '34', '36', '38', '40', '42', '44', '50ml', '100ml'].map(tam => (
                  <button 
                    key={tam}
                    type="button" 
                    className={`chip-selectable ${tamanhosSelecionados.includes(tam) ? 'active' : ''}`}
                    onClick={() => toggleTamanho(tam)}
                  >
                    {tam}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Outro tamanho (ex: G1, 46)" 
                  value={customTamInput}
                  onChange={e => setCustomTamInput(e.target.value)}
                  style={{ height: '34px', fontSize: '0.85rem', padding: '0 8px', border: '1px solid #cbd5e1', borderRadius: '6px', flex: '1', minWidth: '140px' }}
                />
                <button type="button" className="btn-preset" onClick={adicionarTamanhoCustom}>
                  + Adicionar Tam
                </button>
              </div>

              <div className="matriz-section-title">
                <span>2. Escolha as Cores / Variações</span>
                <button type="button" className="btn-preset" onClick={() => setCoresSelecionadas([])} style={{ color: '#dc2626' }}>
                  Limpar Cores
                </button>
              </div>

              <div className="chips-grid">
                {CORES_COMUNS.map(cor => (
                  <button 
                    key={cor}
                    type="button" 
                    className={`chip-selectable ${coresSelecionadas.includes(cor) ? 'active' : ''}`}
                    onClick={() => toggleCor(cor)}
                  >
                    {cor}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Outra cor (ex: Floral, Dourado)" 
                  value={customCorInput}
                  onChange={e => setCustomCorInput(e.target.value)}
                  style={{ height: '34px', fontSize: '0.85rem', padding: '0 8px', border: '1px solid #cbd5e1', borderRadius: '6px', flex: '1', minWidth: '140px' }}
                />
                <button type="button" className="btn-preset" onClick={adicionarCorCustom}>
                  + Adicionar Cor
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Estoque Padrão:</label>
                  <input 
                    type="number" 
                    min="0"
                    value={estoquePadraoMatriz} 
                    onChange={e => setEstoquePadraoMatriz(e.target.value)}
                    style={{ width: '60px', height: '34px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                {(() => {
                  const qtdTams = tamanhosSelecionados.length || 1
                  const qtdCores = coresSelecionadas.length || 1
                  const totalPrevisto = (tamanhosSelecionados.length === 0 && coresSelecionadas.length === 0) ? 0 : (qtdTams * qtdCores)

                  return (
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={gerarMatrizCombinacoes}
                      disabled={gerandoMatriz || totalPrevisto === 0}
                      style={{ gap: '6px' }}
                    >
                      <IconZap /> {gerandoMatriz ? 'Gerando...' : `Gerar ${totalPrevisto} Variações c/ EAN-13`}
                    </button>
                  )
                })()}
              </div>
            </div>

            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Variações Ativas no Estoque ({variacoesDoProd.length})
            </span>

            {variacoesDoProd.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem', background: '#f8fafc', borderRadius: '10px' }}>
                Nenhuma variação criada. Use os botões acima para gerar a matriz em lote.
              </p>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.85rem', minWidth: '460px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 8px' }}>Tamanho</th>
                      <th style={{ padding: '6px 8px' }}>Cor</th>
                      <th style={{ padding: '6px 8px' }}>Código EAN-13 Exclusivo</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Estoque</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variacoesDoProd.map(v => (
                      <tr key={v.id}>
                        <td style={{ padding: '8px' }}><strong>{v.tamanho || '-'}</strong></td>
                        <td style={{ padding: '8px' }}>{v.cor || '-'}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', color: '#1e293b' }}>
                          <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {v.codigo_barras || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <input 
                            type="number" 
                            min="0"
                            defaultValue={v.estoque} 
                            onBlur={e => atualizarEstoqueRapidoVar(v.id, e.target.value)}
                            style={{ width: '54px', height: '28px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                          />
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              type="button" 
                              onClick={() => regenerarCodigoVar(v.id)} 
                              title="Regerar novo código de barras"
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#2563eb' }}
                            >
                              <IconZap />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => excluirVariacao(v.id)} 
                              title="Remover variação"
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setModalGradeAberto(false)}>
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
