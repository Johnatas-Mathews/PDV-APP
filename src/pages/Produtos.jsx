import { useState, useEffect } from 'react'
import '../styles/pages.css'

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descricao, setDescricao] = useState('')
  const [estoque, setEstoque] = useState('')
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem('pdv_produtos') || '[]')
    setProdutos(dados)
  }, [])

  const salvarProduto = () => {
    if (!nome || !preco) {
      alert('Preencha nome e preço')
      return
    }

    let novaLista
    if (editando) {
      novaLista = produtos.map(p => 
        p.id === editando 
          ? { ...p, nome, preco: parseFloat(preco), categoria, descricao, estoque: parseInt(estoque) || 0 }
          : p
      )
      setEditando(null)
    } else {
      const novoProduto = {
        id: Date.now(),
        nome,
        preco: parseFloat(preco),
        categoria,
        descricao,
        estoque: parseInt(estoque) || 0,
        dataCadastro: new Date().toLocaleDateString('pt-BR')
      }
      novaLista = [...produtos, novoProduto]
    }

    setProdutos(novaLista)
    localStorage.setItem('pdv_produtos', JSON.stringify(novaLista))
    limparForm()
  }

  const limparForm = () => {
    setNome('')
    setPreco('')
    setCategoria('')
    setDescricao('')
    setEstoque('')
    setEditando(null)
  }

  const editar = (produto) => {
    setNome(produto.nome)
    setPreco(produto.preco.toString())
    setCategoria(produto.categoria)
    setDescricao(produto.descricao)
    setEstoque(produto.estoque.toString())
    setEditando(produto.id)
  }

  const deletar = (id) => {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
      const novaLista = produtos.filter(p => p.id !== id)
      setProdutos(novaLista)
      localStorage.setItem('pdv_produtos', JSON.stringify(novaLista))
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
              <label>Preço (R$) *</label>
              <input 
                type="number" 
                step="0.01"
                value={preco} 
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Categoria</label>
              <input 
                type="text" 
                value={categoria} 
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Bebidas"
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
            <button className="btn btn-primary" onClick={salvarProduto}>
              {editando ? 'Atualizar' : 'Adicionar'} Produto
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
                <th>Preço</th>
                <th>Estoque</th>
                <th>Data Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(produto => (
                <tr key={produto.id}>
                  <td>{produto.nome}</td>
                  <td>{produto.categoria || '-'}</td>
                  <td>R$ {produto.preco.toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${produto.estoque > 5 ? 'success' : produto.estoque > 0 ? 'warning' : 'danger'}`}>
                      {produto.estoque} un.
                    </span>
                  </td>
                  <td>{produto.dataCadastro}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
