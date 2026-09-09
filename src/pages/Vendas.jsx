import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { gerarComprovanteVenda, formatarIdVenda, DADOS_EMPRESA } from '../utils/pdfGenerator'

// Ícones SVG minimalistas nativos (sem dependência externa)
const IconStore = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" />
  </svg>
)

const IconPlus = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
)

const IconMinus = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

const IconFileText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
  </svg>
)

const IconWhatsApp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function Vendas() {
  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [vendas, setVendas] = useState([])
  
  const [clienteSelecionado, setClienteSelecionado] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [itensVenda, setItensVenda] = useState([])
  const [formaPagamento, setFormaPagamento] = useState('dinheiro')
  
  const [desconto, setDesconto] = useState(0)
  const [valorRecebido, setValorRecebido] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [vendaEditando, setVendaEditando] = useState(null)
  const [itensOriginais, setItensOriginais] = useState([])

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

  const adicionarItem = () => {
    if (!produtoSelecionado || !quantidade) {
      alert('Selecione um produto e a quantidade.')
      return
    }

    const produto = produtos.find(p => p.id === parseInt(produtoSelecionado))
    if (!produto) return

    const qtd = parseInt(quantidade)
    if (qtd <= 0) {
      alert('Informe uma quantidade válida.')
      return
    }

    const itemExistente = itensVenda.find(i => i.produtoId === produto.id)
    const qtdTotalPretendida = (itemExistente ? itemExistente.quantidade : 0) + qtd

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

  const subtotal = itensVenda.reduce((sum, item) => sum + item.subtotal, 0)
  const totalComDesconto = Math.max(0, subtotal - (parseFloat(desconto) || 0))
  const numValorRecebido = parseFloat(valorRecebido) || 0
  const troco = formaPagamento === 'dinheiro' && numValorRecebido > totalComDesconto 
    ? numValorRecebido - totalComDesconto 
    : 0

  const iniciarEdicao = (venda) => {
    setVendaEditando(venda)
    setClienteSelecionado(venda.cliente_id ? String(venda.cliente_id) : '')
    setFormaPagamento(venda.forma_pagamento || 'dinheiro')
    
    const itensClonados = Array.isArray(venda.itens) ? JSON.parse(JSON.stringify(venda.itens)) : []
    setItensVenda(itensClonados)
    setItensOriginais(itensClonados)
    
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
    setDesconto(0)
    setValorRecebido('')
  }

  const enviarComprovanteWhatsApp = (codigoVenda, nomeCli, telCli, totalVenda) => {
    if (!telCli) {
      alert('Este cliente não possui telefone cadastrado!')
      return
    }

    const numLimpo = telCli.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo

    const mensagem = encodeURIComponent(
      `Olá, ${nomeCli}!\n` +
      `Obrigado por comprar conosco!\n\n` +
      `Pedido: *${codigoVenda}*\n` +
      `Total: *R$ ${Number(totalVenda).toFixed(2)}*\n\n` +
      `Qualquer dúvida, estamos à disposição!`
    )

    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${mensagem}`, '_blank')
  }

  const finalizarVenda = async () => {
    if (itensVenda.length === 0) {
      alert('Adicione itens à venda.')
      return
    }

    // Validação mandatória: crediário precisa de cliente identificado
    if (formaPagamento === 'crediario' && !clienteSelecionado) {
      alert('Atenção: Para registrar venda no Crediário / A Prazo, selecione um cliente cadastrado.')
      return
    }

    if (formaPagamento === 'dinheiro' && valorRecebido && numValorRecebido < totalComDesconto) {
      alert(`O valor entregue (R$ ${numValorRecebido.toFixed(2)}) é menor que o total (R$ ${totalComDesconto.toFixed(2)})!`)
      return
    }

    setSalvando(true)
    const clienteId = clienteSelecionado ? parseInt(clienteSelecionado) : null
    const clienteObj = clientes.find(c => c.id === clienteId)
    const nomeCliente = clienteObj ? clienteObj.nome : 'Cliente Avulso'
    const telefoneCliente = clienteObj ? clienteObj.telefone : null

    try {
      if (vendaEditando) {
        // 1. Rebalanceamento de Estoque na Edição
        const mapaOriginal = {}
        itensOriginais.forEach(i => {
          mapaOriginal[i.produtoId] = (mapaOriginal[i.produtoId] || 0) + i.quantidade
        })

        const mapaNovo = {}
        itensVenda.forEach(i => {
          mapaNovo[i.produtoId] = (mapaNovo[i.produtoId] || 0) + i.quantidade
        })

        const todosProdutoIds = Array.from(new Set([...Object.keys(mapaOriginal), ...Object.keys(mapaNovo)]))

        for (const prodIdStr of todosProdutoIds) {
          const prodId = parseInt(prodIdStr)
          const qtdAntiga = mapaOriginal[prodId] || 0
          const qtdNova = mapaNovo[prodId] || 0
          const diferenca = qtdNova - qtdAntiga

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

        // 2. Atualiza a venda
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

        // 3. Atualiza ou cria título no Contas a Receber se mudou para crediário
        if (formaPagamento === 'crediario') {
          const dataVencimento = new Date()
          dataVencimento.setDate(dataVencimento.getDate() + 30)

          const { data: contaExistente } = await supabase
            .from('contas_a_receber')
            .select('id')
            .like('descricao', `Venda #${vendaEditando.id}%`)
            .maybeSingle()

          if (contaExistente) {
            await supabase
              .from('contas_a_receber')
              .update({
                valor: totalComDesconto,
                cliente_id: clienteId,
                descricao: `Venda #${vendaEditando.id} - ${nomeCliente}`
              })
              .eq('id', contaExistente.id)
          } else {
            await supabase.from('contas_a_receber').insert([
              {
                descricao: `Venda #${vendaEditando.id} - ${nomeCliente}`,
                valor: totalComDesconto,
                vencimento: dataVencimento.toISOString().split('T')[0],
                status: 'pendente',
                cliente_id: clienteId
              }
            ])
          }
        }

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
        // Criação de Nova Venda
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

        // Se a forma escolhida for Crediário, lança no Contas a Receber
        if (formaPagamento === 'crediario') {
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

        // Baixa regular do estoque
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
        setDesconto(0)
        setValorRecebido('')
      }
    } catch (err) {
      alert('Erro ao processar venda: ' + err.message)
    }

    setSalvando(false)
    await carregarDados()
  }

  return (
    <div className="vendas-wrapper">
      <style>{`
        .vendas-wrapper { max-width: 1200px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: 500; display: flex; alignItems: center; gap: 6px; }
        .form-container, .table-container { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 1.5rem; }
        .form-section h2, .table-container h2 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem; }
        .form-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .form-group { display: flex; flex-direction: column; flex: 1; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
        .form-group input, .form-group select { height: 42px; padding: 0 0.85rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff; color: #0f172a; font-size: 0.95rem; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #2563eb; }
        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; padding: 0.65rem 1.25rem; font-size: 0.9rem; transition: all 0.15s ease; }
        .btn:active { transform: scale(0.98); }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-success { background: #10b981; color: #ffffff; }
        .btn-success:hover { background: #059669; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-danger:hover { background: #fecaca; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
        .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; border-radius: 6px; }
        .btn-lg { padding: 0.85rem 1.75rem; font-size: 1.05rem; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 1rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }
        .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-info { background: #e0f2fe; color: #0369a1; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .total-section { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .total-info { display: flex; align-items: baseline; gap: 0.5rem; }
        .total-info span:first-child { font-size: 1rem; color: #64748b; font-weight: 500; }
        .total-value { font-size: 1.85rem; font-weight: 800; letter-spacing: -0.03em; color: #2563eb; }
        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 0.75rem; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">
          {vendaEditando ? `Editando Venda #${formatarIdVenda(vendaEditando.id)}` : 'Frente de Caixa (PDV)'}
        </h1>
        <p className="page-subtitle">
          <IconStore /> {DADOS_EMPRESA.nome}
        </p>
      </div>

      {vendaEditando && (
        <div style={{ 
          background: '#fffbeb', 
          border: '1px solid #fef3c7', 
          color: '#92400e', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <span style={{ fontSize: '14px' }}>
            ⚠️ <strong>Modo de Edição Ativo:</strong> Modifique itens, quantidades ou a forma de pagamento. O estoque será ajustado automaticamente.
          </span>
          <button className="btn btn-sm btn-secondary" onClick={cancelarEdicao}>
            ✕ Cancelar
          </button>
        </div>
      )}

      <div className="form-container">
        <div className="form-section">
          <h2>Dados da Venda</h2>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
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

            <div className="form-group" style={{ flex: 1.5 }}>
              <label>Forma de Pagamento</label>
              <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                <option value="dinheiro">Dinheiro (À Vista)</option>
                <option value="pix">PIX (À Vista)</option>
                <option value="debito">Cartão de Débito</option>
                <option value="credito">Cartão de Crédito</option>
                <option value="crediario">Crediário (A Prazo / Fiado)</option>
              </select>
            </div>
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

          <button className="btn btn-primary" onClick={adicionarItem} style={{ gap: '6px' }}>
            <IconPlus /> Adicionar ao Pedido
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
                  <td><strong>{item.nomeProduto}</strong></td>
                  <td>R$ {item.preco.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px' }}>
                      <button 
                        style={{ border: 'none', background: '#ffffff', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onClick={() => alterarQtdItem(item.id, -1)}
                      >
                        <IconMinus />
                      </button>
                      <span style={{ fontWeight: 600, minWidth: '18px' }}>{item.quantidade}</span>
                      <button 
                        style={{ border: 'none', background: '#ffffff', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onClick={() => alterarQtdItem(item.id, 1)}
                      >
                        <IconPlus size={14} color="#475569" />
                      </button>
                    </div>
                  </td>
                  <td>R$ {item.subtotal.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-sm btn-danger" onClick={() => removerItem(item.id)} style={{ gap: '4px' }}>
                      <IconTrash /> Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>
                  DESCONTO (R$):
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={desconto} 
                  onChange={(e) => setDesconto(e.target.value)}
                  style={{ width: '120px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              {formaPagamento === 'dinheiro' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>
                    VALOR RECEBIDO (R$):
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0,00"
                    value={valorRecebido} 
                    onChange={(e) => setValorRecebido(e.target.value)}
                    style={{ width: '150px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              )}

              {formaPagamento === 'dinheiro' && troco > 0 && (
                <div style={{ background: '#ecfdf5', padding: '8px 16px', borderRadius: '10px', border: '1px solid #10b981' }}>
                  <span style={{ fontSize: '11px', color: '#047857', display: 'block', fontWeight: 600 }}>TROCO A DEVOLVER:</span>
                  <strong style={{ fontSize: '1.25rem', color: '#047857' }}>R$ {troco.toFixed(2)}</strong>
                </div>
              )}

              {formaPagamento === 'crediario' && (
                <div style={{ background: '#fffbeb', padding: '8px 16px', borderRadius: '10px', border: '1px solid #f59e0b' }}>
                  <span style={{ fontSize: '11px', color: '#b45309', display: 'block', fontWeight: 600 }}>VENDA NO CREDIÁRIO:</span>
                  <strong style={{ fontSize: '0.95rem', color: '#92400e' }}>Será gerado título a receber (30 dias)</strong>
                </div>
              )}
            </div>

            <div className="total-section" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <div className="total-info">
                <span>Total da Venda:</span>
                <span className="total-value">R$ {totalComDesconto.toFixed(2)}</span>
              </div>
              <button 
                className="btn btn-success btn-lg" 
                onClick={finalizarVenda}
                disabled={salvando}
                style={{ gap: '8px' }}
              >
                {salvando ? 'Processando...' : (
                  <>
                    <IconCheck />
                    {vendaEditando ? 'Salvar Alterações' : 'Finalizar Venda'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                const isCrediario = venda.forma_pagamento === 'crediario'

                return (
                  <tr key={venda.id}>
                    <td><strong>{cod}</strong></td>
                    <td>{new Date(venda.created_at).toLocaleString('pt-BR')}</td>
                    <td>{venda.clientes?.nome || 'Cliente Avulso'}</td>
                    <td>R$ {Number(venda.total).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${isCrediario ? 'badge-warning' : 'badge-info'}`}>
                        {isCrediario ? 'CREDIÁRIO' : venda.forma_pagamento?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => iniciarEdicao(venda)}
                          title="Editar venda"
                          style={{ gap: '4px' }}
                        >
                          <IconEdit /> Editar
                        </button>
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => gerarComprovanteVenda(venda)}
                          title="Comprovante PDF"
                          style={{ gap: '4px' }}
                        >
                          <IconFileText /> PDF
                        </button>
                        {tel && (
                          <button 
                            className="btn btn-sm btn-success" 
                            onClick={() => enviarComprovanteWhatsApp(cod, nome, tel, venda.total)}
                            title="Enviar WhatsApp"
                            style={{ gap: '4px' }}
                          >
                            <IconWhatsApp /> Zap
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
