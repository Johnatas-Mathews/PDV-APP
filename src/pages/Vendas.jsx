import { useState, useEffect } from 'react'
import '../styles/pages.css'

export default function Vendas() {
  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [vendas, setVendas] = useState([])
  
  const [clienteSelecionado, setClienteSelecionado] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [itensVenda, setItensVenda] = useState([])
  const [formaPagamento, setFormaPagamento] = useState('dinheiro')
  const [statusPagamento, setStatusPagamento] = useState('pago')

  useEffect(() => {
    // Carregar dados
    setProdutos(JSON.parse(localStorage.getItem('pdv_produtos') || '[]'))
    setClientes(JSON.parse(localStorage.getItem('pdv_clientes') || '[]'))
    setVendas(JSON.parse(localStorage.getItem('pdv_vendas') || '[]'))
  }, [])

  const adicionarItem = () => {
    if (!produtoSelecionado || !quantidade) {
      alert('Selecione um produto e quantidade')
      return
    }

    const produto = produtos.find(p => p.id === parseInt(produtoSelecionado))
    const novoItem = {
      id: Date.now(),
      produtoId: produto.id,
      nomeProduto: produto.nome,
      preco: produto.preco,
      quantidade: parseInt(quantidade),
      subtotal: produto.preco * parseInt(quantidade)
    }

    setItensVenda([...itensVenda, novoItem])
    setProdutoSelecionado('')
    setQuantidade('1')
  }

  const removerItem = (id) => {
    setItensVenda(itensVenda.filter(item => item.id !== id))
  }

  const total = itensVenda.reduce((sum, item) => sum + item.subtotal, 0)

  const finalizarVenda = () => {
    if (itensVenda.length === 0) {
      alert('Adicione itens à venda')
      return
    }

    const novaVenda = {
      id: Date.now(),
      data: new Date().toLocaleString('pt-BR'),
      cliente: clienteSelecionado ? clientes.find(c => c.id === parseInt(clienteSelecionado))?.nome : 'Cliente Avulso',
      itens: itensVenda,
      total: total,
      pagamento: formaPagamento,
      status: statusPagamento
    }

    const novasVendas = [...vendas, novaVenda]
    setVendas(novasVendas)
    localStorage.setItem('pdv_vendas', JSON.stringify(novasVendas))

    // Se for a prazo, registrar na conta a receber
    if (statusPagamento === 'pendente') {
      const contas = JSON.parse(localStorage.getItem('pdv_contas') || '[]')
      contas.push({
        id: Date.now(),
        vendaId: novaVenda.id,
        cliente: novaVenda.cliente,
        valor: total,
        dataPrazo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        pago: false
      })
      localStorage.setItem('pdv_contas', JSON.stringify(contas))
    }

    alert('Venda registrada com sucesso!')
    setItensVenda([])
    setClienteSelecionado('')
    setFormaPagamento('dinheiro')
    setStatusPagamento('pago')
  }

  return (
    <div>
      <h1 className="page-title">Registro de Vendas</h1>

      <div className="form-container">
        <div className="form-section">
          <h2>Informações da Venda</h2>
          
          <div className="form-group">
            <label>Cliente (Opcional)</label>
            <select value={clienteSelecionado} onChange={(e) => setClienteSelecionado(e.target.value)}>
              <option value="">Cliente Avulso</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Forma de Pagamento</label>
              <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                <option value="dinheiro">Dinheiro</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="pix">PIX</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select value={statusPagamento} onChange={(e) => setStatusPagamento(e.target.value)}>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Adicionar Produtos</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Produto</label>
              <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)}>
                <option value="">Selecione um produto</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - R$ {p.preco.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantidade</label>
              <input 
                type="number" 
                min="1" 
                value={quantidade} 
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={adicionarItem}>
            Adicionar Item
          </button>
        </div>
      </div>

      {itensVenda.length > 0 && (
        <div className="table-container">
          <h2>Itens da Venda</h2>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Quantidade</th>
                <th>Subtotal</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {itensVenda.map(item => (
                <tr key={item.id}>
                  <td>{item.nomeProduto}</td>
                  <td>R$ {item.preco.toFixed(2)}</td>
                  <td>{item.quantidade}</td>
                  <td>R$ {item.subtotal.toFixed(2)}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => removerItem(item.id)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="total-section">
            <div className="total-info">
              <span>Total:</span>
              <span className="total-value">R$ {total.toFixed(2)}</span>
            </div>
            <button className="btn btn-success btn-lg" onClick={finalizarVenda}>
              Finalizar Venda
            </button>
          </div>
        </div>
      )}

      {vendas.length > 0 && (
        <div className="table-container">
          <h2>Últimas Vendas</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Pagamento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vendas.slice().reverse().slice(0, 5).map(venda => (
                <tr key={venda.id}>
                  <td>{venda.data}</td>
                  <td>{venda.cliente}</td>
                  <td>R$ {venda.total.toFixed(2)}</td>
                  <td>{venda.pagamento}</td>
                  <td>
                    <span className={`badge badge-${venda.status === 'pago' ? 'success' : 'warning'}`}>
                      {venda.status}
                    </span>
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
