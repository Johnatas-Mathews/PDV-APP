import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import '../styles/pages.css'

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [precoCusto, setPrecoCusto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descricao, setDescricao] = useState('')
  const [estoque, setEstoque] = useState('')
  const [editando, setEditando] = useState(null)
  const [carregando, setCarregando] = useState(false)

  // 1. Carregar produtos do Supabase
  const carregarProdutos = async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Erro ao buscar produtos:', error)
    } else {
      setProdutos(data || [])
    }
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  // 2. Salvar ou Atualizar no Supabase
  const salvarProduto = async () => {
    if (!nome || !preco) {
      alert('Preencha nome e preço de venda')
      return
    }

    setCarregando(true)

    const payload = {
      nome,
      preco: parseFloat(preco),
      preco_custo: parseFloat(precoCusto) || 0,
      categoria: categoria || null,
      descricao: descricao || null,
      estoque: parseInt(estoque) || 0
    }

    if (editando) {
      const { error } = await supabase
        .from('produtos')
        .update(payload)
        .eq('id', editando)

      if (error) {
        alert('Erro ao atualizar produto: ' + error.message)
      } else {
        await carregarProdutos()
        limparForm()
      }
    } else {
      const { error } = await supabase
        .from('produtos')
        .insert([payload])

      if (error) {
        alert('Erro ao cadastrar produto: ' + error.message)
      } else {
        await carregarProdutos()
        limparForm()
      }
    }

    setCarregando(false)
  }

  const limparForm = () => {
    setNome('')
    setPreco('')
    setPrecoCusto('')
    setCategoria('')
    setDescricao('')
    setEstoque('')
    setEditando(null)
  }

  const editar = (produto) => {
    setNome(produto.nome)
    setPreco(produto.preco.toString())
    setPrecoCusto((produto.preco_custo || 0).toString())
    setCategoria(produto.categoria || '')
    setDescricao(produto.descricao || '')
    setEstoque((produto.estoque || 0).toString())
    setEditando(produto.id)
  }

  // 3. Deletar do Supabase
  const deletar = async (id) => {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Erro ao deletar produto: ' + error.message)
      } else {
        await carregarProdutos()
      }
    }
  }

  return (
    <div>
      <h1 className="page-title">Produtos</h1>

      <div className="form-container">
        <div className="form-section">
          <h2>{editando ? 'Editar Produto' : 'Novo Produto'}</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Nome do Produto *</label>
              <input 
                type="text" 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                placeholder="Ex: Café Premium"
              />
            </div>

            <div className="form-group">
              <label>Categoria</label>
              <input 
                type="text" 
                value={categoria} 
                onChange={(e) => setCategoria(e.target.value)} 
                placeholder="Ex: Bebidas"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Preço de Custo (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                value={precoCusto} 
                onChange={(e) => setPrecoCusto(e.target.value)} 
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Preço de Venda (R$) *</label>
              <input 
                type="number" 
                step="0.01" 
                value={preco} 
                onChange={(e) => setPreco(e.target.value)} 
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Estoque</label>
              <input 
                type="number" 
                value={estoque} 
                onChange={(e) => setEstoque(e.target.value)} 
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              placeholder="Descrição do produto (opcional)" 
              rows="3"
            />
          </div>

          <div className="form-buttons">
            <button className="btn btn-primary" onClick={salvarProduto} disabled={carregando}>
              {carregando ? 'Salvando...' : editando ? 'Atualizar Produto' : 'Adicionar Produto'}
            </button>
            {editando && (
              <button className="btn btn-secondary" onClick={limparForm}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {produtos.length > 0 && (
        <div className="table-container">
          <h2>Produtos Cadastrados ({produtos.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Custo</th>
                <th>Venda</th>
                <th>Lucro Unit.</th>
                <th>Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(produto => {
                const venda = Number(produto.preco) || 0
                const custo = Number(produto.preco_custo) || 0
                const lucro = venda - custo

                return (
                  <tr key={produto.id}>
                    <td>{produto.nome}</td>
                    <td>{produto.categoria || '-'}</td>
                    <td>R$ {custo.toFixed(2)}</td>
                    <td>R$ {venda.toFixed(2)}</td>
                    <td>
                      <strong style={{ color: lucro >= 0 ? '#10b981' : '#ef4444' }}>
                        R$ {lucro.toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge badge-${produto.estoque > 5 ? 'success' : produto.estoque > 0 ? 'warning' : 'danger'}`}>
                        {produto.estoque} un.
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-primary" onClick={() => editar(produto)}>
                          Editar
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => deletar(produto.id)}>
                          Deletar
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
  )
}
