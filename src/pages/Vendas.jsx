import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { gerarComprovanteVenda, formatarIdVenda } from '../utils/pdfGenerator'
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
  const [salvando, setSalvando] = useState(false)

  // 1. Carregar produtos, clientes e histórico do Supabase
  const carregarDados = async () => {
    const { data: prodData } = await supabase
      .from('produtos')
      .select('*')
      .order('nome')

    const { data: cliData } = await supabase
      .from('clientes')
      .select('*')
      .order('nome')

    const { data: venData } = await supabase
      .from('vendas')
      .select('*, clientes(nome)')
      .order('id', { ascending: false })
      .limit(10)

    if (prodData) setProdutos(prodData)
    if (cliData) setClientes(cliData)
    if (venData) setVendas(venData)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // 2. Adicionar produto à lista
  const adicionarItem = () => {
    if (!produtoSelecionado || !quantidade) {
      alert('Selecione um produto e a quantidade')
      return
    }

    const produto = produtos.find(p => p.id === parseInt(produtoSelecionado))
    if (!produto) return

    const qtd = parseInt(quantidade)
    if (qtd <= 0) {
      alert('Informe uma quantidade válida')
      return
    }

    if (produto.estoque < qtd) {
      alert(`Estoque insuficiente! Restam apenas ${produto.estoque} unidades.`)
      return
    }

    const novoItem = {
      id: Date.now(),
      produtoId: produto.id,
      nomeProduto: produto.nome,
      preco: Number(produto.preco) || 0,
      preco_custo: Number(produto.preco_custo) || 0,
      quantidade: qtd,
      subtotal: (Number(produto.preco) || 0) * qtd
    }

    setItensVenda([...itensVenda, novoItem])
    setProdutoSelecionado('')
    setQuantidade('1')
  }

  const removerItem = (id) => {
    setItensVenda(itensVenda.filter(item => item.id !== id))
  }

  const total = itensVenda.reduce((sum, item) => sum + item.subtotal, 0)

  // 3. Finalizar venda, dar baixa no estoque e gerar comprovante
  const finalizarVenda = async () => {
    if (itensVenda.length === 0) {
      alert('Adicione itens à venda')
      return
    }

    setSalvando(true)
    const clienteId = clienteSelecionado ? parseInt(clienteSelecionado) : null
    const clienteObj = clientes.find(c => c.id === clienteId)
    const nomeCliente = clienteObj ? clienteObj.nome : 'Cliente Avulso'

    // A. Gravar a venda
    const { data: vendaCriada, error: erroVenda } = await supabase
      .from('vendas')
      .insert([
        {
          total: total,
          forma_pagamento: formaPagamento,
          itens: itensVenda,
          cliente_id: clienteId
        }
      ])
      .select()
      .single()

    if (erroVenda) {
      alert('Erro ao registrar venda: ' + erroVenda.message)
      setSalvando(false)
      return
    }

    // B. Se pendente, cria lançamento em contas_a_receber
    if (statusPagamento === 'pendente') {
      const dataVencimento = new Date()
      dataVencimento.setDate(dataVencimento.getDate() + 30)

      await supabase.from('contas_a_receber').insert([
        {
          descricao: `Venda #${vendaCriada.id} - ${nomeCliente}`,
          valor: total,
          vencimento: dataVencimento.toISOString().split('T')[0],
          status: 'pendente',
          cliente_id: clienteId
        }
      ])
    }

    // C. Baixa de estoque
    for (const item of itensVenda) {
      const prodOriginal = produtos.find(p => p.id === item.produtoId)
      if (prodOriginal) {
        const novoEstoque = Math.max(0, (prodOriginal.estoque || 0) - item.quantidade)
        await supabase
          .from('produtos')
          .update({ estoque: novoEstoque })
          .eq('id', item.produtoId)
      }
    }

    // D. Oferece emissão imediata do PDF
    if (confirm('Venda registrada com sucesso! Deseja gerar o comprovante em PDF agora?')) {
      gerarComprovanteVenda({
        ...vendaCriada,
        clientes: { nome: nomeCliente }
      })
    }

    setItensVenda([])
    setClienteSelecionado('')
    setFormaPagamento('dinheiro')
    setStatusPagamento('pago')
    setSalvando(false)
    await carregarDados()
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
                <option value="pendente">Pendente (A prazo)</option>
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
                    {p.nome} - R$ {Number(p.preco).toFixed(2)} (Estoque: {p.estoque})
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
            <button 
              className="btn btn-success btn-lg" 
              onClick={finalizarVenda}
              disabled={salvando}
            >
              {salvando ? 'Processando...' : 'Finalizar Venda'}
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
                <th>Código Único</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Pagamento</th>
                <th>Comprovante</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map(venda => (
                <tr key={venda.id}>
                  <td><strong>{formatarIdVenda(venda.id)}</strong></td>
                  <td>{new Date(venda.created_at).toLocaleString('pt-BR')}</td>
                  <td>{venda.clientes?.nome || 'Cliente Avulso'}</td>
                  <td>R$ {Number(venda.total).toFixed(2)}</td>
                  <td>{venda.forma_pagamento?.toUpperCase()}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => gerarComprovanteVenda(venda)}
                    >
                      📄 PDF
                    </button>
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
