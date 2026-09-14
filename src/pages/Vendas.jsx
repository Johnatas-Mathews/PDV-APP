import { useState, useEffect, useRef } from 'react'
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

const IconCamera = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
)

export default function Vendas() {
  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [vendas, setVendas] = useState([])
  const [taxaCashback, setTaxaCashback] = useState(5)
  
  const [clienteSelecionado, setClienteSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [itensVenda, setItensVenda] = useState([])
  const [formaPagamento, setFormaPagamento] = useState('dinheiro')
  const [valorEntrada, setValorEntrada] = useState('')
  
  // Busca inteligente de produtos
  const [termoBuscaProduto, setTermoBuscaProduto] = useState('')
  const [produtoSelecionadoObj, setProdutoSelecionadoObj] = useState(null)
  const [mostrarDropdownBusca, setMostrarDropdownBusca] = useState(false)
  const dropdownRef = useRef(null)

  // Câmera / Leitor de código de barras
  const [modalCameraAberto, setModalCameraAberto] = useState(false)
  const [html5QrCodeScanner, setHtml5QrCodeScanner] = useState(null)

  const [desconto, setDesconto] = useState(0)
  const [usarCashback, setUsarCashback] = useState(false)
  const [valorRecebido, setValorRecebido] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [vendaEditando, setVendaEditando] = useState(null)
  const [itensOriginais, setItensOriginais] = useState([])

  // Modal Caixa
  const [modalCaixaAberto, setModalCaixaAberto] = useState(false)
  const [vendasDoDia, setVendasDoDia] = useState([])
  const [carregandoCaixa, setCarregandoCaixa] = useState(false)

  const carregarDados = async () => {
    const { data: prodData } = await supabase.from('produtos').select('*').order('nome')
    const { data: cliData } = await supabase.from('clientes').select('*').order('nome')
    const { data: venData } = await supabase.from('vendas').select('*, clientes(nome, telefone, saldo_cashback)').order('id', { ascending: false }).limit(10)
    const { data: cfgData } = await supabase.from('configuracoes').select('valor').eq('chave', 'cashback_percentual').maybeSingle()

    if (prodData) setProdutos(prodData)
    if (cliData) setClientes(cliData)
    if (venData) setVendas(venData)
    if (cfgData) setTaxaCashback(parseFloat(cfgData.valor) || 0)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Fecha dropdown de busca ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdownBusca(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  // Produtos filtrados na busca inteligente
  const produtosFiltradosBusca = produtos.filter(p => {
    if (!termoBuscaProduto) return true
    const t = termoBuscaProduto.toLowerCase()
    return p.nome.toLowerCase().includes(t) || (p.codigo_barras && p.codigo_barras.toLowerCase().includes(t))
  }).slice(0, 8)

  const selecionarProdutoBusca = (produto) => {
    setProdutoSelecionadoObj(produto)
    setTermoBuscaProduto(produto.nome)
    setMostrarDropdownBusca(false)
  }

  // Adiciona produto diretamente por objeto (usado também pelo scanner de código de barras)
  const adicionarItemAoPedido = (produto, qtdParam = 1) => {
    if (!produto) return

    const qtd = parseInt(qtdParam)
    if (qtd <= 0) return

    const itemExistente = itensVenda.find(i => i.produtoId === produto.id)
    const qtdTotalPretendida = (itemExistente ? itemExistente.quantidade : 0) + qtd

    const itemOriginal = itensOriginais.find(i => i.produtoId === produto.id)
    const estoqueDisponivelReal = produto.estoque + (itemOriginal ? itemOriginal.quantidade : 0)

    if (estoqueDisponivelReal < qtdTotalPretendida) {
      alert(`Estoque insuficiente de "${produto.nome}"! Disponível: ${estoqueDisponivelReal} un.`)
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

    setProdutoSelecionadoObj(null)
    setTermoBuscaProduto('')
    setQuantidade('1')
  }

  // Trata digitação de leitor USB comum ou Enter no campo
  const handleKeyDownBusca = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Verifica se o texto bate exatamente com o código de barras
      const porCodigo = produtos.find(p => p.codigo_barras && p.codigo_barras.trim() === termoBuscaProduto.trim())
      if (porCodigo) {
        adicionarItemAoPedido(porCodigo, quantidade)
        return
      }

      if (produtoSelecionadoObj) {
        adicionarItemAoPedido(produtoSelecionadoObj, quantidade)
        return
      }

      if (produtosFiltradosBusca.length === 1) {
        adicionarItemAoPedido(produtosFiltradosBusca[0], quantidade)
      }
    }
  }

  // CARREGAR E INICIAR SCANNER DE CÂMERA DO CELULAR VIA CDN
  const abrirScannerCamera = async () => {
    setModalCameraAberto(true)

    // Injeta script html5-qrcode de forma limpa e assíncrona
    if (!window.Html5Qrcode) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
      script.onload = () => iniciarLeitorHtml5()
      document.body.appendChild(script)
    } else {
      setTimeout(() => iniciarLeitorHtml5(), 200)
    }
  }

  const iniciarLeitorHtml5 = () => {
    try {
      const html5QrCode = new window.Html5Qrcode("reader-camera")
      setHtml5QrCodeScanner(html5QrCode)

      const config = { fps: 10, qrbox: { width: 250, height: 160 } }
      html5QrCode.start(
        { facingMode: "environment" }, // Câmera traseira do celular
        config,
        (decodedText) => {
          // Bipou código com sucesso!
          if (navigator.vibrate) navigator.vibrate(100)

          const prod = produtos.find(p => p.codigo_barras && p.codigo_barras.trim() === decodedText.trim())
          if (prod) {
            adicionarItemAoPedido(prod, 1)
            fecharScannerCamera(html5QrCode)
            alert(`✅ ${prod.nome} bipado e adicionado ao pedido!`)
          } else {
            alert(`Código lido: "${decodedText}", mas nenhum produto foi cadastrado com esse código.`)
          }
        },
        () => {} // Erros de frame ignorados silenciosamente
      ).catch(err => {
        alert('Não foi possível acessar a câmera: ' + err)
        setModalCameraAberto(false)
      })
    } catch (err) {
      alert('Erro ao inicializar câmera: ' + err.message)
      setModalCameraAberto(false)
    }
  }

  const fecharScannerCamera = (instanciaScanner = html5QrCodeScanner) => {
    if (instanciaScanner) {
      try {
        instanciaScanner.stop().then(() => {
          instanciaScanner.clear()
        }).catch(() => {})
      } catch (e) {}
    }
    setModalCameraAberto(false)
    setHtml5QrCodeScanner(null)
  }

  // Cliente e Cashback
  const clienteAtual = clientes.find(c => c.id === parseInt(clienteSelecionado))
  const saldoCashbackDisponivel = Number(clienteAtual?.saldo_cashback || 0)

  const subtotal = itensVenda.reduce((sum, item) => sum + item.subtotal, 0)
  const descontoManual = parseFloat(desconto) || 0
  const valorAbatidoCashback = usarCashback ? Math.min(subtotal - descontoManual, saldoCashbackDisponivel) : 0
  const totalComDesconto = Math.max(0, subtotal - descontoManual - valorAbatidoCashback)
  const novoCashbackGerado = totalComDesconto * (taxaCashback / 100)

  const numValorRecebido = parseFloat(valorRecebido) || 0
  const troco = formaPagamento === 'dinheiro' && numValorRecebido > totalComDesconto ? numValorRecebido - totalComDesconto : 0
  const numValorEntrada = parseFloat(valorEntrada) || 0
  const saldoRestanteCrediario = Math.max(0, totalComDesconto - numValorEntrada)

  const alterarQtdItem = (id, delta) => {
    setItensVenda(itensVenda.map(item => {
      if (item.id === id) {
        const produto = produtos.find(p => p.id === item.produtoId)
        const novaQtd = item.quantidade + delta
        if (novaQtd <= 0) return null

        const itemOriginal = itensOriginais.find(i => i.produtoId === item.produtoId)
        const estoqueDisponivelReal = (produto ? produto.estoque : 0) + (itemOriginal ? itemOriginal.quantidade : 0)

        if (delta > 0 && novaQtd > estoqueDisponivelReal) {
          alert(`Estoque máximo atingido (${estoqueDisponivelReal} un)!`)
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
    if (!telCli) return alert('Cliente não possui telefone!')
    const numLimpo = telCli.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo

    let txtCashback = ''
    if (cashbackGanho > 0) {
      txtCashback = `\n🎁 *Você ganhou R$ ${cashbackGanho.toFixed(2)} de Cashback!*\nSaldo acumulado: *R$ ${novoSaldoCli.toFixed(2)}* para a próxima compra.\n`
    }

    const mensagem = encodeURIComponent(
      `Olá, ${nomeCli}!\n` +
      `Obrigado por comprar conosco no *${DADOS_EMPRESA.nome}*!\n\n` +
      `Pedido: *${codigoVenda}*\n` +
      `Total: *R$ ${Number(totalVenda).toFixed(2)}*\n` +
      txtCashback +
      `\nQualquer dúvida, conte conosco!`
    )
    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${mensagem}`, '_blank')
  }

  const finalizarVenda = async () => {
    if (itensVenda.length === 0) return alert('Adicione itens à venda.')
    if (formaPagamento === 'crediario' && !clienteSelecionado) return alert('Selecione um cliente para venda a prazo.')
    if (formaPagamento === 'crediario' && numValorEntrada > totalComDesconto) return alert('Entrada maior que o total da venda!')

    setSalvando(true)
    const clienteId = clienteSelecionado ? parseInt(clienteSelecionado) : null
    const nomeCliente = clienteAtual ? clienteAtual.nome : 'Cliente Avulso'
    const telefoneCliente = clienteAtual ? clienteAtual.telefone : null

    try {
      if (vendaEditando) {
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
        const { data: vendaCriada, error: erroVenda } = await supabase
          .from('vendas')
          .insert([{ total: totalComDesconto, forma_pagamento: formaPagamento, itens: itensVenda, cliente_id: clienteId }])
          .select()
          .single()

        if (erroVenda) throw erroVenda

        let saldoFinalCliente = saldoCashbackDisponivel
        if (clienteId) {
          if (usarCashback) saldoFinalCliente -= valorAbatidoCashback
          saldoFinalCliente += novoCashbackGerado

          await supabase.from('clientes').update({ saldo_cashback: Math.max(0, saldoFinalCliente) }).eq('id', clienteId)
        }

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

        for (const item of itensVenda) {
          const prodOriginal = produtos.find(p => p.id === item.produtoId)
          if (prodOriginal) {
            await supabase.from('produtos').update({ estoque: Math.max(0, (prodOriginal.estoque || 0) - item.quantidade) }).eq('id', item.produtoId)
          }
        }

        const codFormatado = formatarIdVenda(vendaCriada.id)
        if (confirm(`Venda ${codFormatado} finalizada! Imprimir comprovante PDF?`)) {
          gerarComprovanteVenda({ ...vendaCriada, clientes: { nome: nomeCliente } })
        }

        if (telefoneCliente && confirm('Enviar confirmação por WhatsApp com saldo de Cashback?')) {
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
      alert('Erro: ' + err.message)
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
        .form-group { display: flex; flex-direction: column; flex: 1; position: relative; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
        .form-group input, .form-group select { height: 42px; padding: 0 0.85rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff; color: #0f172a; font-size: 0.95rem; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #2563eb; }

        /* Dropdown inteligente de busca */
        .busca-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-height: 260px; overflow-y: auto; z-index: 50; }
        .busca-item { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .busca-item:hover { background: #eff6ff; }
        .busca-item-title { font-weight: 600; color: #0f172a; font-size: 0.9rem; }
        .busca-item-sub { font-size: 0.75rem; color: #64748b; }

        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; padding: 0.65rem 1.25rem; font-size: 0.9rem; transition: all 0.15s ease; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-success { background: #10b981; color: #ffffff; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-camera { background: #0f172a; color: #ffffff; border-radius: 10px; height: 42px; padding: 0 1rem; gap: 6px; white-space: nowrap; }
        .btn-camera:hover { background: #1e293b; }
        .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; border-radius: 6px; }
        .btn-lg { padding: 0.85rem 1.75rem; font-size: 1.05rem; }

        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 1rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }
        .total-section { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .total-value { font-size: 1.85rem; font-weight: 800; color: #2563eb; }
        .cashback-card-alert { background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 12px 16px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }

        /* Modal Câmera / Leitor */
        .modal-camera-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); display: flex; align-items: center; justify-content: center; z-index: 120; padding: 1rem; }
        .modal-camera-box { background: #ffffff; width: 100%; max-width: 440px; border-radius: 18px; padding: 1.5rem; text-align: center; }
        #reader-camera { width: 100%; border-radius: 12px; overflow: hidden; }

        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 0.75rem; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">{vendaEditando ? `Editando Venda #${formatarIdVenda(vendaEditando.id)}` : 'Frente de Caixa (PDV)'}</h1>
          <p className="page-subtitle"><IconStore /> {DADOS_EMPRESA.nome}</p>
        </div>
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

          {saldoCashbackDisponivel > 0 && (
            <div className="cashback-card-alert">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconSparkles />
                <div>
                  <strong style={{ color: '#854d0e', fontSize: '0.9rem' }}>{clienteAtual?.nome} possui R$ {saldoCashbackDisponivel.toFixed(2)} de saldo!</strong>
                  <div style={{ fontSize: '0.78rem', color: '#a16207' }}>
                    {usarCashback ? `Abatendo R$ ${valorAbatidoCashback.toFixed(2)} desta compra` : 'Deseja abater o saldo nesta compra?'}
                  </div>
                </div>
              </div>
              <button type="button" className={`btn btn-sm ${usarCashback ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setUsarCashback(!usarCashback)}>
                {usarCashback ? '✕ Não usar agora' : '✨ Usar Saldo'}
              </button>
            </div>
          )}
        </div>

        {/* BUSCA RÁPIDA + CÂMERA DO CELULAR */}
        <div className="form-section">
          <h2>Adicionar Produtos</h2>
          <div className="form-row">
            <div className="form-group" style={{ flex: 3 }} ref={dropdownRef}>
              <label>Buscar Produto (Nome ou Código de Barras)</label>
              <input 
                type="text" 
                placeholder="Digite o nome, código ou bipe no teclado..."
                value={termoBuscaProduto}
                onChange={e => { setTermoBuscaProduto(e.target.value); setMostrarDropdownBusca(true); }}
                onFocus={() => setMostrarDropdownBusca(true)}
                onKeyDown={handleKeyDownBusca}
              />

              {mostrarDropdownBusca && produtosFiltradosBusca.length > 0 && (
                <div className="busca-dropdown">
                  {produtosFiltradosBusca.map(prod => (
                    <div 
                      key={prod.id} 
                      className="busca-item"
                      onClick={() => selecionarProdutoBusca(prod)}
                    >
                      <div>
                        <div className="busca-item-title">{prod.nome}</div>
                        <div className="busca-item-sub">
                          Estoque: {prod.estoque || 0} un {prod.codigo_barras ? `• Cód: ${prod.codigo_barras}` : ''}
                        </div>
                      </div>
                      <strong style={{ color: '#2563eb' }}>R$ {Number(prod.preco).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BOTÃO DA CÂMERA DO CELULAR */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-camera" 
                onClick={abrirScannerCamera}
                title="Bipar código com a câmera do celular"
              >
                <IconCamera /> Bipar com Câmera
              </button>
            </div>

            <div className="form-group" style={{ flex: 0.8 }}>
              <label>Qtd</label>
              <input 
                type="number" 
                min="1" 
                value={quantidade} 
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (!produtoSelecionadoObj && termoBuscaProduto) {
                const exato = produtos.find(p => p.nome.toLowerCase() === termoBuscaProduto.toLowerCase() || (p.codigo_barras && p.codigo_barras === termoBuscaProduto))
                if (exato) return adicionarItemAoPedido(exato, quantidade)
              }
              if (!produtoSelecionadoObj) return alert('Selecione um produto na lista ou bipe o código.')
              adicionarItemAoPedido(produtoSelecionadoObj, quantidade)
            }} 
            style={{ gap: '6px' }}
          >
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
                      <button style={{ border: 'none', background: '#fff', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }} onClick={() => alterarQtdItem(item.id, -1)}><IconMinus /></button>
                      <span style={{ fontWeight: 600 }}>{item.quantidade}</span>
                      <button style={{ border: 'none', background: '#fff', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }} onClick={() => alterarQtdItem(item.id, 1)}><IconPlus size={14} color="#475569" /></button>
                    </div>
                  </td>
                  <td>R$ {item.subtotal.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-sm btn-danger" onClick={() => removerItem(item.id)}><IconTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>DESCONTO MANUAL (R$):</label>
                <input type="number" step="0.01" min="0" value={desconto} onChange={(e) => setDesconto(e.target.value)} style={{ width: '120px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
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
            </div>

            <div className="total-section" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '1rem', color: '#64748b' }}>Total a Pagar: </span>
                <span className="total-value">R$ {totalComDesconto.toFixed(2)}</span>
              </div>
              <button className="btn btn-success btn-lg" onClick={finalizarVenda} disabled={salvando} style={{ gap: '8px' }}>
                <IconCheck /> {salvando ? 'Processando...' : (vendaEditando ? 'Salvar Alterações' : 'Finalizar Venda')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SCANNER DE CÂMERA DO CELULAR */}
      {modalCameraAberto && (
        <div className="modal-camera-overlay">
          <div className="modal-camera-box">
            <h3 style={{ marginBottom: '8px', color: '#0f172a' }}>📷 Aponte a Câmera para o Código</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>Posicione o código de barras no centro do quadrado</p>
            <div id="reader-camera"></div>
            <button className="btn btn-secondary" onClick={() => fecharScannerCamera()} style={{ marginTop: '1rem', width: '100%' }}>
              ✕ Fechar Leitor
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
