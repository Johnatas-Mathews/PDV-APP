import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { gerarComprovanteVenda, formatarIdVenda, DADOS_EMPRESA } from '../utils/pdfGenerator'

// Ícones SVG minimalistas nativos
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

const IconReceipt = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17V7" />
  </svg>
)

const IconSparkles = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
)

export default function Vendas() {
  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [vendas, setVendas] = useState([])
  const [taxaCashback, setTaxaCashback] = useState(5) // Porcentagem padrão
  
  const [clienteSelecionado, setClienteSelecionado] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [itensVenda, setItensVenda] = useState([])
  const [formaPagamento, setFormaPagamento] = useState('dinheiro')
  const [valorEntrada, setValorEntrada] = useState('')
  
  const [desconto, setDesconto] = useState(0)
  const [usarCashback, setUsarCashback] = useState(false)
  const [valorRecebido, setValorRecebido] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [vendaEditando, setVendaEditando] = useState(null)
  const [itensOriginais, setItensOriginais] = useState([])

  // Modal de Caixa
  const [modalCaixaAberto, setModalCaixaAberto] = useState(false)
  const [vendasDoDia, setVendasDoDia] = useState([])
  const [carregandoCaixa, setCarregandoCaixa] = useState(false)

  const carregarDados = async () => {
    const { data: prodData } = await supabase.from('produtos').select('*').order('nome')
    const { data: cliData } = await supabase.from('clientes').select('*').order('nome')
    const { data: venData } = await supabase.from('vendas').select('*, clientes(nome, telefone, saldo_cashback)').order('id', { ascending: false }).limit(10)
    
    // Busca a taxa de cashback configurada
    const { data: cfgData } = await supabase.from('configuracoes').select('valor').eq('chave', 'cashback_percentual').maybeSingle()

    if (prodData) setProdutos(prodData)
    if (cliData) setClientes(cliData)
    if (venData) setVendas(venData)
    if (cfgData) setTaxaCashback(parseFloat(cfgData.valor) || 0)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Cliente selecionado atualmente
  const clienteAtual = clientes.find(c => c.id === parseInt(clienteSelecionado))
  const saldoCashbackDisponivel = Number(clienteAtual?.saldo_cashback || 0)

  // Totais e Descontos
  const subtotal = itensVenda.reduce((sum, item) => sum + item.subtotal, 0)
  const descontoManual = parseFloat(desconto) || 0
  const valorAbatidoCashback = usarCashback ? Math.min(subtotal - descontoManual, saldoCashbackDisponivel) : 0
  const totalComDesconto = Math.max(0, subtotal - descontoManual - valorAbatidoCashback)
  
  // Novo cashback que esta compra vai gerar
  const novoCashbackGerado = (totalComDesconto * (taxaCashback / 100))

  const numValorRecebido = parseFloat(valorRecebido) || 0
  const troco = formaPagamento === 'dinheiro' && numValorRecebido > totalComDesconto 
    ? numValorRecebido - totalComDesconto 
    : 0

  const numValorEntrada = parseFloat(valorEntrada) || 0
  const saldoRestanteCrediario = Math.max(0, totalComDesconto - numValorEntrada)

  // Fechamento de caixa
  const abrirFechamentoCaixa = async () => {
    setCarregandoCaixa(true)
    setModalCaixaAberto(true)

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('vendas')
      .select('*, clientes(nome)')
      .gte('created_at', hoje.toISOString())
      .order('created_at', { ascending: true })

    if (!error && data) {
      setVendasDoDia(data)
    }
    setCarregandoCaixa(false)
  }

  const resumoTotais = vendasDoDia.reduce((acc, v) => {
    const total = Number(v.total || 0)
    acc.totalGeral += total
    acc.qtdPedidos += 1
    if (v.forma_pagamento === 'dinheiro') acc.dinheiro += total
    else if (v.forma_pagamento === 'pix') acc.pix += total
    else if (v.forma_pagamento === 'debito') acc.debito += total
    else if (v.forma_pagamento === 'credito') acc.credito += total
    else if (v.forma_pagamento === 'crediario') acc.crediario += total
    return acc
  }, { totalGeral: 0, qtdPedidos: 0, dinheiro: 0, pix: 0, debito: 0, credito: 0, crediario: 0 })

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
      alert(`Estoque insuficiente! Disponível: ${estoqueDisponivelReal} unidades.`)
      return
    }

    if (itemExistente) {
      setItensVenda(itensVenda.map(item => 
        item.produtoId === produto.id 
          ? { ...item, quantidade: item.quantidade + qtd, subtotal: (item.quantidade + qtd) * item.preco }
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

        return { ...item, quantidade: novaQtd, subtotal: novaQtd * item.preco }
      }
      return item
    }).filter(Boolean))
  }

  const removerItem = (id) => {
    setItensVenda(itensVenda.filter(item => item.id !== id))
  }

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
    setUsarCashback(false)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicao = () => {
    setVendaEditando(null)
    setItensOriginais([])
    setItensVenda([])
    setClienteSelecionado('')
    setFormaPagamento('dinheiro')
    setValorEntrada('')
    setDesconto(0)
    setUsarCashback(false)
    setValorRecebido('')
  }

  const enviarComprovanteWhatsApp = (codigoVenda, nomeCli, telCli, totalVenda, novoSaldoCli, cashbackGanho) => {
    if (!telCli) {
      alert('Este cliente não possui telefone cadastrado!')
      return
    }

    const numLimpo = telCli.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo

    let txtCashback = ''
    if (cashbackGanho > 0) {
      txtCashback = `\n🎁 *Você ganhou R$ ${cashbackGanho.toFixed(2)} de Cashback!*\nSeu saldo acumulado agora é: *R$ ${novoSaldoCli.toFixed(2)}* para usar na próxima compra.\n`
    }

    const mensagem = encodeURIComponent(
      `Olá, ${nomeCli}!\n` +
      `Obrigado por comprar conosco no *${DADOS_EMPRESA.nome}*!\n\n` +
      `Pedido: *${codigoVenda}*\n` +
      `Total Pago: *R$ ${Number(totalVenda).toFixed(2)}*\n` +
      txtCashback +
      `\nQualquer dúvida, estamos à disposição!`
    )

    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${mensagem}`, '_blank')
  }

  const finalizarVenda = async () => {
    if (itensVenda.length === 0) {
      alert('Adicione itens à venda.')
      return
    }

    if (formaPagamento === 'crediario' && !clienteSelecionado) {
      alert('Atenção: Para registrar venda no Crediário, selecione um cliente cadastrado.')
      return
    }

    if (formaPagamento === 'crediario' && numValorEntrada > totalComDesconto) {
      alert('O valor de entrada não pode ser maior do que o total da venda!')
      return
    }

    if (formaPagamento === 'dinheiro' && valorRecebido && numValorRecebido < totalComDesconto) {
      alert(`O valor entregue (R$ ${numValorRecebido.toFixed(2)}) é menor que o total (R$ ${totalComDesconto.toFixed(2)})!`)
      return
    }

    setSalvando(true)
    const clienteId = clienteSelecionado ? parseInt(clienteSelecionado) : null
    const nomeCliente = clienteAtual ? clienteAtual.nome : 'Cliente Avulso'
    const telefoneCliente = clienteAtual ? clienteAtual.telefone : null

    try {
      if (vendaEditando) {
        // Modo Edição
        const mapaOriginal = {}
        itensOriginais.forEach(i => { mapaOriginal[i.produtoId] = (mapaOriginal[i.produtoId] || 0) + i.quantidade })
        const mapaNovo = {}
        itensVenda.forEach(i => { mapaNovo[i.produtoId] = (mapaNovo[i.produtoId] || 0) + i.quantidade })

        const todosProdutoIds = Array.from(new Set([...Object.keys(mapaOriginal), ...Object.keys(mapaNovo)]))
        for (const prodIdStr of todosProdutoIds) {
          const prodId = parseInt(prodIdStr)
          const diferenca = (mapaNovo[prodId] || 0) - (mapaOriginal[prodId] || 0)
          if (diferenca !== 0) {
            const prodAtual = produtos.find(p => p.id === prodId)
            if (prodAtual) {
              await supabase.from('produtos').update({ estoque: Math.max(0, (prodAtual.estoque || 0) - diferenca) }).eq('id', prodId)
            }
          }
        }

        const { error: erroUpdate } = await supabase
          .from('vendas')
          .update({ total: totalComDesconto, forma_pagamento: formaPagamento, itens: itensVenda, cliente_id: clienteId })
          .eq('id', vendaEditando.id)

        if (erroUpdate) throw erroUpdate
        alert('Venda atualizada com sucesso!')
        cancelarEdicao()

      } else {
        // Nova Venda
        const { data: vendaCriada, error: erroVenda } = await supabase
          .from('vendas')
          .insert([{ total: totalComDesconto, forma_pagamento: formaPagamento, itens: itensVenda, cliente_id: clienteId }])
          .select()
          .single()

        if (erroVenda) throw erroVenda

        // Processa Cashback (abate o saldo usado e soma o novo ganho)
        let saldoFinalCliente = saldoCashbackDisponivel
        if (clienteId) {
          if (usarCashback) saldoFinalCliente -= valorAbatidoCashback
          saldoFinalCliente += novoCashbackGerado

          await supabase
            .from('clientes')
            .update({ saldo_cashback: Math.max(0, saldoFinalCliente) })
            .eq('id', clienteId)
        }

        // Crediário
        if (formaPagamento === 'crediario') {
          const dataVencimento = new Date()
          dataVencimento.setDate(dataVencimento.getDate() + 30)

          await supabase.from('contas_a_receber').insert([{
            descricao: `Venda #${vendaCriada.id} - ${nomeCliente}`,
            valor: totalComDesconto,
            valor_pago: numValorEntrada,
            vencimento: dataVencimento.toISOString().split('T')[0],
            status: numValorEntrada >= totalComDesconto ? 'pago' : 'pendente',
            cliente_id: clienteId
          }])
        }

        // Baixa regular do estoque
        for (const item of itensVenda) {
          const prodOriginal = produtos.find(p => p.id === item.produtoId)
          if (prodOriginal) {
            await supabase
              .from('produtos')
              .update({ estoque: Math.max(0, (prodOriginal.estoque || 0) - item.quantidade) })
              .eq('id', item.produtoId)
          }
        }

        const codFormatado = formatarIdVenda(vendaCriada.id)

        if (confirm(`Venda ${codFormatado} finalizada! Emitir comprovante PDF?`)) {
          gerarComprovanteVenda({ ...vendaCriada, clientes: { nome: nomeCliente } })
        }

        if (telefoneCliente && confirm('Enviar confirmação da compra pelo WhatsApp com os dados de Cashback?')) {
          enviarComprovanteWhatsApp(codFormatado, nomeCliente, telefoneCliente, totalComDesconto, saldoFinalCliente, novoCashbackGerado)
        }

        setItensVenda([])
        setClienteSelecionado('')
        setFormaPagamento('dinheiro')
        setValorEntrada('')
        setDesconto(0)
        setUsarCashback(false)
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
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: 500; display: flex; align-items: center; gap: 6px; }
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
        .btn-outline-dark { background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; }
        .btn-outline-dark:hover { background: #f8fafc; border-color: #94a3b8; }
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

        /* Card de Fidelidade / Cashback */
        .cashback-card-alert { background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 12px 16px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
        .badge-tag-cashback { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; background: #fef08a; color: #854d0e; }

        /* Modal Fechamento */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
        .modal-sheet { background: #ffffff; width: 100%; max-width: 580px; border-radius: 18px; padding: 1.75rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .modal-top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1.25rem; }
        .modal-heading { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
        .modal-sub { font-size: 0.82rem; color: #64748b; margin-top: 2px; }
        .kpi-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 1.25rem; }
        .kpi-mini { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; }
        .kpi-mini-title { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .kpi-mini-val { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-top: 4px; display: block; }
        .caixa-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; margin-bottom: 6px; font-size: 0.9rem; }
        .caixa-gaveta { background: #ecfdf5; border: 1px solid #a7f3d0; }
        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 0.75rem; }
          .kpi-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            {vendaEditando ? `Editando Venda #${formatarIdVenda(vendaEditando.id)}` : 'Frente de Caixa (PDV)'}
          </h1>
          <p className="page-subtitle">
            <IconStore /> {DADOS_EMPRESA.nome}
          </p>
        </div>

        <button 
          className="btn btn-outline-dark" 
          onClick={abrirFechamentoCaixa}
          style={{ gap: '8px' }}
        >
          <IconReceipt /> Resumo do Dia (Caixa)
        </button>
      </div>

      <div className="form-container">
        <div className="form-section">
          <h2>Dados da Venda</h2>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Cliente</label>
              <select value={clienteSelecionado} onChange={(e) => { setClienteSelecionado(e.target.value); setUsarCashback(false); }}>
                <option value="">Cliente Avulso (Não identificado)</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.saldo_cashback > 0 ? `(Cashback: R$ ${Number(c.saldo_cashback).toFixed(2)})` : ''}
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

            {formaPagamento === 'crediario' && (
              <div className="form-group" style={{ flex: 1 }}>
                <label>Entrada / Pago Agora (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  max={totalComDesconto}
                  placeholder="0,00" 
                  value={valorEntrada} 
                  onChange={(e) => setValorEntrada(e.target.value)} 
                />
              </div>
            )}
          </div>

          {/* Card de Cashback disponível para o cliente */}
          {saldoCashbackDisponivel > 0 && (
            <div className="cashback-card-alert">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconSparkles />
                <div>
                  <strong style={{ color: '#854d0e', fontSize: '0.9rem' }}>
                    {clienteAtual?.nome} possui R$ {saldoCashbackDisponivel.toFixed(2)} de saldo!
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: '#a16207' }}>
                    {usarCashback ? `Abatendo R$ ${valorAbatidoCashback.toFixed(2)} desta compra` : 'Deseja resgatar o cashback nesta venda?'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`btn btn-sm ${usarCashback ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setUsarCashback(!usarCashback)}
              >
                {usarCashback ? '✕ Não usar agora' : '✨ Usar Saldo'}
              </button>
            </div>
          )}
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
                  DESCONTO MANUAL (R$):
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

              {usarCashback && (
                <div style={{ background: '#fefce8', padding: '8px 14px', borderRadius: '10px', border: '1px solid #fef08a' }}>
                  <span style={{ fontSize: '11px', color: '#854d0e', display: 'block', fontWeight: 600 }}>CASHBACK RESGATADO:</span>
                  <strong style={{ fontSize: '1.1rem', color: '#a16207' }}>- R$ {valorAbatidoCashback.toFixed(2)}</strong>
                </div>
              )}

              {clienteAtual && taxaCashback > 0 && (
                <div style={{ background: '#f0fdf4', padding: '8px 14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '11px', color: '#15803d', display: 'block', fontWeight: 600 }}>NOVO CASHBACK ({taxaCashback}%):</span>
                  <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>+ R$ {novoCashbackGerado.toFixed(2)}</strong>
                </div>
              )}

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
                    style={{ width: '140px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
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
                  <span style={{ fontSize: '11px', color: '#b45309', display: 'block', fontWeight: 600 }}>RESTANTE A COBRAR:</span>
                  <strong style={{ fontSize: '1.2rem', color: '#92400e' }}>R$ {saldoRestanteCrediario.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <div className="total-section" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <div className="total-info">
                <span>Total a Pagar:</span>
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

      {/* Tabela de Vendas */}
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
                            onClick={() => enviarComprovanteWhatsApp(cod, nome, tel, venda.total, Number(venda.clientes?.saldo_cashback || 0), 0)}
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

      {/* Modal Fechamento Caixa */}
      {modalCaixaAberto && (
        <div className="modal-backdrop" onClick={() => setModalCaixaAberto(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h3 className="modal-heading">Fechamento do Dia</h3>
                <p className="modal-sub">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => setModalCaixaAberto(false)} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {carregandoCaixa ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Calculando movimentações de hoje...</p>
            ) : (
              <>
                <div className="kpi-row">
                  <div className="kpi-mini">
                    <span className="kpi-mini-title">Total Faturado Hoje</span>
                    <span className="kpi-mini-val" style={{ color: '#2563eb' }}>R$ {resumoTotais.totalGeral.toFixed(2)}</span>
                  </div>
                  <div className="kpi-mini">
                    <span className="kpi-mini-title">Vendas Concluídas</span>
                    <span className="kpi-mini-val">{resumoTotais.qtdPedidos} pedidos</span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                    Conferência por Meio de Pagamento
                  </span>
                  <div className="caixa-item caixa-gaveta">
                    <div>
                      <strong style={{ color: '#047857', display: 'block' }}>💵 Dinheiro em Gaveta</strong>
                      <span style={{ fontSize: '0.75rem', color: '#065f46' }}>Saldo físico em cédulas/moedas</span>
                    </div>
                    <strong style={{ color: '#047857', fontSize: '1.1rem' }}>R$ {resumoTotais.dinheiro.toFixed(2)}</strong>
                  </div>
                  <div className="caixa-item" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span>⚡ PIX</span>
                    <strong>R$ {resumoTotais.pix.toFixed(2)}</strong>
                  </div>
                  <div className="caixa-item" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span>💳 Cartão de Débito</span>
                    <strong>R$ {resumoTotais.debito.toFixed(2)}</strong>
                  </div>
                  <div className="caixa-item" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span>💳 Cartão de Crédito</span>
                    <strong>R$ {resumoTotais.credito.toFixed(2)}</strong>
                  </div>
                  <div className="caixa-item" style={{ background: '#fffbeb', border: '1px solid #fef3c7' }}>
                    <div>
                      <strong style={{ color: '#b45309', display: 'block' }}>📝 Crediário (A Prazo)</strong>
                      <span style={{ fontSize: '0.75rem', color: '#92400e' }}>Lançado em Contas a Receber</span>
                    </div>
                    <strong style={{ color: '#b45309' }}>R$ {resumoTotais.crediario.toFixed(2)}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => setModalCaixaAberto(false)}>
                    Fechar Conferência
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
