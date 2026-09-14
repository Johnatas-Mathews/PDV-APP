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

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconReceipt = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17V7" />
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

  // Câmera / Leitor
  const [modalCameraAberto, setModalCameraAberto] = useState(false)
  const [html5QrCodeScanner, setHtml5QrCodeScanner] = useState(null)

  const [desconto, setDesconto] = useState(0)
  const [usarCashback, setUsarCashback] = useState(false)
  const [valorRecebido, setValorRecebido] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Modal Fechamento Caixa
  const [modalCaixaAberto, setModalCaixaAberto] = useState(false)
  const [vendasDoDia, setVendasDoDia] = useState([])
  const [carregandoCaixa, setCarregandoCaixa] = useState(false)

  const carregarDados = async () => {
    const { data: prodData } = await supabase.from('produtos').select('*').order('nome')
    const { data: cliData } = await supabase.from('clientes').select('*').order('nome')
    const { data: cfgData } = await supabase.from('configuracoes').select('valor').eq('chave', 'cashback_percentual').maybeSingle()

    if (prodData) setProdutos(prodData)
    if (cliData) setClientes(cliData)
    if (cfgData) setTaxaCashback(parseFloat(cfgData.valor) || 0)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdownBusca(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

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

  const adicionarItemAoPedido = (produto, qtdParam = 1) => {
    if (!produto) return
    const qtd = parseInt(qtdParam)
    if (qtd <= 0) return

    const itemExistente = itensVenda.find(i => i.produtoId === produto.id)
    const qtdTotalPretendida = (itemExistente ? itemExistente.quantidade : 0) + qtd

    if (produto.estoque < qtdTotalPretendida) {
      alert(`Estoque insuficiente de "${produto.nome}"! Disponível: ${produto.estoque} un.`)
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

  const handleKeyDownBusca = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
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

  // Câmera
  const abrirScannerCamera = async () => {
    setModalCameraAberto(true)
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
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (navigator.vibrate) navigator.vibrate(100)
          const prod = produtos.find(p => p.codigo_barras && p.codigo_barras.trim() === decodedText.trim())
          if (prod) {
            adicionarItemAoPedido(prod, 1)
            fecharScannerCamera(html5QrCode)
            alert(`✅ ${prod.nome} adicionado ao pedido!`)
          } else {
            alert(`Código "${decodedText}" não cadastrado.`)
          }
        },
        () => {}
      ).catch(err => {
        alert('Erro de câmera: ' + err)
        setModalCameraAberto(false)
      })
    } catch (err) {
      alert('Erro: ' + err.message)
      setModalCameraAberto(false)
    }
  }

  const fecharScannerCamera = (instanciaScanner = html5QrCodeScanner) => {
    if (instanciaScanner) {
      try {
        instanciaScanner.stop().then(() => instanciaScanner.clear()).catch(() => {})
      } catch (e) {}
    }
    setModalCameraAberto(false)
    setHtml5QrCodeScanner(null)
  }

  // Caixa Resumo do Dia
  const abrirFechamentoCaixa = async () => {
    setCarregandoCaixa(true)
    setModalCaixaAberto(true)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('vendas')
      .select('*, clientes(nome)')
      .gte('created_at', hoje.toISOString())
      .order('created_at', { ascending: true })

    if (data) setVendasDoDia(data)
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
        if (delta > 0 && novaQtd > (produto?.estoque || 0)) {
          alert(`Estoque máximo atingido (${produto?.estoque} un)!`)
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

  const finalizarVenda = async () => {
    if (itensVenda.length === 0) return alert('Adicione produtos à venda.')
    if (formaPagamento === 'crediario' && !clienteSelecionado) return alert('Selecione um cliente para venda a prazo.')
    if (formaPagamento === 'crediario' && numValorEntrada > totalComDesconto) return alert('Entrada maior que o total da venda!')

    setSalvando(true)
    const clienteId = clienteSelecionado ? parseInt(clienteSelecionado) : null
    const nomeCliente = clienteAtual ? clienteAtual.nome : 'Cliente Avulso'

    try {
      const { data: vendaCriada, error: erroVenda } = await supabase
        .from('vendas')
        .insert([{ total: totalComDesconto, forma_pagamento: formaPagamento, itens: itensVenda, cliente_id: clienteId }])
        .select()
        .single()

      if (erroVenda) throw erroVenda

      // Saldo Cashback
      let saldoFinalCliente = saldoCashbackDisponivel
      if (clienteId) {
        if (usarCashback) saldoFinalCliente -= valorAbatidoCashback
        saldoFinalCliente += novoCashbackGerado
        await supabase.from('clientes').update({ saldo_cashback: Math.max(0, saldoFinalCliente) }).eq('id', clienteId)
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

      // Baixa estoque
      for (const item of itensVenda) {
        const prodOriginal = produtos.find(p => p.id === item.produtoId)
        if (prodOriginal) {
          await supabase.from('produtos').update({ estoque: Math.max(0, (prodOriginal.estoque || 0) - item.quantidade) }).eq('id', item.produtoId)
        }
      }

      const codFormatado = formatarIdVenda(vendaCriada.id)
      if (confirm(`Venda #${codFormatado} finalizada com sucesso!\nAbrir comprovante PDF agora?`)) {
        gerarComprovanteVenda({ ...vendaCriada, clientes: { nome: nomeCliente } })
      }

      // Limpa para a próxima venda
      setItensVenda([])
      setClienteSelecionado('')
      setFormaPagamento('dinheiro')
      setValorEntrada('')
      setDesconto(0)
      setUsarCashback(false)
      setValorRecebido('')
    } catch (err) {
      alert('Erro ao gravar venda: ' + err.message)
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
        .btn-outline-dark { background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; }
        .btn-outline-dark:hover { background: #f8fafc; }
        .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; border-radius: 6px; }
        .btn-lg { padding: 0.85rem 1.75rem; font-size: 1.05rem; }

        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 1rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }
        .total-section { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .total-value { font-size: 1.85rem; font-weight: 800; color: #2563eb; }
        .cashback-card-alert { background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 12px 16px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }

        .modal-camera-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); display: flex; align-items: center; justify-content: center; z-index: 120; padding: 1rem; }
        .modal-camera-box { background: #ffffff; width: 100%; max-width: 440px; border-radius: 18px; padding: 1.5rem; text-align: center; }
        #reader-camera { width: 100%; border-radius: 12px; overflow: hidden; }

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
          <h1 className="page-title">Frente de Caixa (PDV)</h1>
          <p className="page-subtitle"><IconStore /> {DADOS_EMPRESA.nome}</p>
        </div>

        <button className="btn btn-outline-dark" onClick={abrirFechamentoCaixa} style={{ gap: '8px' }}>
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

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-camera" 
                onClick={abrirScannerCamera}
                title="Bipar com a câmera do celular"
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
              if (!produtoSelecionadoObj) return alert('Selecione um produto ou bipe o código.')
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

              {formaPagamento === 'dinheiro' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>VALOR RECEBIDO (R$):</label>
                  <input type="number" step="0.01" placeholder="0,00" value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)} style={{ width: '140px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
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
              <div>
                <span style={{ fontSize: '1rem', color: '#64748b' }}>Total a Pagar: </span>
                <span className="total-value">R$ {totalComDesconto.toFixed(2)}</span>
              </div>
              <button className="btn btn-success btn-lg" onClick={finalizarVenda} disabled={salvando} style={{ gap: '8px' }}>
                <IconCheck /> {salvando ? 'Processando...' : 'Finalizar Venda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Câmera */}
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

      {/* Modal Caixa */}
      {modalCaixaAberto && (
        <div className="modal-backdrop" onClick={() => setModalCaixaAberto(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h3 className="modal-heading">Fechamento do Dia</h3>
                <p className="modal-sub">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <button onClick={() => setModalCaixaAberto(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>✕</button>
            </div>

            {carregandoCaixa ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Calculando vendas de hoje...</p>
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
                  <div className="caixa-item caixa-gaveta">
                    <div>
                      <strong style={{ color: '#047857', display: 'block' }}>💵 Dinheiro em Gaveta</strong>
                      <span style={{ fontSize: '0.75rem', color: '#065f46' }}>Saldo físico em espécie</span>
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
