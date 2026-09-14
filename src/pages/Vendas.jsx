import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { gerarComprovanteVenda, gerarTextoCupomWhatsApp, formatarIdVenda, DADOS_EMPRESA } from '../utils/pdfGenerator'

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
  const [variacoes, setVariacoes] = useState([])
  const [clientes, setClientes] = useState([])
  const [taxaCashback, setTaxaCashback] = useState(5)
  const [dadosEmpresa, setDadosEmpresa] = useState(null)
  
  const [clienteSelecionado, setClienteSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [itensVenda, setItensVenda] = useState([])
  const [formaPagamento, setFormaPagamento] = useState('dinheiro')
  const [valorEntrada, setValorEntrada] = useState('')
  
  // Pagamento Misto
  const [linhasMisto, setLinhasMisto] = useState([])
  const [tipoMistoAdd, setTipoMistoAdd] = useState('pix')
  const [valorMistoAdd, setValorMistoAdd] = useState('')

  // Busca inteligente
  const [termoBuscaProduto, setTermoBuscaProduto] = useState('')
  const [produtoSelecionadoObj, setProdutoSelecionadoObj] = useState(null)
  const [mostrarDropdownBusca, setMostrarDropdownBusca] = useState(false)
  const dropdownRef = useRef(null)

  // Modal Escolha de Variação
  const [modalEscolhaVarAberto, setModalEscolhaVarAberto] = useState(false)
  const [prodParaEscolherVar, setProdParaEscolherVar] = useState(null)

  // Câmera
  const [modalCameraAberto, setModalCameraAberto] = useState(false)
  const [html5QrCodeScanner, setHtml5QrCodeScanner] = useState(null)

  const [desconto, setDesconto] = useState(0)
  const [usarCashback, setUsarCashback] = useState(false)
  const [valorRecebido, setValorRecebido] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Fechamento de Caixa
  const [modalCaixaAberto, setModalCaixaAberto] = useState(false)
  const [vendasDoDia, setVendasDoDia] = useState([])
  const [carregandoCaixa, setCarregandoCaixa] = useState(false)

  const carregarDados = async () => {
    const { data: prodData } = await supabase.from('produtos').select('*').order('nome')
    const { data: varData } = await supabase.from('variacoes_grade').select('*')
    const { data: cliData } = await supabase.from('clientes').select('*').order('nome')
    const { data: cfgData } = await supabase.from('configuracoes').select('*')

    if (prodData) setProdutos(prodData)
    if (varData) setVariacoes(varData)
    if (cliData) setClientes(cliData)

    if (cfgData) {
      const mapa = {}
      cfgData.forEach(c => { mapa[c.chave] = c.valor })
      setTaxaCashback(parseFloat(mapa['cashback_percentual']) || 5)
      setDadosEmpresa({
        nome: mapa['empresa_nome'],
        documento: mapa['empresa_documento'],
        telefone: mapa['empresa_telefone'],
        endereco: mapa['empresa_endereco'],
        cidadeUf: mapa['empresa_cidade_uf'],
        instagram: mapa['empresa_instagram'],
        mensagemCupom: mapa['empresa_mensagem_cupom']
      })
    }
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
    const temNaVar = variacoes.some(v => v.produto_id === p.id && v.codigo_barras && v.codigo_barras.toLowerCase().includes(t))
    return p.nome.toLowerCase().includes(t) || (p.codigo_barras && p.codigo_barras.toLowerCase().includes(t)) || temNaVar
  }).slice(0, 8)

  const selecionarProdutoBusca = (produto) => {
    const vars = variacoes.filter(v => v.produto_id === produto.id)
    if (vars.length > 0) {
      setProdParaEscolherVar(produto)
      setModalEscolhaVarAberto(true)
      setMostrarDropdownBusca(false)
    } else {
      setProdutoSelecionadoObj(produto)
      setTermoBuscaProduto(produto.nome)
      setMostrarDropdownBusca(false)
    }
  }

  const adicionarItemAoPedido = (produto, qtdParam = 1, variacao = null) => {
    if (!produto) return
    const qtd = parseInt(qtdParam) || 1
    if (qtd <= 0) return

    const itemKey = variacao ? `${produto.id}-${variacao.id}` : `${produto.id}-base`
    const estoqueDisponivel = variacao ? variacao.estoque : produto.estoque

    const itemExistente = itensVenda.find(i => i.itemKey === itemKey)
    const qtdTotalPretendida = (itemExistente ? itemExistente.quantidade : 0) + qtd

    if (estoqueDisponivel < qtdTotalPretendida) {
      alert(`Estoque insuficiente! Disponível: ${estoqueDisponivel} un.`)
      return
    }

    const nomeFormatado = variacao 
      ? `${produto.nome} (${[variacao.tamanho, variacao.cor].filter(Boolean).join('/')})`
      : produto.nome

    if (itemExistente) {
      setItensVenda(itensVenda.map(item => 
        item.itemKey === itemKey 
          ? { ...item, quantidade: item.quantidade + qtd, subtotal: (item.quantidade + qtd) * item.preco }
          : item
      ))
    } else {
      setItensVenda([...itensVenda, {
        id: Date.now(),
        itemKey,
        produtoId: produto.id,
        variacaoId: variacao ? variacao.id : null,
        nomeProduto: nomeFormatado,
        preco: Number(produto.preco) || 0,
        preco_custo: Number(produto.preco_custo) || 0,
        quantidade: qtd,
        subtotal: (Number(produto.preco) || 0) * qtd
      }])
    }

    setProdutoSelecionadoObj(null)
    setTermoBuscaProduto('')
    setQuantidade('1')
  }

  const handleKeyDownBusca = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const codigoLimpo = termoBuscaProduto.trim()

      const varExata = variacoes.find(v => v.codigo_barras && v.codigo_barras.trim() === codigoLimpo)
      if (varExata) {
        const prodPai = produtos.find(p => p.id === varExata.produto_id)
        if (prodPai) {
          adicionarItemAoPedido(prodPai, quantidade, varExata)
          return
        }
      }

      const porCodigo = produtos.find(p => p.codigo_barras && p.codigo_barras.trim() === codigoLimpo)
      if (porCodigo) {
        const vars = variacoes.filter(v => v.produto_id === porCodigo.id)
        if (vars.length > 0) {
          setProdParaEscolherVar(porCodigo)
          setModalEscolhaVarAberto(true)
        } else {
          adicionarItemAoPedido(porCodigo, quantidade)
        }
        return
      }

      if (produtoSelecionadoObj) {
        adicionarItemAoPedido(produtoSelecionadoObj, quantidade)
        return
      }

      if (produtosFiltradosBusca.length === 1) {
        selecionarProdutoBusca(produtosFiltradosBusca[0])
      }
    }
  }

  // Câmera do Celular
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
          const codigo = decodedText.trim()

          const varAchada = variacoes.find(v => v.codigo_barras && v.codigo_barras.trim() === codigo)
          if (varAchada) {
            const prod = produtos.find(p => p.id === varAchada.produto_id)
            if (prod) {
              adicionarItemAoPedido(prod, 1, varAchada)
              fecharScannerCamera(html5QrCode)
              return alert(`✅ ${prod.nome} (${varAchada.tamanho}) adicionado!`)
            }
          }

          const prod = produtos.find(p => p.codigo_barras && p.codigo_barras.trim() === codigo)
          if (prod) {
            fecharScannerCamera(html5QrCode)
            const vars = variacoes.filter(v => v.produto_id === prod.id)
            if (vars.length > 0) {
              setProdParaEscolherVar(prod)
              setModalEscolhaVarAberto(true)
            } else {
              adicionarItemAoPedido(prod, 1)
              alert(`✅ ${prod.nome} adicionado!`)
            }
          } else {
            alert(`Código "${codigo}" não cadastrado.`)
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

  const clienteAtual = clientes.find(c => c.id === parseInt(clienteSelecionado))
  const saldoCashbackDisponivel = Number(clienteAtual?.saldo_cashback || 0)

  const subtotal = itensVenda.reduce((sum, item) => sum + item.subtotal, 0)
  const descontoManual = parseFloat(desconto) || 0
  const valorAbatidoCashback = usarCashback ? Math.min(subtotal - descontoManual, saldoCashbackDisponivel) : 0
  const totalComDesconto = Math.max(0, subtotal - descontoManual - valorAbatidoCashback)
  const novoCashbackGerado = totalComDesconto * (taxaCashback / 100)

  // Lógica Pagamento Misto
  const totalPagoMisto = linhasMisto.reduce((s, l) => s + Number(l.valor || 0), 0)
  const restanteMisto = Math.max(0, totalComDesconto - totalPagoMisto)

  const adicionarLinhaMisto = () => {
    const val = parseFloat(valorMistoAdd) || 0
    if (val <= 0) return alert('Informe um valor válido maior que zero.')
    if (val > (restanteMisto + 0.001)) {
      return alert(`O valor (R$ ${val.toFixed(2)}) ultrapassa o restante a pagar (R$ ${restanteMisto.toFixed(2)})!`)
    }

    setLinhasMisto([...linhasMisto, { id: Date.now(), tipo: tipoMistoAdd, valor: val }])
    setValorMistoAdd('')
  }

  const removerLinhaMisto = (id) => {
    setLinhasMisto(linhasMisto.filter(l => l.id !== id))
  }

  // Troco / Entrada
  const numValorRecebido = parseFloat(valorRecebido) || 0
  const troco = formaPagamento === 'dinheiro' && numValorRecebido > totalComDesconto ? numValorRecebido - totalComDesconto : 0
  const numValorEntrada = parseFloat(valorEntrada) || 0
  const saldoRestanteCrediario = Math.max(0, totalComDesconto - numValorEntrada)

  // Resumo do Fechamento de Caixa com Suporte a Pagamento Misto
  const abrirFechamentoCaixa = async () => {
    setCarregandoCaixa(true)
    setModalCaixaAberto(true)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const { data } = await supabase.from('vendas').select('*, clientes(nome)').gte('created_at', hoje.toISOString()).order('created_at', { ascending: true })
    if (data) setVendasDoDia(data)
    setCarregandoCaixa(false)
  }

  const resumoTotais = vendasDoDia.reduce((acc, v) => {
    const total = Number(v.total || 0)
    acc.totalGeral += total
    acc.qtdPedidos += 1

    if (v.forma_pagamento === 'misto' && Array.isArray(v.pagamentos_detalhe)) {
      v.pagamentos_detalhe.forEach(p => {
        const val = Number(p.valor || 0)
        if (p.tipo === 'dinheiro') acc.dinheiro += val
        else if (p.tipo === 'pix') acc.pix += val
        else if (p.tipo === 'debito') acc.debito += val
        else if (p.tipo === 'credito') acc.credito += val
        else if (p.tipo === 'crediario') acc.crediario += val
      })
    } else {
      if (v.forma_pagamento === 'dinheiro') acc.dinheiro += total
      else if (v.forma_pagamento === 'pix') acc.pix += total
      else if (v.forma_pagamento === 'debito') acc.debito += total
      else if (v.forma_pagamento === 'credito') acc.credito += total
      else if (v.forma_pagamento === 'crediario') acc.crediario += total
    }
    return acc
  }, { totalGeral: 0, qtdPedidos: 0, dinheiro: 0, pix: 0, debito: 0, credito: 0, crediario: 0 })

  const alterarQtdItem = (id, delta) => {
    setItensVenda(itensVenda.map(item => {
      if (item.id === id) {
        const novaQtd = item.quantidade + delta
        if (novaQtd <= 0) return null

        let estMax = 9999
        if (item.variacaoId) {
          const v = variacoes.find(x => x.id === item.variacaoId)
          estMax = v ? v.estoque : 9999
        } else {
          const p = produtos.find(x => x.id === item.produtoId)
          estMax = p ? p.estoque : 9999
        }

        if (delta > 0 && novaQtd > estMax) {
          alert(`Estoque máximo atingido (${estMax} un)!`)
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

  // FINALIZAR VENDA
  const finalizarVenda = async () => {
    if (itensVenda.length === 0) return alert('Adicione produtos à venda.')
    
    // Validações do Misto
    if (formaPagamento === 'misto') {
      if (Math.abs(totalPagoMisto - totalComDesconto) > 0.01) {
        return alert(`O valor total das formas de pagamento (R$ ${totalPagoMisto.toFixed(2)}) deve ser exatamente igual ao total da venda (R$ ${totalComDesconto.toFixed(2)})!`)
      }
      const temCrediarioMisto = linhasMisto.some(l => l.tipo === 'crediario')
      if (temCrediarioMisto && !clienteSelecionado) {
        return alert('Para incluir Crediário no pagamento misto, selecione o cliente!')
      }
    }

    if (formaPagamento === 'crediario' && !clienteSelecionado) return alert('Selecione um cliente para venda a prazo.')
    if (formaPagamento === 'crediario' && numValorEntrada > totalComDesconto) return alert('Entrada maior que o total da venda!')

    setSalvando(true)
    const clienteId = clienteSelecionado ? parseInt(clienteSelecionado) : null
    const nomeCliente = clienteAtual ? clienteAtual.nome : 'Cliente Avulso'
    const telefoneCliente = clienteAtual ? clienteAtual.telefone : null

    try {
      const payloadVenda = {
        total: totalComDesconto,
        forma_pagamento: formaPagamento,
        itens: itensVenda,
        cliente_id: clienteId,
        pagamentos_detalhe: formaPagamento === 'misto' ? linhasMisto : []
      }

      const { data: vendaCriada, error: erroVenda } = await supabase
        .from('vendas')
        .insert([payloadVenda])
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

      // Lançamento em Contas a Receber (Crediário Normal ou Parcela do Misto)
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
      } else if (formaPagamento === 'misto') {
        const parcelaCrediario = linhasMisto.find(l => l.tipo === 'crediario')
        if (parcelaCrediario && parcelaCrediario.valor > 0) {
          const dataVencimento = new Date()
          dataVencimento.setDate(dataVencimento.getDate() + 30)

          await supabase.from('contas_a_receber').insert([{
            descricao: `Venda #${vendaCriada.id} (Parcela Crediário) - ${nomeCliente}`,
            valor: Number(parcelaCrediario.valor),
            valor_pago: 0,
            vencimento: dataVencimento.toISOString().split('T')[0],
            status: 'pendente',
            cliente_id: clienteId
          }])
        }
      }

      // Baixa no Estoque
      for (const item of itensVenda) {
        if (item.variacaoId) {
          const v = variacoes.find(x => x.id === item.variacaoId)
          if (v) {
            await supabase.from('variacoes_grade').update({ estoque: Math.max(0, v.estoque - item.quantidade) }).eq('id', item.variacaoId)
          }
        }
        const p = produtos.find(x => x.id === item.produtoId)
        if (p) {
          await supabase.from('produtos').update({ estoque: Math.max(0, p.estoque - item.quantidade) }).eq('id', item.produtoId)
        }
      }

      const codFormatado = formatarIdVenda(vendaCriada.id)

      if (telefoneCliente && confirm(`Venda #${codFormatado} finalizada!\nDeseja enviar o Cupom Digital para o WhatsApp de ${nomeCliente}?`)) {
        const numLimpo = telefoneCliente.replace(/\D/g, '')
        const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo
        const vendaCompleta = { ...vendaCriada, clientes: { nome: nomeCliente, saldo_cashback: saldoFinalCliente } }
        const textoCupom = gerarTextoCupomWhatsApp(vendaCompleta, dadosEmpresa, novoCashbackGerado)
        window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${encodeURIComponent(textoCupom)}`, '_blank')
      } else if (confirm(`Venda #${codFormatado} finalizada!\nDeseja abrir o comprovante para impressão?`)) {
        gerarComprovanteVenda({ ...vendaCriada, clientes: { nome: nomeCliente } }, dadosEmpresa)
      }

      setItensVenda([])
      setClienteSelecionado('')
      setFormaPagamento('dinheiro')
      setValorEntrada('')
      setLinhasMisto([])
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

        /* Bloco de Pagamento Misto */
        .misto-container { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
        .misto-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .misto-title { font-size: 0.78rem; font-weight: 800; color: #334155; text-transform: uppercase; }
        .misto-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 6px; font-size: 0.88rem; }
        
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

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 110; backdrop-filter: blur(2px); padding: 1rem; }
        .modal-card { background: #ffffff; width: 100%; max-width: 480px; border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .var-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin: 1rem 0; }
        .var-btn { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; background: #ffffff; cursor: pointer; text-align: left; transition: all 0.15s; }
        .var-btn:hover { border-color: #2563eb; background: #eff6ff; }
        .var-btn strong { display: block; color: #0f172a; font-size: 0.95rem; }
        .var-btn span { font-size: 0.75rem; color: #64748b; }

        .modal-camera-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); display: flex; align-items: center; justify-content: center; z-index: 120; padding: 1rem; }
        .modal-camera-box { background: #ffffff; width: 100%; max-width: 440px; border-radius: 18px; padding: 1.5rem; text-align: center; }
        #reader-camera { width: 100%; border-radius: 12px; overflow: hidden; }

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
          <h1 className="page-title">PDV (Frente de Caixa)</h1>
          <p className="page-subtitle"><IconStore /> {dadosEmpresa?.nome || DADOS_EMPRESA.nome}</p>
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
              <select value={formaPagamento} onChange={(e) => { setFormaPagamento(e.target.value); setLinhasMisto([]); }}>
                <option value="dinheiro">Dinheiro (À Vista)</option>
                <option value="pix">PIX (À Vista)</option>
                <option value="debito">Cartão de Débito</option>
                <option value="credito">Cartão de Crédito</option>
                <option value="crediario">Crediário (A Prazo / Fiado)</option>
                <option value="misto">⚡ Dividir Pagamento (Misto)</option>
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

          {/* PAINEL DINÂMICO DE PAGAMENTO MISTO */}
          {formaPagamento === 'misto' && (
            <div className="misto-container">
              <div className="misto-header">
                <span className="misto-title">Composição do Pagamento Misto</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: restanteMisto > 0.01 ? '#dc2626' : '#16a34a' }}>
                  {restanteMisto > 0.01 ? `Falta Cobrar: R$ ${restanteMisto.toFixed(2)}` : '✓ Totalmente Coberto!'}
                </span>
              </div>

              {/* Linhas adicionadas */}
              {linhasMisto.map(linha => (
                <div key={linha.id} className="misto-item">
                  <span>Forma: <strong>{linha.tipo.toUpperCase()}</strong></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong>R$ {Number(linha.valor).toFixed(2)}</strong>
                    <button type="button" onClick={() => removerLinhaMisto(linha.id)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}

              {/* Input para adicionar nova forma no misto */}
              {restanteMisto > 0.001 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <select 
                    value={tipoMistoAdd} 
                    onChange={e => setTipoMistoAdd(e.target.value)}
                    style={{ height: '36px', padding: '0 8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="debito">Cartão de Débito</option>
                    <option value="credito">Cartão de Crédito</option>
                    <option value="crediario">Crediário (A Prazo)</option>
                  </select>

                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder={`Valor (máx R$ ${restanteMisto.toFixed(2)})`}
                    value={valorMistoAdd}
                    onChange={e => setValorMistoAdd(e.target.value)}
                    style={{ height: '36px', padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', width: '180px' }}
                  />

                  <button 
                    type="button" 
                    className="btn btn-sm btn-primary"
                    onClick={adicionarLinhaMisto}
                  >
                    + Adicionar Parcela
                  </button>
                </div>
              )}
            </div>
          )}

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
              <label>Buscar Produto ou Variação (Nome ou Código de Barras)</label>
              <input 
                type="text" 
                placeholder="Digite o nome, código da peça ou bipe no teclado..."
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
              if (produtoSelecionadoObj) {
                adicionarItemAoPedido(produtoSelecionadoObj, quantidade)
              } else if (termoBuscaProduto) {
                const exato = produtos.find(p => p.nome.toLowerCase() === termoBuscaProduto.toLowerCase() || (p.codigo_barras && p.codigo_barras === termoBuscaProduto))
                if (exato) selecionarProdutoBusca(exato)
              } else {
                alert('Selecione um produto ou bipe o código.')
              }
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
                <th>Produto / Variação</th>
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
              <button 
                className="btn btn-success btn-lg" 
                onClick={finalizarVenda} 
                disabled={salvando || (formaPagamento === 'misto' && restanteMisto > 0.01)} 
                style={{ gap: '8px' }}
              >
                <IconCheck /> {salvando ? 'Processando...' : 'Finalizar Venda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESCOLHA DE TAMANHO / COR NO PDV */}
      {modalEscolhaVarAberto && prodParaEscolherVar && (
        <div className="modal-overlay" onClick={() => setModalEscolhaVarAberto(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>Escolha o Tamanho / Cor</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{prodParaEscolherVar.nome}</span>
              </div>
              <button onClick={() => setModalEscolhaVarAberto(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>✕</button>
            </div>

            <div className="var-grid">
              {variacoes.filter(v => v.produto_id === prodParaEscolherVar.id).map(v => (
                <button 
                  key={v.id} 
                  className="var-btn"
                  onClick={() => {
                    adicionarItemAoPedido(prodParaEscolherVar, quantidade, v)
                    setModalEscolhaVarAberto(false)
                  }}
                >
                  <strong>{v.tamanho || 'Único'}</strong>
                  <span>{v.cor || 'Padrão'}</span>
                  <div style={{ fontSize: '0.72rem', color: v.estoque > 0 ? '#16a34a' : '#dc2626', marginTop: '4px' }}>
                    {v.estoque > 0 ? `${v.estoque} un disponíveis` : 'Sem estoque'}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setModalEscolhaVarAberto(false)}>Cancelar</button>
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
