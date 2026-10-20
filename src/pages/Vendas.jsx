import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { gerarComprovanteVenda, gerarTextoCupomWhatsApp, formatarIdVenda, DADOS_EMPRESA } from '../utils/pdfGenerator'

const getIntervaloHojeBrasil = () => {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  const inicioDia = new Date(`${ano}-${mes}-${dia}T00:00:00`).toISOString()
  const fimDia = new Date(`${ano}-${mes}-${dia}T23:59:59.999`).toISOString() return { inicioDia, fimDia } }  const IconStore = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /> </svg> )  const IconPlus = ({ size = 16, color = "currentColor" }) => ( <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M5 12h14" /><path d="M12 5v14" /> </svg> )  const IconMinus = ({ size = 14, color = "currentColor" }) => ( <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M5 12h14" /> </svg> )  const IconTrash = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /> </svg> )  const IconCheck = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <polyline points="20 6 9 17 4 12" /> </svg> )  const IconReceipt = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17V7" /> </svg> )  const IconSparkles = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /> </svg> )  const IconCamera = () => ( <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /> <circle cx="12" cy="13" r="3" /> </svg> )  const IconAlertCircle = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /> </svg> )  const IconWhatsApp = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /> </svg> )  export default function Vendas() { const [produtos, setProdutos] = useState([]) const [variacoes, setVariacoes] = useState([]) const [clientes, setClientes] = useState([]) const [taxaCashback, setTaxaCashback] = useState(0) const [diasValidadeCashback, setDiasValidadeCashback] = useState(30) const [limiteAbatimentoCarrinho, setLimiteAbatimentoCarrinho] = useState(50) const [dadosEmpresa, setDadosEmpresa] = useState(null)  const [clienteSelecionado, setClienteSelecionado] = useState('') const [termoBuscaCliente, setTermoBuscaCliente] = useState('') const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false) const dropdownClienteRef = useRef(null)  // Radar de Crediário do Cliente Selecionado const [pendenciasCliente, setPendenciasCliente] = useState([]) const [carregandoPendencias, setCarregandoPendencias] = useState(false) const [modalPendenciasAberto, setModalPendenciasAberto] = useState(false)  const [quantidade, setQuantidade] = useState('1') const [itensVenda, setItensVenda] = useState([]) const [formaPagamento, setFormaPagamento] = useState('dinheiro') const [valorEntrada, setValorEntrada] = useState('')  const [linhasMisto, setLinhasMisto] = useState([]) const [tipoMistoAdd, setTipoMistoAdd] = useState('pix') const [valorMistoAdd, setValorMistoAdd] = useState('')  const [termoBuscaProduto, setTermoBuscaProduto] = useState('') const [produtoSelecionadoObj, setProdutoSelecionadoObj] = useState(null) const [mostrarDropdownBusca, setMostrarDropdownBusca] = useState(false) const dropdownRef = useRef(null)  const [modalEscolhaVarAberto, setModalEscolhaVarAberto] = useState(false) const [prodParaEscolherVar, setProdParaEscolherVar] = useState(null)  const [modalCameraAberto, setModalCameraAberto] = useState(false) const [html5QrCodeScanner, setHtml5QrCodeScanner] = useState(null)  const [descontoGlobal, setDescontoGlobal] = useState(0) const [usarCashback, setUsarCashback] = useState(false) const [valorRecebido, setValorRecebido] = useState('') const [salvando, setSalvando] = useState(false)  // Modal Fechamento / Lista de Vendas do Dia com Estorno const [modalCaixaAberto, setModalCaixaAberto] = useState(false) const [vendasDoDia, setVendasDoDia] = useState([]) const [carregandoCaixa, setCarregandoCaixa] = useState(false) const [estornandoVendaId, setEstornandoVendaId] = useState(null)  const carregarDados = async () => { const { data: prodData } = await supabase.from('produtos').select('*').order('nome') const { data: varData } = await supabase.from('variacoes_grade').select('*') const { data: cliData } = await supabase.from('clientes').select('*').order('nome') const { data: cfgData } = await supabase.from('configuracoes').select('*')  if (prodData) setProdutos(prodData) if (varData) setVariacoes(varData) if (cliData) setClientes(cliData)  if (cfgData) { const mapa = {} cfgData.forEach(c => { mapa[c.chave] = c.valor })  const taxaParsed = parseFloat(mapa['cashback_percentual']) setTaxaCashback(!isNaN(taxaParsed) ? taxaParsed : 0)  const diasParsed = parseInt(mapa['cashback_dias_validade']) setDiasValidadeCashback(!isNaN(diasParsed) ? diasParsed : 30)  const tetoParsed = parseFloat(mapa['cashback_limite_carrinho']) setLimiteAbatimentoCarrinho(!isNaN(tetoParsed) ? tetoParsed : 50)  setDadosEmpresa({ nome: mapa['empresa_nome'], documento: mapa['empresa_documento'], telefone: mapa['empresa_telefone'], endereco: mapa['empresa_endereco'], cidadeUf: mapa['empresa_cidade_uf'], instagram: mapa['empresa_instagram'], mensagemCupom: mapa['empresa_mensagem_cupom'] }) } }  useEffect(() => { carregarDados() }, [])  const verificarPendenciasCliente = async (clienteId) => { if (!clienteId) { setPendenciasCliente([]) return } setCarregandoPendencias(true) try { const { data, error } = await supabase .from('contas_a_receber') .select('*') .eq('cliente_id', parseInt(clienteId)) .eq('status', 'pendente') .order('vencimento', { ascending: true })  if (error) throw error setPendenciasCliente(data \vert{}\vert{} []) } catch (err) { console.error('Erro ao consultar crediário:', err) } setCarregandoPendencias(false) }  useEffect(() => { if (clienteSelecionado) { verificarPendenciasCliente(clienteSelecionado) } else { setPendenciasCliente([]) } }, [clienteSelecionado])  useEffect(() => { const handleClickFora = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) { setMostrarDropdownBusca(false) } if (dropdownClienteRef.current && !dropdownClienteRef.current.contains(e.target)) { setMostrarDropdownCliente(false) } } document.addEventListener('mousedown', handleClickFora) return () => document.removeEventListener('mousedown', handleClickFora) }, [])  const clientesFiltradosBusca = clientes.filter(c => { if (!termoBuscaCliente) return true const t = termoBuscaCliente.toLowerCase() return ( (c.nome && c.nome.toLowerCase().includes(t)) \vert{}\vert{} (c.telefone && c.telefone.includes(t)) \vert{}\vert{} (c.cpf && c.cpf.includes(t)) ) }).slice(0, 8)  const selecionarCliente = (c) => { if (!c) { setClienteSelecionado('') setTermoBuscaCliente('') } else { setClienteSelecionado(String(c.id)) setTermoBuscaCliente(c.nome) } setUsarCashback(false) setMostrarDropdownCliente(false) }  const produtosFiltradosBusca = produtos.filter(p => { if (!termoBuscaProduto) return true const t = termoBuscaProduto.toLowerCase() const temNaVar = variacoes.some(v => v.produto_id === p.id && v.codigo_barras && v.codigo_barras.toLowerCase().includes(t)) return p.nome.toLowerCase().includes(t) \vert{}\vert{} (p.codigo_barras && p.codigo_barras.toLowerCase().includes(t)) \vert{}\vert{} temNaVar }).slice(0, 8)  const selecionarProdutoBusca = (produto) => { const vars = variacoes.filter(v => v.produto_id === produto.id) if (vars.length > 0) { setProdParaEscolherVar(produto) setModalEscolhaVarAberto(true) setMostrarDropdownBusca(false) } else { setProdutoSelecionadoObj(produto) setTermoBuscaProduto(produto.nome) setMostrarDropdownBusca(false) } }  // ADIÇÃO AO PEDIDO COM SUPORTE A DESCONTO INDIVIDUAL const adicionarItemAoPedido = (produto, qtdParam = 1, variacao = null) => { if (!produto) return const qtd = parseInt(qtdParam) \vert{}\vert{} 1 if (qtd <= 0) return  const itemKey = variacao ? `${produto.id}-${variacao.id}` : `${produto.id}-base`
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

    const precoUnit = Number(produto.preco) || 0

    if (itemExistente) {
      setItensVenda(itensVenda.map(item => {
        if (item.itemKey === itemKey) {
          const novaQtd = item.quantidade + qtd
          const descTotal = Number(item.desconto || 0)
          const novoSubtotal = Math.max(0, (novaQtd * item.preco) - descTotal)
          return { ...item, quantidade: novaQtd, subtotal: novoSubtotal }
        }
        return item
      }))
    } else {
      setItensVenda([...itensVenda, {
        id: Date.now(),
        itemKey,
        produtoId: produto.id,
        variacaoId: variacao ? variacao.id : null,
        nomeProduto: nomeFormatado,
        preco: precoUnit,
        preco_custo: Number(produto.preco_custo) || 0,
        quantidade: qtd,
        desconto: 0,
        subtotal: precoUnit * qtd
      }])
    }

    setProdutoSelecionadoObj(null)
    setTermoBuscaProduto('')
    setQuantidade('1')
  }

  // ALTERAR DESCONTO INDIVIDUAL DO ITEM
  const alterarDescontoItem = (id, valorDigitado) => {
    const descNum = parseFloat(String(valorDigitado).replace(',', '.')) || 0

    setItensVenda(itensVenda.map(item => {
      if (item.id === id) {
        const totalBrutoItem = item.quantidade * item.preco
        const descontoAplicado = Math.min(totalBrutoItem, Math.max(0, descNum))
        return {
          ...item,
          desconto: valorDigitado === '' ? '' : descontoAplicado,
          subtotal: Math.max(0, totalBrutoItem - (Number(descontoAplicado) || 0))
        }
      }
      return item
    }))
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
              alert(`✅ ${prod.nome} adicionado!`) } } else { alert(`Código "${codigo}" não cadastrado.`)
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

  const totalPendenteCliente = pendenciasCliente.reduce((sum, c) => {
    return sum + Math.max(0, Number(c.valor || 0) - Number(c.valor_pago || 0))
  }, 0)

  const hojeData = new Date()
  hojeData.setHours(0, 0, 0, 0)
  const temContaVencida = pendenciasCliente.some(c => {
    if (!c.vencimento) return false
    const dVenc = new Date(c.vencimento + 'T00:00:00')
    return dVenc < hojeData
  })

  // CÁLCULOS TOTAIS
  const subtotalItens = itensVenda.reduce((sum, item) => sum + item.subtotal, 0)
  const totalDescontosIndividuais = itensVenda.reduce((sum, item) => sum + (Number(item.desconto) || 0), 0)

  const descontoGlobalManual = parseFloat(descontoGlobal) || 0
  const valorPosDesconto = Math.max(0, subtotalItens - descontoGlobalManual)

  const tetoPermitidoReais = (valorPosDesconto * (limiteAbatimentoCarrinho / 100))
  const valorAbatidoCashback = usarCashback ? Math.min(valorPosDesconto, saldoCashbackDisponivel, tetoPermitidoReais) : 0
  const totalComDesconto = Math.max(0, valorPosDesconto - valorAbatidoCashback)
  const novoCashbackGerado = taxaCashback > 0 ? totalComDesconto * (taxaCashback / 100) : 0

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

  const numValorRecebido = parseFloat(valorRecebido) || 0
  const troco = formaPagamento === 'dinheiro' && numValorRecebido > totalComDesconto ? numValorRecebido - totalComDesconto : 0
  const numValorEntrada = parseFloat(valorEntrada) || 0
  const saldoRestanteCrediario = Math.max(0, totalComDesconto - numValorEntrada)

  const abrirFechamentoCaixa = async () => {
    setCarregandoCaixa(true)
    setModalCaixaAberto(true)
    const { inicioDia, fimDia } = getIntervaloHojeBrasil()

    const { data } = await supabase
      .from('vendas')
      .select('*, clientes(nome)')
      .gte('created_at', inicioDia)
      .lte('created_at', fimDia)
      .neq('status', 'cancelada')
      .order('created_at', { ascending: false })

    if (data) setVendasDoDia(data)
    setCarregandoCaixa(false)
  }

  const estornarVenda = async (venda) => {
    if (!confirm(`Tem certeza que deseja cancelar e estornar a Venda #${venda.id} de R$ ${Number(venda.total).toFixed(2)}?\n\n• As peças voltarão ao estoque\n• O saldo financeiro será estornado\n• O crediário/cashback vinculado será revertido.`)) {
      return
    }

    setEstornandoVendaId(venda.id)
    try {
      if (Array.isArray(venda.itens)) {
        for (const item of venda.itens) {
          const qtdDevolver = Number(item.quantidade || 1)
          if (item.variacaoId) {
            const v = variacoes.find(x => x.id === item.variacaoId)
            const estAtual = v ? Number(v.estoque || 0) : 0
            await supabase.from('variacoes_grade').update({ estoque: estAtual + qtdDevolver }).eq('id', item.variacaoId)
          } else if (item.produtoId) {
            const p = produtos.find(x => x.id === item.produtoId)
            const estAtual = p ? Number(p.estoque || 0) : 0
            await supabase.from('produtos').update({ estoque: estAtual + qtdDevolver }).eq('id', item.produtoId)
          }
        }
      }

      await supabase
        .from('contas_a_receber')
        .delete()
        .ilike('descricao', `%Venda #${venda.id}\%`)  if (venda.cliente_id) { const { data: movs } = await supabase .from('cashback_movimentacoes') .select('*') .eq('venda_id', venda.id)  if (movs && movs.length > 0) { let ajusteSaldo = 0 for (const m of movs) { if (m.tipo === 'credito') ajusteSaldo -= Number(m.valor \vert{}\vert{} 0) if (m.tipo === 'resgate') ajusteSaldo += Number(m.valor \vert{}\vert{} 0) await supabase.from('cashback_movimentacoes').update({ status: 'estornado' }).eq('id', m.id) }  const { data: cliAtualizado } = await supabase.from('clientes').select('saldo_cashback').eq('id', venda.cliente_id).single() if (cliAtualizado) { const novoSaldo = Math.max(0, Number(cliAtualizado.saldo_cashback \vert{}\vert{} 0) + ajusteSaldo) await supabase.from('clientes').update({ saldo_cashback: novoSaldo }).eq('id', venda.cliente_id) } } }  const { error: errVenda } = await supabase .from('vendas') .update({ status: 'cancelada' }) .eq('id', venda.id)  if (errVenda) throw errVenda  alert(`Venda #${venda.id} cancelada com sucesso! O estoque foi restaurado.`)
      await carregarDados()
      await abrirFechamentoCaixa()
    } catch (err) {
      alert('Erro ao estornar venda: ' + err.message)
    }
    setEstornandoVendaId(null)
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
        const descNum = Number(item.desconto) || 0
        const novoSubtotal = Math.max(0, (novaQtd * item.preco) - descNum)
        return { ...item, quantidade: novaQtd, subtotal: novoSubtotal }
      }
      return item
    }).filter(Boolean))
  }

  const removerItem = (id) => {
    setItensVenda(itensVenda.filter(item => item.id !== id))
  }

  const enviarAvisoCobrancaZap = (c) => {
    if (!clienteAtual?.telefone) return alert('Cliente sem telefone cadastrado!')
    const numLimpo = clienteAtual.telefone.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo const saldo = Number(c.valor \vert{}\vert{} 0) - Number(c.valor_pago \vert{}\vert{} 0) const dataVenc = c.vencimento ? new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'a combinar'  const msg = encodeURIComponent( `Olá, ${clienteAtual.nome}! Tudo bem? ✨\n\n` +
      `Passando para lembrar sobre a sua compra em aberto no crediário:\n` +
      `📄 *Referência:* ${c.descricao || 'Compra na Loja'}\n` +
      `💰 *Saldo Pendente:* R$ ${saldo.toFixed(2)}\n` + `📅 *Vencimento:* ${dataVenc}\n\n` +
      `Ficamos à disposição caso precise tirar dúvidas ou queira a chave PIX para acerto. Abraços!`
    )
    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${msg}`, '_blank')
  }

  const finalizarVenda = async () => {
    if (itensVenda.length === 0) return alert('Adicione produtos à venda.')
    
    if (formaPagamento === 'misto') {
      if (Math.abs(totalPagoMisto - totalComDesconto) > 0.01) {
        return alert(`O total das formas de pagamento (R$ ${totalPagoMisto.toFixed(2)}) deve ser exatamente igual ao total da venda (R$ ${totalComDesconto.toFixed(2)})!`)
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
        itens: itensVenda.map(i => ({
          ...i,
          desconto: Number(i.desconto) || 0
        })),
        desconto_global: descontoGlobalManual,
        desconto_total_itens: totalDescontosIndividuais,
        cliente_id: clienteId,
        pagamentos_detalhe: formaPagamento === 'misto' ? linhasMisto : [],
        created_at: new Date().toISOString()
      }

      const { data: vendaCriada, error: erroVenda } = await supabase
        .from('vendas')
        .insert([payloadVenda])
        .select()
        .single()

      if (erroVenda) throw erroVenda

      let saldoFinalCliente = saldoCashbackDisponivel
      if (clienteId) {
        if (usarCashback && valorAbatidoCashback > 0) {
          saldoFinalCliente -= valorAbatidoCashback
          await supabase.from('cashback_movimentacoes').insert([{
            cliente_id: clienteId,
            venda_id: vendaCriada.id,
            tipo: 'resgate',
            valor: valorAbatidoCashback,
            saldo_restante: 0,
            status: 'utilizado',
            observacao: `Resgate aplicado na Venda #${vendaCriada.id}`
          }])
        }

        if (novoCashbackGerado > 0) {
          saldoFinalCliente += novoCashbackGerado
          const dataExp = new Date()
          dataExp.setDate(dataExp.getDate() + (parseInt(diasValidadeCashback) || 30))

          await supabase.from('cashback_movimentacoes').insert([{
            cliente_id: clienteId,
            venda_id: vendaCriada.id,
            tipo: 'credito',
            valor: novoCashbackGerado,
            saldo_restante: novoCashbackGerado,
            data_expiracao: dataExp.toISOString(),
            status: 'ativo',
            observacao: `Bônus gerado na Venda #${vendaCriada.id} (${taxaCashback}%)`
          }])
        }

        await supabase.from('clientes').update({ saldo_cashback: Math.max(0, saldoFinalCliente) }).eq('id', clienteId)
      }

      if (formaPagamento === 'crediario') {
        const dataVencimento = new Date()
        dataVencimento.setDate(dataVencimento.getDate() + 30)

        await supabase.from('contas_a_receber').insert([{
          descricao: `Venda #${vendaCriada.id} -${nomeCliente}`,
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

      if (telefoneCliente && confirm(`Venda #${codFormatado} finalizada!\nDeseja enviar o Cupom Digital para o WhatsApp de${nomeCliente}?`)) {
        const numLimpo = telefoneCliente.replace(/\D/g, '')
        const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo const vendaCompleta = { ...vendaCriada, clientes: { nome: nomeCliente, saldo_cashback: saldoFinalCliente } } const textoCupom = gerarTextoCupomWhatsApp(vendaCompleta, dadosEmpresa, novoCashbackGerado) window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${encodeURIComponent(textoCupom)}`, '_blank') } else if (confirm(`Venda #${codFormatado} finalizada!\nDeseja abrir o comprovante para impressão?`)) {
        gerarComprovanteVenda({ ...vendaCriada, clientes: { nome: nomeCliente } }, dadosEmpresa)
      }

      setItensVenda([])
      setClienteSelecionado('')
      setTermoBuscaCliente('')
      setFormaPagamento('dinheiro')
      setValorEntrada('')
      setLinhasMisto([])
      setDescontoGlobal(0)
      setUsarCashback(false)
      setValorRecebido('')
      setPendenciasCliente([])
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

        .radar-box-ok {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 10px;
          padding: 8px 12px;
          margin-top: 8px;
          font-size: 0.82rem;
          color: #065f46;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .radar-box-warning {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 10px 14px;
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .radar-box-danger {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 10px 14px;
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .btn-ver-radar {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 5px 10px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .btn-ver-radar:hover { background: #f8fafc; border-color: #94a3b8; }

        .misto-container { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
        .misto-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .misto-title { font-size: 0.78rem; font-weight: 800; color: #334155; text-transform: uppercase; }
        .misto-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 6px; font-size: 0.88rem; }

        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; padding: 0.65rem 1.25rem; font-size: 0.9rem; transition: all 0.15s ease; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-success { background: #10b981; color: #ffffff; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-camera { background: #0f172a; color: #ffffff; border-radius: 10px; height: 42px; padding: 0 1rem; gap: 6px; white-space: nowrap; }
        .btn-camera:hover { background: #1e293b; }
        .btn-outline-dark { background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1;
