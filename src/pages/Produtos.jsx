import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Ícones SVG nativos minimalistas
const IconPackage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
)

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
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

const IconTag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <circle cx="7" cy="7" r=".5" fill="currentColor" />
  </svg>
)

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [categoriasExistentes, setCategoriasExistentes] = useState([])
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [busca, setBusca] = useState('')

  // Formulário
  const [idEditando, setIdEditando] = useState(null)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [preco, setPreco] = useState('')
  const [precoCusto, setPrecoCusto] = useState('')
  const [estoque, setEstoque] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregarProdutos = async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true })

    if (!error && data) {
      setProdutos(data)
      // Extrai todas as categorias únicas cadastradas (limpando espaços e vazios)
      const catsUnicas = Array.from(
        new Set(
          data
            .map(p => (p.categoria ? p.categoria.trim() : 'Geral'))
            .filter(Boolean)
        )
      ).sort()
      setCategoriasExistentes(catsUnicas)
    }
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  const limparFormulario = () => {
    setIdEditando(null)
    setNome('')
    setCategoria('')
    setPreco('')
    setPrecoCusto('')
    setEstoque('')
  }

  const iniciarEdicao = (prod) => {
    setIdEditando(prod.id)
    setNome(prod.nome || '')
    setCategoria(prod.categoria || 'Geral')
    setPreco(prod.preco ? String(prod.preco) : '')
    setPrecoCusto(prod.preco_custo ? String(prod.preco_custo) : '')
    setEstoque(prod.estoque !== null ? String(prod.estoque) : '0')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salvarProduto = async (e) => {
    e.preventDefault()

    if (!nome.trim() || !preco) {
      alert('Preencha ao menos o Nome e o Preço de Venda.')
      return
    }

    setSalvando(true)

    const payload = {
      nome: nome.trim(),
      categoria: categoria.trim() || 'Geral',
      preco: parseFloat(preco.replace(',', '.')) || 0,
      preco_custo: precoCusto ? parseFloat(precoCusto.replace(',', '.')) : 0,
      estoque: parseInt(estoque) || 0
    }

    try {
      if (idEditando) {
        const { error } = await supabase
          .from('produtos')
          .update(payload)
          .eq('id', idEditando)

        if (error) throw error
        alert('Produto atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert([payload])

        if (error) throw error
        alert('Produto cadastrado com sucesso!')
      }

      limparFormulario()
      await carregarProdutos()
    } catch (err) {
      alert('Erro ao salvar produto: ' + err.message)
    }

    setSalvando(false)
  }

  const excluirProduto = async (id, nomeProd) => {
    if (!confirm(`Deseja realmente excluir o produto "${nomeProd}"?`)) return

    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      carregarProdutos()
    }
  }

  // Filtros combinados de busca e categoria
  const produtosFiltrados = produtos.filter(p => {
    const atendeBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
    const catProd = (p.categoria || 'Geral').toLowerCase()
    const atendeCategoria = categoriaFiltro === 'todas' || catProd === categoriaFiltro.toLowerCase()
    return atendeBusca && atendeCategoria
  })

  return (
    <div className="prod-wrapper">
      <style>{`
        .prod-wrapper { max-width: 1200px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
        .card-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 1.5rem; }
        .card-box h2 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem; }
        .form-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .form-group { display: flex; flex-direction: column; flex: 1; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
        .form-group input, .form-group select { height: 42px; padding: 0 0.85rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff; color: #0f172a; font-size: 0.95rem; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #2563eb; }
        
        .chips-container { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .chip-cat { font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.15s; }
        .chip-cat:hover { background: #e2e8f0; color: #0f172a; }
        .chip-cat.selected { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; font-weight: 600; }

        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; padding: 0.65rem 1.25rem; font-size: 0.9rem; transition: all 0.15s ease; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; border-radius: 6px; }

        .filter-section { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .search-input { height: 40px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 12px; font-size: 0.9rem; width: 260px; }
        .cat-pills { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
        .pill { padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; color: #64748b; font-size: 0.82rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .pill.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }

        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 1rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }
        .badge-cat { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: #f1f5f9; color: #334155; font-size: 0.78rem; font-weight: 600; }
        .estoque-baixo { color: #dc2626; font-weight: 700; background: #fef2f2; padding: 2px 6px; border-radius: 4px; }
        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 0.75rem; }
          .search-input { width: 100%; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Catálogo de Produtos</h1>
        <p className="page-subtitle">Cadastre mercadorias, organize por categoria e monitore o estoque</p>
      </div>

      {/* Formulário de Cadastro / Edição */}
      <div className="card-box">
        <h2>{idEditando ? 'Editar Produto' : 'Novo Produto'}</h2>
        <form onSubmit={salvarProduto}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Nome do Produto</label>
              <input 
                type="text" 
                placeholder="Ex: Coca-Cola 2L, Camiseta Básica, etc."
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
            </div>

            {/* Campo de Categoria com Sugestões Dinâmicas */}
            <div className="form-group" style={{ flex: 1.5 }}>
              <label>Categoria (Digite ou escolha abaixo)</label>
              <input 
                type="text" 
                list="lista-categorias"
                placeholder="Ex: Bebidas, Roupas, Alimentos"
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
              />
              <datalist id="lista-categorias">
                {categoriasExistentes.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>

              {/* Chips rápidos de categorias já salvas */}
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

          <div className="form-row">
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
              <label>Estoque Atual</label>
              <input 
                type="number" 
                placeholder="0"
                value={estoque}
                onChange={e => setEstoque(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
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

      {/* Listagem de Produtos com Filtro por Categoria */}
      <div className="card-box">
        <div className="filter-section">
          {/* Pílulas de filtro de categorias */}
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
            placeholder="Buscar produto por nome..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {produtosFiltrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
            Nenhum produto encontrado nessa categoria.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Custo</th>
                <th>Venda</th>
                <th>Margem Estimada</th>
                <th>Estoque</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map(prod => {
                const venda = Number(prod.preco || 0)
                const custo = Number(prod.preco_custo || 0)
                const margem = venda > 0 && custo > 0 ? (((venda - custo) / venda) * 100).toFixed(0) : null
                const isEstoqueBaixo = (prod.estoque || 0) <= 3

                return (
                  <tr key={prod.id}>
                    <td><strong>{prod.nome}</strong></td>
                    <td>
                      <span className="badge-cat">
                        <IconTag /> {prod.categoria || 'Geral'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>R$ {custo.toFixed(2)}</td>
                    <td><strong>R$ {venda.toFixed(2)}</strong></td>
                    <td>
                      {margem ? (
                        <span style={{ color: Number(margem) >= 40 ? '#16a34a' : '#ea580c', fontWeight: 600 }}>
                          {margem}%
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={isEstoqueBaixo ? 'estoque-baixo' : ''}>
                        {prod.estoque || 0} un
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => iniciarEdicao(prod)}
                          title="Editar produto"
                          style={{ gap: '4px' }}
                        >
                          <IconEdit /> Editar
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
        )}
      </div>
    </div>
  )
}
