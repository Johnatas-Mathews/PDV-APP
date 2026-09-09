import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { gerarComprovanteVenda, formatarIdVenda, DADOS_EMPRESA } from '../utils/pdfGenerator'
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
  
  // Desconto e Troco
  const [desconto, setDesconto] = useState(0)
  const [valorRecebido, setValorRecebido] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Controle de Edição de Venda Existente
  const [vendaEditando, setVendaEditando] = useState(null)
  const [itensOriginais, setItensOriginais] = useState([])

  // 1. Carregar dados do Supabase
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
      .select('*, clientes(nome, telefone)')
      .order('id', { ascending: false })
      .limit(10)

    if (prodData) setProdutos(prodData)
    if (cliData) setClientes(cliData)
    if (venData) setVendas(venData)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // 2. Adicionar produto à venda
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

    const itemExistente = itensVenda.find(i => i.produtoId === produto.id)
    const qtdTotalPretendida = (itemExistente ? itemExistente.quantidade : 0) + qtd

    // Se estiver editando, considera o que já pertencia a essa venda original
    const itemOriginal = itensOriginais.find(i => i.produtoId === produto.id)
    const estoqueDisponivelReal = produto.estoque + (itemOriginal ? itemOriginal.quantidade : 0)

    if (estoqueDisponivelReal < qtdTotalPretendida) {
      alert(`Estoque insuficiente! Disponível no estoque: ${estoqueDisponivelReal} unidades.`)
      return
    }

    if (itemExistente) {
      setItensVenda(itensVenda.map(item => 
        item.produtoId === produto.id 
          ? { 
              ...item, 
              quantidade: item.quantidade + qtd,
              subtotal: (item.quantidade + qtd) * item.preco
            }
          : item
      ))
    } else {
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
    }

    setProdutoSelecionado('')
    setQuantidade('1')
  }

  // 3. Ajuste rápido de quantidade (+ e -)
  const alterarQtdItem = (id, delta) => {
    setItensVenda(itensVenda.map(item => {
      if (item.id === id) {
        const produto = produtos.find(p => p.id === item.produtoId)
        const novaQtd = item.quantidade + delta

        if (novaQtd <= 0) return null

        const itemOriginal = itensOriginais.find(i => i.produtoId === item.produtoId)
        const estoqueDisponivelReal = (produto ? produto.estoque : 0) + (itemOriginal ? itemOriginal.quantidade : 0)

        if (delta > 0 && novaQtd > estoqueDisponivelReal) {
          alert(`Estoque máximo disponível atingido (${estoqueDisponivelReal} un)!`)
          return item
        }

        return {
          ...item,
          quantidade: novaQtd,
          subtotal: novaQtd * item.preco
        }
      }
      return item
    }).filter(Boolean))
  }

  const removerItem = (id) => {
    setItensVenda(itensVenda.filter(item => item.id !== id))
  }

  // Cálculos de totais e troco
  const subtotal = itensVenda.reduce((sum, item) => sum + item.subtotal, 0)
  const totalComDesconto = Math.max(0, subtotal - (parseFloat(desconto) || 0))
  const numValorRecebido = parseFloat(valorRecebido) || 0
  const troco = formaPagamento === 'dinheiro' && numValorRecebido > totalComDesconto 
    ? numValorRecebido - totalComDesconto 
    : 0

  // 4. Iniciar Edição de uma Venda
  const iniciarEdicao = (venda) => {
    setVendaEditando(venda)
    setClienteSelecionado(venda.cliente_id ? String(venda.cliente_id) : '')
    setFormaPagamento(venda.forma_pagamento || 'dinheiro')
    
    const itensClonados = Array.isArray(venda.itens) ? JSON.parse(JSON.stringify(venda.itens)) : []
    setItensVenda(itensClonados)
    setItensOriginais(itensClonados)
    
    // Calcula eventual desconto original
    const somaItens = itensClonados.reduce((s, i) => s + (Number(i.subtotal) || 0), 0)
    const descOriginal = Math.max(0, somaItens - Number(venda.total || 0))
    setDesconto(descOriginal)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicao = () => {
    setVendaEditando(null)
    setItensOriginais([])
    setItensVenda([])
    setClienteSelecionado('')
    setFormaPagamento('dinheiro')
    setStatusPagamento('pago')
    setDesconto(0)
    setValorRecebido('')
  }

  // 5. Enviar Comprovante no WhatsApp
  const enviarComprovanteWhatsApp = (codigoVenda, nomeCli, telCli, totalVenda) => {
    if (!telCli) {
      alert('Este cliente não possui telefone cadastrado!')
      return
    }

    const numLimpo = telCli.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo

    const mensagem = encodeURIComponent(
      `Olá, ${nomeCli}! 🛍️\n` +
      `Obrigado por comprar conosco!\n\n` +
      `📄 Pedido: *${codigoVenda}*\n` +
      `💰 Total: *R$ ${Number(totalVenda).toFixed(2)}*\n\n` +
      `Qualquer dúvida, estamos à disposição!`
    )

    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${mensagem}`, '_blank')
  }

  // 6. Salvar Venda (Nova ou Atualização)
  const finalizarVenda = async () => {
    if (itensVenda.length === 0) {
      alert('Adicione itens à venda')
      return
    }

    if (formaPagamento === 'dinheiro' && valorRecebido && numValorRecebido < totalComDesconto) {
      alert(`O valor entregue (R$ ${numValorRecebido.toFixed(2)}) é menor que o total da venda (R$ ${totalComDesconto.toFixed(2)})!`)
      return
    }

    setSalvando(true)
    const clienteId = clienteSelecionado ? parseInt(clienteSelecionado) : null
    const clienteObj = clientes.find(c => c.id === clienteId)
    const nomeCliente = clienteObj ? clienteObj.nome : 'Cliente Avulso'
    const telefoneCliente = clienteObj ? clienteObj.telefone : null

    try {
      if (vendaEditando) {
        // === MODO EDIÇÃO ===
        
        // 1. Rebalancear estoque: compara itensOriginais com novos itensVenda
        const mapaOriginal = {}
        itensOriginais.forEach(i => {
          mapaOriginal[i.produtoId] = (mapaOriginal[i.produtoId] || 0) + i.quantidade
        })

        const mapaNovo = {}
        itensVenda.forEach(i => {
          mapaNovo[i.produtoId] = (mapaNovo[i.produtoId] || 0) + i.quantidade
        })

        // Lista com todos os IDs de produto envolvidos na alteração
        const todosProdutoIds = Array.from(new Set([...Object.keys(mapaOriginal), ...Object.keys(mapaNovo)]))

        for (const prodIdStr of todosProdutoIds) {
          const prodId = parseInt(prodIdStr)
          const qtdAntiga = mapaOriginal[prodId] || 0
          const qtdNova = mapaNovo[prodId] || 0
          const diferenca = qtdNova - qtdAntiga // positivo = saiu mais do estoque; negativo = devolve pro estoque

          if (diferenca !== 0) {
            const prodAtual = produtos.find(p => p.id === prodId)
            if (prodAtual) {
              const novoEstoque = Math.max(0, (prodAtual.estoque || 0) - diferenca)
              await supabase
                .from('produtos')
                .update({ estoque: novoEstoque })
                .eq('id', prodId)
            }
          }
        }

        // 2. Atualizar registro da venda
        const { error: erroUpdate } = await supabase
          .from('vendas')
          .update({
            total: totalComDesconto,
            forma_pagamento: formaPagamento,
            itens: itensVenda,
            cliente_id: clienteId
          })
          .eq('id', vendaEditando.id)

        if (erroUpdate) throw erroUpdate

        // 3. Atualizar contas a receber se houver título vinculado
        await supabase
          .from('contas_a_receber')
          .update({
            valor: totalComDesconto,
            cliente_id: clienteId,
            descricao: `Venda #${vendaEditando.id} - ${nomeCliente}`
          })
          .like('descricao', `Venda #${vendaEditando.id}%`)

        const codFormatado = formatarIdVenda(vendaEditando.id)
        alert(`Venda ${codFormatado} atualizada com sucesso!`)

        if (confirm('Deseja emitir o comprovante PDF atualizado?')) {
          gerarComprovanteVenda({
            ...vendaEditando,
            total: totalComDesconto,
            forma_pagamento: formaPagamento,
            itens: itensVenda,
            clientes: { nome: nomeCliente }
          })
        }

        cancelarEdicao()

      } else {
        // === MODO NOVA VENDA ===
        const { data: vendaCriada, error: erroVenda } = await supabase
          .from('vendas')
          .insert([
            {
              total: totalComDesconto,
              forma_pagamento: formaPagamento,
              itens: itensVenda,
              cliente_id: clienteId
            }
          ])
          .select()
          .single()

        if (erroVenda) throw erroVenda

        if (statusPagamento === 'pendente') {
          const dataVencimento = new Date()
          dataVencimento.setDate(dataVencimento.getDate() + 30)

          await supabase.from('contas_a_receber').insert([
            {
              descricao: `Venda #${vendaCriada.id} - ${nomeCliente}`,
              valor: totalComDesconto,
              vencimento: dataVencimento.toISOString().split('T')[0],
              status: 'pendente',
              cliente_id: clienteId
            }
          ])
        }

        // Baixa regular de estoque
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

        const codFormatado = formatarIdVenda(vendaCriada.id)

        if (confirm(`Venda ${codFormatado} finalizada! Deseja emitir o comprovante em PDF?`)) {
          gerarComprovanteVenda({
            ...vendaCriada,
            clientes: { nome: nomeCliente }
          })
        }

        if (telefoneCliente && confirm('Deseja enviar a confirmação da compra pelo WhatsApp do cliente?')) {
          enviarComprovanteWhatsApp(codFormatado, nomeCliente, telefoneCliente, totalComDesconto)
        }

        setItensVenda([])
        setClienteSelecionado('')
        setFormaPagamento('dinheiro')
        setStatusPagamento('pago')
        setDesconto(0)
        setValorRecebido('')
      }
    } catch (err) {
      alert('Erro ao salvar venda: ' + err.message)
    }

    setSalvando(false)
    await carregarDados()
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: '2px' }}>
          {vendaEditando ? `Editando Venda #${formatarIdVenda(vendaEditando.id)}` : 'Frente de Caixa (PDV)'}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, fontWeight: 500 }}>
          🏪 {DADOS_EMPRESA.nome}
        </p>
      </div>

      {vendaEditando && (
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          color: '#92400e', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            ⚠️ <strong>Modo de Edição Ativo:</strong> Você pode adicionar, remover ou ajustar as quantidades. O estoque será rebalanceado automaticamente.
          </span>
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={cancelarEdicao}
          >
            ✕ Cancelar Edição
          </button>
        </div>
      )}

      <div className="form-container">
        <div className="form-section">
          <h2>Dados da Venda</h2>
          
          <div className="form-group">
            <label>Cliente</label>
            <select value={clienteSelecionado} onChange={(e) => setClienteSelecionado(e.target.value)}>
              <option value="">Cliente Avulso (Não identificado)</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.telefone ? `(${c.telefone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Forma de Pagamento</label>
              <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="debito">Cartão de Débito</option>
                <option value="credito">Cartão de Crédito</option>
              </select>
            </div>

            {!vendaEditando && (
              <div className="form-group">
                <label>Situação</label>
                <select value={statusPagamento} onChange={(e) => setStatusPagamento(e.target.value)}>
                  <option value="pago">À Vista (Pago)</option>
                  <option value="pendente">A Prazo (Contas a Receber)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>Adicionar Item</h2>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 3 }}>
              <label>Produto</label>
              <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)}>
                <option value="">Selecione um produto</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — R$ {Number(p.preco).toFixed(2)} (Estoque: {p.estoque})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Qtd</label>
              <input 
                type="number" 
                min="1" 
                value={quantidade} 
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={adicionarItem}>
            + Adicionar ao Pedido
          </button>
        </div>
      </div>

      {itensVenda.length > 0 && (
        <div className="table-container">
          <h2>Itens do Pedido</h2>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço Unit.</th>
                <th style={{ textAlign: 'center' }}>Quantidade</th>
                <th>Subtotal</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {itensVenda.map(item => (
                <tr key={item.id}>
                  <td>{item.nomeProduto}</td>
                  <td>R$ {item.preco.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      style={{ padding: '2px 8px', marginRight: '6px', cursor: 'pointer' }}
                      onClick={() => alterarQtdItem(item.id, -1)}
                    >
                      -
                    </button>
                    <strong>{item.quantidade}</strong>
                    <button 
                      style={{ padding: '2px 8px', marginLeft: '6px', cursor: 'pointer' }}
                      onClick={() => alterarQtdItem(item.id, 1)}
                    >
                      +
                    </button>
                  </td>
                  <td>R$ {item.subtotal.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-sm btn-danger" onClick={() => removerItem(item.id)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Área Financeira: Desconto, Totais e Troco */}
          <div style={{ marginTop: '1.5rem', background: '#f9fafb', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '4px' }}>
                  Desconto (R$):
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={desconto} 
                  onChange={(e) => setDesconto(e.target.value)}
                  style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              {formaPagamento === 'dinheiro' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '4px' }}>
                    Valor Entregue pelo Cliente (R$):
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0,00"
                    value={valorRecebido} 
                    onChange={(e) => setValorRecebido(e.target.value)}
                    style={{ width: '150px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  />
                </div>
              )}

              {formaPagamento === 'dinheiro' && troco > 0 && (
                <div style={{ background: '#ecfdf5', padding: '8px 16px', borderRadius: '6px', border: '1px solid #10b981' }}>
                  <span style={{ fontSize: '13px', color: '#065f46', display: 'block' }}>Troco a Devolver:</span>
                  <strong style={{ fontSize: '20px', color: '#047857' }}>R$ {troco.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <div className="total-section" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <div className="total-info">
                <span>Total a Pagar:</span>
                <span className="total-value" style={{ color: '#2563eb' }}>R$ {totalComDesconto.toFixed(2)}</span>
              </div>
              <button 
                className="btn btn-success btn-lg" 
                onClick={finalizarVenda}
                disabled={salvando}
              >
                {salvando ? 'Gravando...' : (vendaEditando ? '✓ Salvar Alterações da Venda' : '✓ Finalizar Venda')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico das Últimas Vendas */}
      {vendas.length > 0 && (
        <div className="table-container">
          <h2>Últimas Vendas Realizadas</h2>
          <table>
            <thead>
              <tr>
                <th>Código ID</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Forma Pagto</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map(venda => {
                const cod = formatarIdVenda(venda.id)
                const tel = venda.clientes?.telefone
                const nome = venda.clientes?.nome || 'Cliente'

                return (
                  <tr key={venda.id}>
                    <td><strong>{cod}</strong></td>
                    <td>{new Date(venda.created_at).toLocaleString('pt-BR')}</td>
                    <td>{venda.clientes?.nome || 'Cliente Avulso'}</td>
                    <td>R$ {Number(venda.total).toFixed(2)}</td>
                    <td>{venda.forma_pagamento?.toUpperCase()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => iniciarEdicao(venda)}
                          title="Editar itens ou forma de pagamento"
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => gerarComprovanteVenda(venda)}
                        >
                          📄 PDF
                        </button>
                        {tel && (
                          <button 
                            className="btn btn-sm btn-success" 
                            onClick={() => enviarComprovanteWhatsApp(cod, nome, tel, venda.total)}
                          >
                            📲 Zap
                          </button>
                        )}
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
