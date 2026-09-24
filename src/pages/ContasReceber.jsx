import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// Ícones SVG minimalistas nativos
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
)

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconHistory = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><polyline points="12 7 12 12 15 15" />
  </svg>
)

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)

const IconPrinter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)

const IconWhatsApp = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

export default function ContasReceber() {
  const [contas, setContas] = useState([])
  const [clientes, setClientes] = useState([])
  const [dadosEmpresa, setDadosEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendente') // 'todas', 'pendente', 'pago'
  const [busca, setBusca] = useState('')

  // Modais de Recebimento
  const [contaModalHist, setContaModalHist] = useState(null)
  const [contaModalReceber, setContaModalReceber] = useState(null)
  const [valorReceberInput, setValorReceberInput] = useState('')
  const [formaPagamentoInput, setFormaPagamentoInput] = useState('PIX')
  const [salvandoRecebimento, setSalvandoRecebimento] = useState(false)

  // Modal de Comprovante de Pagamento (Visualizar / Imprimir / WhatsApp)
  const [comprovanteAtual, setComprovanteAtual] = useState(null)

  // Modal Novo Título Manual (Dívidas Antigas)
  const [modalNovoTitulo, setModalNovoTitulo] = useState(false)
  const [clienteSelecionadoObj, setClienteSelecionadoObj] = useState(null)
  const [termoBuscaCliente, setTermoBuscaCliente] = useState('')
  const [mostrarDropdownCli, setMostrarDropdownCli] = useState(false)
  const dropdownCliRef = useRef(null)

  const [novaDescricao, setNovaDescricao] = useState('')
  const [novoValorTotal, setNovoValorTotal] = useState('')
  const [novoValorPago, setNovoValorPago] = useState('')
  const [novoVencimento, setNovoVencimento] = useState('')
  const [salvandoNovoTitulo, setSalvandoNovoTitulo] = useState(false)

  const carregarDados = async () => {
    setLoading(true)
    try {
      const { data: cliData } = await supabase
        .from('clientes')
        .select('id, nome, telefone, cpf')
        .order('nome', { ascending: true })

      if (cliData) setClientes(cliData)

      // Carrega dados da empresa para os comprovantes
      const { data: cfgData } = await supabase.from('configuracoes').select('*')
      if (cfgData) {
        const mapa = {}
        cfgData.forEach(c => { mapa[c.chave] = c.valor })
        setDadosEmpresa({
          nome: mapa['empresa_nome'] || 'TECCO',
          documento: mapa['empresa_documento'] || '',
          telefone: mapa['empresa_telefone'] || '',
          endereco: mapa['empresa_endereco'] || '',
          cidade: mapa['empresa_cidade_uf'] || ''
        })
      }

      let query = supabase
        .from('contas_a_receber')
        .select('*, clientes(nome, telefone)')
        .order('vencimento', { ascending: true })

      if (filtro !== 'todas') {
        query = query.eq('status', filtro)
      }

      const { data, error } = await query
      if (error) throw error

      if (data) {
        setContas(data)
        if (contaModalHist) {
          const atualizada = data.find(c => c.id === contaModalHist.id)
          if (atualizada) setContaModalHist(atualizada)
        }
      }
    } catch (err) {
      alert('Erro ao carregar contas: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [filtro])

  // Fecha dropdown do cliente se clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownCliRef.current && !dropdownCliRef.current.contains(e.target)) {
        setMostrarDropdownCli(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const clientesFiltradosBusca = clientes.filter(c => {
    if (!termoBuscaCliente) return true
    const t = termoBuscaCliente.toLowerCase()
    return (
      c.nome.toLowerCase().includes(t) ||
      (c.telefone && c.telefone.includes(t)) ||
      (c.cpf && c.cpf.includes(t))
    )
  }).slice(0, 6)

  const selecionarCliente = (c) => {
    setClienteSelecionadoObj(c)
    setTermoBuscaCliente(c.nome)
    setMostrarDropdownCli(false)
  }

  const limparSelecaoCliente = () => {
    setClienteSelecionadoObj(null)
    setTermoBuscaCliente('')
  }

  const abrirModalRecebimento = (conta) => {
    const total = Number(conta.valor || 0)
    const pago = Number(conta.valor_pago || 0)
    const restante = Math.max(0, total - pago)
    setContaModalReceber(conta)
    setValorReceberInput(restante.toFixed(2))
    setFormaPagamentoInput('PIX')
  }

  const confirmarRecebimento = async () => {
    if (!contaModalReceber) return

    const total = Number(contaModalReceber.valor || 0)
    const pagoAteAgora = Number(contaModalReceber.valor_pago || 0)
    const saldoRestante = Math.max(0, total - pagoAteAgora)

    const numRecebido = parseFloat(String(valorReceberInput).replace(',', '.'))
    if (isNaN(numRecebido) || numRecebido <= 0) {
      alert('Informe um valor de pagamento válido.')
      return
    }

    if (numRecebido > (saldoRestante + 0.01)) {
      alert(`O valor informado (R$ ${numRecebido.toFixed(2)}) é maior que a dívida restante (R$ ${saldoRestante.toFixed(2)})!`)
      return
    }

    setSalvandoRecebimento(true)

    const agoraISO = new Date().toISOString()
    const novoItemHistorico = {
      id: Date.now(),
      data: agoraISO,
      valor: numRecebido,
      forma: formaPagamentoInput
    }

    const historicoAtual = Array.isArray(contaModalReceber.historico_pagamentos) 
      ? [...contaModalReceber.historico_pagamentos] 
      : []

    historicoAtual.push(novoItemHistorico)

    const novoTotalPago = pagoAteAgora + numRecebido
    const novoSaldoRestante = Math.max(0, total - novoTotalPago)
    const novoStatus = novoSaldoRestante <= 0.01 ? 'pago' : 'pendente'

    try {
      const { error } = await supabase
        .from('contas_a_receber')
        .update({
          valor_pago: novoTotalPago,
          historico_pagamentos: historicoAtual,
          status: novoStatus
        })
        .eq('id', contaModalReceber.id)

      if (error) throw error

      // Prepara e abre o modal de comprovante automaticamente
      setComprovanteAtual({
        lojaNome: dadosEmpresa?.nome || 'TECCO',
        lojaTelefone: dadosEmpresa?.telefone || '',
        lojaEndereco: dadosEmpresa?.endereco || '',
        lojaCidade: dadosEmpresa?.cidade || '',
        lojaDoc: dadosEmpresa?.documento || '',
        clienteNome: contaModalReceber.clientes?.nome || 'Cliente',
        clienteTelefone: contaModalReceber.clientes?.telefone || '',
        descricao: contaModalReceber.descricao || `Título #${contaModalReceber.id}`,
        valorPago: numRecebido,
        valorTotalOriginal: total,
        totalPagoAcumulado: novoTotalPago,
        saldoRestante: novoSaldoRestante,
        statusFinal: novoStatus,
        formaPagamento: formaPagamentoInput,
        dataHora: agoraISO
      })

      setContaModalReceber(null)
      setValorReceberInput('')
      await carregarDados()
    } catch (err) {
      alert('Falha ao registrar pagamento: ' + err.message)
    }

    setSalvandoRecebimento(false)
  }

  // Disparo do comprovante via WhatsApp
  const enviarComprovanteWhatsApp = (comp) => {
    if (!comp.clienteTelefone) {
      alert('Este cliente não possui telefone cadastrado!')
      return
    }

    const numLimpo = comp.clienteTelefone.replace(/\D/g, '')
    const ddiTel = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo

    const dataFormatada = new Date(comp.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    const statusTxt = comp.saldoRestante <= 0.01 
      ? '🎉 CONTA 100% QUITADA! Dívida zerada.' 
      : `Restam R$ ${comp.saldoRestante.toFixed(2)} em aberto.`

    const mensagem = encodeURIComponent(
      `🧾 *COMPROVANTE DE PAGAMENTO - ${comp.lojaNome.toUpperCase()}*\n\n` +
      `Olá, *${comp.clienteNome}*! Confirmamos o recebimento do seu pagamento no crediário:\n\n` +
      `💵 *Valor Recebido:* R$ ${comp.valorPago.toFixed(2)}\n` +
      `💳 *Forma de Pagamento:* ${comp.formaPagamento}\n` +
      `📅 *Data/Hora:* ${dataFormatada}\n` +
      `📄 *Referência:* ${comp.descricao}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ *Situação:* ${statusTxt}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Muito obrigado pela pontualidade e preferência! ✨`
    )

    window.open(`https://api.whatsapp.com/send?phone=${ddiTel}&text=${mensagem}`, '_blank')
  }

  // Impressão direta do comprovante
  const imprimirComprovante = () => {
    window.print()
  }

  // Gerar segunda via do comprovante direto pelo Histórico
  const emitirComprovanteSegundaVia = (itemHist, contaMae) => {
    const totalOriginal = Number(contaMae.valor || 0)
    const historico = Array.isArray(contaMae.historico_pagamentos) ? contaMae.historico_pagamentos : []
    const totalPagoAteMomento = historico
      .filter(h => new Date(h.data) <= new Date(itemHist.data))
      .reduce((s, h) => s + Number(h.valor || 0), 0)

    const saldoRestante = Math.max(0, totalOriginal - totalPagoAteMomento)

    setComprovanteAtual({
      lojaNome: dadosEmpresa?.nome || 'TECCO',
      lojaTelefone: dadosEmpresa?.telefone || '',
      lojaEndereco: dadosEmpresa?.endereco || '',
      lojaCidade: dadosEmpresa?.cidade || '',
      lojaDoc: dadosEmpresa?.documento || '',
      clienteNome: contaMae.clientes?.nome || 'Cliente',
      clienteTelefone: contaMae.clientes?.telefone || '',
      descricao: contaMae.descricao || `Título #${contaMae.id}`,
      valorPago: Number(itemHist.valor || 0),
      valorTotalOriginal: totalOriginal,
      totalPagoAcumulado: totalPagoAteMomento,
      saldoRestante: saldoRestante,
      statusFinal: saldoRestante <= 0.01 ? 'pago' : 'pendente',
      formaPagamento: itemHist.forma || 'Dinheiro / PIX',
      dataHora: itemHist.data
    })
  }

  // Criar Título Manual para Dívidas Antigas
  const salvarNovoTituloManual = async (e) => {
    e.preventDefault()

    if (!clienteSelecionadoObj) {
      alert('Selecione um cliente cadastrado.')
      return
    }

    const valTotal = parseFloat(String(novoValorTotal).replace(',', '.'))
    if (isNaN(valTotal) || valTotal <= 0) {
      alert('Informe um valor total válido.')
      return
    }

    const valPago = novoValorPago ? parseFloat(String(novoValorPago).replace(',', '.')) : 0
    if (isNaN(valPago) || valPago < 0 || valPago > valTotal) {
      alert('O valor já pago não pode ser negativo nem maior que o valor total.')
      return
    }

    setSalvandoNovoTitulo(true)

    const historicoInicial = []
    if (valPago > 0) {
      historicoInicial.push({
        id: Date.now(),
        data: new Date().toISOString(),
        valor: valPago,
        forma: 'Lançamento Anterior'
      })
    }

    const statusInicial = valPago >= valTotal ? 'pago' : 'pendente'

    try {
      const { error } = await supabase
        .from('contas_a_receber')
        .insert([
          {
            cliente_id: clienteSelecionadoObj.id,
            descricao: novaDescricao.trim() || 'Saldo Devedor / Venda Antiga',
            valor: valTotal,
            valor_pago: valPago,
            vencimento: novoVencimento || null,
            status: statusInicial,
            historico_pagamentos: historicoInicial
          }
        ])

      if (error) throw error

      alert('Dívida antiga lançada com sucesso!')
      setModalNovoTitulo(false)
      limparSelecaoCliente()
      setNovaDescricao('')
      setNovoValorTotal('')
      setNovoValorPago('')
      setNovoVencimento('')
      await carregarDados()
    } catch (err) {
      alert('Erro ao criar título: ' + err.message)
    }

    setSalvandoNovoTitulo(false)
  }

  const editarPagamentoHistorico = async (itemHistorico) => {
    const novoValorStr = prompt(
      `Corrigir pagamento do dia ${new Date(itemHistorico.data).toLocaleDateString('pt-BR')}:\nInforme o valor correto:`,
      Number(itemHistorico.valor).toFixed(2)
    )

    if (novoValorStr === null) return
    const novoValor = parseFloat(novoValorStr.replace(',', '.'))

    if (isNaN(novoValor) || novoValor < 0) {
      alert('Valor inválido!')
      return
    }

    const historicoBase = Array.isArray(contaModalHist.historico_pagamentos) ? contaModalHist.historico_pagamentos : []
    const historicoAtualizado = historicoBase.map(h => 
      h.id === itemHistorico.id ? { ...h, valor: novoValor } : h
    )

    const novoTotalPago = historicoAtualizado.reduce((acc, h) => acc + Number(h.valor || 0), 0)
    const totalOriginal = Number(contaModalHist.valor || 0)
    const novoStatus = novoTotalPago >= (totalOriginal - 0.01) ? 'pago' : 'pendente'

    const { error } = await supabase
      .from('contas_a_receber')
      .update({
        valor_pago: novoTotalPago,
        historico_pagamentos: historicoAtualizado,
        status: novoStatus
      })
      .eq('id', contaModalHist.id)

    if (!error) {
      await carregarDados()
    } else {
      alert('Erro ao salvar alteração: ' + error.message)
    }
  }

  const excluirPagamentoHistorico = async (idHistorico) => {
    if (!confirm('Deseja realmente remover esse registro de pagamento? O saldo será recalculado.')) return

    const historicoBase = Array.isArray(contaModalHist.historico_pagamentos) ? contaModalHist.historico_pagamentos : []
    const historicoAtualizado = historicoBase.filter(h => h.id !== idHistorico)
    const novoTotalPago = historicoAtualizado.reduce((acc, h) => acc + Number(h.valor || 0), 0)
    const totalOriginal = Number(contaModalHist.valor || 0)
    const novoStatus = novoTotalPago >= (totalOriginal - 0.01) ? 'pago' : 'pendente'

    const { error } = await supabase
      .from('contas_a_receber')
      .update({
        valor_pago: novoTotalPago,
        historico_pagamentos: historicoAtualizado,
        status: novoStatus
      })
      .eq('id', contaModalHist.id)

    if (!error) {
      await carregarDados()
    } else {
      alert('Erro ao remover: ' + error.message)
    }
  }

  const contasFiltradas = contas.filter(c => {
    if (!busca.trim()) return true
    const termo = busca.toLowerCase()
    const nomeCli = (c.clientes?.nome || '').toLowerCase()
    const telCli = (c.clientes?.telefone || '').toLowerCase()
    const desc = (c.descricao || '').toLowerCase()
    return nomeCli.includes(termo) || telCli.includes(termo) || desc.includes(termo)
  })

  const totalEmAberto = contas
    .filter(c => c.status === 'pendente')
    .reduce((sum, c) => sum + (Number(c.valor || 0) - Number(c.valor_pago || 0)), 0)

  return (
    <div className="cr-wrapper">
      <style>{`
        .cr-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; }
        .cr-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .cr-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .cr-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
        .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .summary-card { background: #ffffff; border: 1px solid #fed7aa; border-radius: 14px; padding: 0.85rem 1.25rem; display: flex; flex-direction: column; min-width: 200px; }
        .summary-card span { font-size: 0.7rem; font-weight: 700; color: #ea580c; text-transform: uppercase; letter-spacing: 0.05em; }
        .summary-card strong { font-size: 1.45rem; font-weight: 800; color: #c2410c; letter-spacing: -0.02em; }
        
        .controls-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .filter-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
        .filter-btn { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; color: #64748b; font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .filter-btn.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }
        
        .search-box-cr { display: flex; align-items: center; gap: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0 12px; height: 40px; width: 320px; }
        .search-box-cr input { border: none; outline: none; width: 100%; font-size: 0.88rem; color: #0f172a; background: transparent; }
        
        .table-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; box-shadow: 0 1px 3px rgba(0,0,0,0.02); width: 100%; }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 820px; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1.25rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        td { padding: 1rem 1.25rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; white-space: nowrap; }
        tbody tr:hover { background: #f8fafc; }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-pendente { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
        .badge-pago { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
        
        .btn-action { display: inline-flex; align-items: center; gap: 4px; padding: 0.45rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; background: #2563eb; color: #ffffff; white-space: nowrap; }
        .btn-action:hover { background: #1d4ed8; }
        .btn-sec { background: #f1f5f9; color: #475569; }
        .btn-sec:hover { background: #e2e8f0; color: #0f172a; }
        .btn-primary { background: #2563eb; color: #ffffff; padding: 0.65rem 1.2rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary:hover { background: #1d4ed8; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 1rem; }
        .modal-card { background: #ffffff; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1rem; }
        .modal-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
        .hist-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-radius: 8px; background: #f8fafc; margin-bottom: 6px; border: 1px solid #f1f5f9; gap: 8px; }
        .input-money { height: 44px; width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0 12px; font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-top: 6px; }

        .form-group-modal { display: flex; flex-direction: column; margin-bottom: 1rem; position: relative; }
        .form-group-modal label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 5px; text-transform: uppercase; }
        .form-group-modal input, .form-group-modal select { height: 42px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 10px; font-size: 0.9rem; color: #0f172a; }
        .form-group-modal input:focus, .form-group-modal select:focus { outline: none; border-color: #2563eb; }

        .cli-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-height: 200px; overflow-y: auto; z-index: 50; margin-top: 4px; }
        .cli-item { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; }
        .cli-item:hover { background: #eff6ff; }
        .cli-selected-badge { display: flex; justify-content: space-between; align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px 12px; border-radius: 8px; margin-top: 6px; font-size: 0.88rem; color: #1e40af; }

        /* CUPOM TÉRMICO E RECIBO */
        .recibo-box {
          background: #fafaf9;
          border: 1px dashed #d6d3d1;
          border-radius: 12px;
          padding: 1.25rem;
          font-family: 'Courier New', Courier, monospace;
          color: #1c1917;
          margin-bottom: 1.25rem;
        }
        .recibo-header { text-align: center; border-bottom: 1px dashed #a8a29e; padding-bottom: 10px; margin-bottom: 10px; }
        .recibo-header h3 { margin: 0; font-size: 1.15rem; font-weight: 800; }
        .recibo-row { display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 4px; }
        .recibo-divider { border-top: 1px dashed #a8a29e; margin: 8px 0; }

        /* ESTILOS DE IMPRESSÃO */
        @media print {
          body * { visibility: hidden; }
          .recibo-print-area, .recibo-print-area * { visibility: visible; }
          .recibo-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto;
            padding: 0;
            font-family: monospace;
          }
        }

        @media (max-width: 768px) {
          .cr-header { flex-direction: column; align-items: stretch; }
          .summary-card { width: 100%; }
          .controls-row { flex-direction: column; align-items: stretch; }
          .search-box-cr { width: 100%; }
        }
      `}</style>

      <div className="cr-header">
        <div>
          <h1 className="cr-title">Contas a Receber</h1>
          <p className="cr-subtitle">Gestão de crediário, entradas e histórico de pagamentos</p>
        </div>

        <div className="header-actions">
          <div className="summary-card">
            <span>Saldo Total em Aberto</span>
            <strong>R$ {totalEmAberto.toFixed(2)}</strong>
          </div>

          <button className="btn-primary" onClick={() => setModalNovoTitulo(true)}>
            <IconPlus /> Lançar Dívida Antiga
          </button>
        </div>
      </div>

      <div className="controls-row">
        <div className="filter-bar">
          <button 
            className={`filter-btn ${filtro === 'pendente' ? 'active' : ''}`}
            onClick={() => setFiltro('pendente')}
          >
            Pendentes
          </button>
          <button 
            className={`filter-btn ${filtro === 'pago' ? 'active' : ''}`}
            onClick={() => setFiltro('pago')}
          >
            Quitadas
          </button>
          <button 
            className={`filter-btn ${filtro === 'todas' ? 'active' : ''}`}
            onClick={() => setFiltro('todas')}
          >
            Todas
          </button>
        </div>

        <div className="search-box-cr">
          <IconSearch />
          <input 
            type="text" 
            placeholder="Buscar por cliente, telefone ou venda..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {busca && (
            <button 
              onClick={() => setBusca('')} 
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '13px' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="table-box">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Carregando dados...</p>
        ) : contasFiltradas.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            {busca ? `Nenhum título encontrado com "${busca}".` : 'Nenhum título encontrado.'}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Descrição / Venda</th>
                <th>Vencimento</th>
                <th>Valor Total</th>
                <th>Valor Pago</th>
                <th>Saldo Devedor</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contasFiltradas.map(conta => {
                const total = Number(conta.valor || 0)
                const pago = Number(conta.valor_pago || 0)
                const saldo = Math.max(0, total - pago)
                const isPendente = conta.status === 'pendente'

                return (
                  <tr key={conta.id}>
                    <td>
                      <div><strong>{conta.clientes?.nome || 'Não identificado'}</strong></div>
                      {conta.clientes?.telefone && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{conta.clientes.telefone}</span>
                      )}
                    </td>
                    <td>{conta.descricao || `Título #${conta.id}`}</td>
                    <td>{conta.vencimento ? new Date(conta.vencimento).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>R$ {total.toFixed(2)}</td>
                    <td style={{ color: pago > 0 ? '#16a34a' : '#64748b', fontWeight: 600 }}>
                      R$ {pago.toFixed(2)}
                    </td>
                    <td>
                      <strong style={{ color: saldo > 0 ? '#ea580c' : '#16a34a' }}>
                        R$ {saldo.toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${isPendente ? 'badge-pendente' : 'badge-pago'}`}>
                        {isPendente ? <><IconClock /> Pendente</> : <><IconCheck /> Quitado</>}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {isPendente && (
                          <button className="btn-action" onClick={() => abrirModalRecebimento(conta)}>
                            <IconCheck /> Receber
                          </button>
                        )}
                        <button 
                          className="btn-action btn-sec" 
                          onClick={() => setContaModalHist(conta)}
                          title="Ver histórico e editar pagamentos"
                        >
                          <IconHistory /> Histórico
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL NOVO TÍTULO MANUAL COM AUTOCOMPLETE DE CLIENTE */}
      {modalNovoTitulo && (
        <div className="modal-overlay" onClick={() => setModalNovoTitulo(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Lançar Dívida / Saldo Antigo</h3>
              <button 
                onClick={() => setModalNovoTitulo(false)} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={salvarNovoTituloManual}>
              <div className="form-group-modal" ref={dropdownCliRef}>
                <label>Pesquisar Cliente (Digite o Nome, Telefone ou CPF)</label>
                {!clienteSelecionadoObj ? (
                  <>
                    <input 
                      type="text"
                      placeholder="Ex: Maria, Carlos, (11) 98..."
                      value={termoBuscaCliente}
                      onChange={e => { setTermoBuscaCliente(e.target.value); setMostrarDropdownCli(true); }}
                      onFocus={() => setMostrarDropdownCli(true)}
                      required
                    />

                    {mostrarDropdownCli && (
                      <div className="cli-dropdown">
                        {clientesFiltradosBusca.length === 0 ? (
                          <div style={{ padding: '10px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                            Nenhum cliente encontrado.
                          </div>
                        ) : (
                          clientesFiltradosBusca.map(c => (
                            <div 
                              key={c.id} 
                              className="cli-item"
                              onClick={() => selecionarCliente(c)}
                            >
                              <strong>{c.nome}</strong>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.telefone || c.cpf || ''}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="cli-selected-badge">
                    <div>
                      <strong>{clienteSelecionadoObj.nome}</strong>
                      {clienteSelecionadoObj.telefone && <span style={{ marginLeft: '8px', fontSize: '0.8rem', opacity: 0.85 }}>({clienteSelecionadoObj.telefone})</span>}
                    </div>
                    <button 
                      type="button" 
                      onClick={limparSelecaoCliente}
                      style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                      title="Trocar cliente"
                    >
                      ✕ Trocar
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group-modal">
                <label>Descrição do Saldo / Referência</label>
                <input 
                  type="text" 
                  placeholder="Ex: Saldo antigo de roupas / Caderno 2024"
                  value={novaDescricao}
                  onChange={e => setNovaDescricao(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group-modal" style={{ flex: 1 }}>
                  <label>Valor Total da Dívida (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0,00"
                    value={novoValorTotal}
                    onChange={e => setNovoValorTotal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-modal" style={{ flex: 1 }}>
                  <label>Já Pago no Passado (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0,00"
                    value={novoValorPago}
                    onChange={e => setNovoValorPago(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-modal">
                <label>Data de Vencimento / Combinada</label>
                <input 
                  type="date" 
                  value={novoVencimento}
                  onChange={e => setNovoVencimento(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-action btn-sec" 
                  onClick={() => setModalNovoTitulo(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-action" 
                  disabled={salvandoNovoTitulo}
                  style={{ background: '#2563eb', padding: '0.6rem 1.2rem' }}
                >
                  {salvandoNovoTitulo ? 'Salvando...' : 'Salvar Saldo Devedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RECEBER COM SELEÇÃO DE FORMA DE PAGAMENTO */}
      {contaModalReceber && (
        <div className="modal-overlay" onClick={() => setContaModalReceber(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Pagamento</h3>
              <button 
                onClick={() => setContaModalReceber(null)} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem' }}>
              <div><strong>Cliente: {contaModalReceber.clientes?.nome || 'Avulso'}</strong></div>
              <div style={{ color: '#64748b', marginTop: '3px' }}>{contaModalReceber.descricao}</div>
              <div style={{ marginTop: '6px', color: '#c2410c', fontWeight: 700 }}>
                Saldo Devedor Atual: R$ {Math.max(0, Number(contaModalReceber.valor || 0) - Number(contaModalReceber.valor_pago || 0)).toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Valor a Receber Agora (R$):
              </label>
              <input 
                type="number" 
                step="0.01"
                className="input-money"
                value={valorReceberInput}
                onChange={e => setValorReceberInput(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group-modal">
              <label>Forma de Pagamento</label>
              <select value={formaPagamentoInput} onChange={e => setFormaPagamentoInput(e.target.value)}>
                <option value="PIX">⚡ PIX</option>
                <option value="Dinheiro">💵 Dinheiro</option>
                <option value="Cartão Débito">💳 Cartão Débito</option>
                <option value="Cartão Crédito">💳 Cartão Crédito</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
              <button 
                className="btn-action btn-sec" 
                onClick={() => setContaModalReceber(null)}
                disabled={salvandoRecebimento}
              >
                Cancelar
              </button>
              <button 
                className="btn-action" 
                onClick={confirmarRecebimento}
                disabled={salvandoRecebimento}
                style={{ background: '#10b981' }}
              >
                <IconCheck /> {salvandoRecebimento ? 'Salvando...' : 'Confirmar & Gerar Recibo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMPROVANTE DE QUITAÇÃO / RECEBIMENTO */}
      {comprovanteAtual && (
        <div className="modal-overlay" onClick={() => setComprovanteAtual(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🧾 Recibo de Pagamento</h3>
              <button 
                onClick={() => setComprovanteAtual(null)} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* ÁREA DO RECIBO IMPRESSO / VISUAL */}
            <div className="recibo-box recibo-print-area">
              <div className="recibo-header">
                <h3>{comprovanteAtual.lojaNome.toUpperCase()}</h3>
                {comprovanteAtual.lojaDoc && <div style={{ fontSize: '0.8rem' }}>CNPJ/CPF: {comprovanteAtual.lojaDoc}</div>}
                {comprovanteAtual.lojaEndereco && <div style={{ fontSize: '0.78rem' }}>{comprovanteAtual.lojaEndereco}</div>}
                {comprovanteAtual.lojaTelefone && <div style={{ fontSize: '0.78rem' }}>WhatsApp: {comprovanteAtual.lojaTelefone}</div>}
                <div style={{ fontWeight: 800, marginTop: '6px', fontSize: '0.9rem' }}>COMPROVANTE DE RECEBIMENTO</div>
              </div>

              <div className="recibo-row">
                <span>Data/Hora:</span>
                <span>{new Date(comprovanteAtual.dataHora).toLocaleString('pt-BR')}</span>
              </div>
              <div className="recibo-row">
                <span>Cliente:</span>
                <span><strong>{comprovanteAtual.clienteNome}</strong></span>
              </div>
              {comprovanteAtual.clienteTelefone && (
                <div className="recibo-row">
                  <span>Contato:</span>
                  <span>{comprovanteAtual.clienteTelefone}</span>
                </div>
              )}
              <div className="recibo-row">
                <span>Referência:</span>
                <span>{comprovanteAtual.descricao}</span>
              </div>
              <div className="recibo-row">
                <span>Forma:</span>
                <span>{comprovanteAtual.formaPagamento}</span>
              </div>

              <div className="recibo-divider" />

              <div className="recibo-row" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                <span>VALOR PAGO:</span>
                <span>R$ {comprovanteAtual.valorPago.toFixed(2)}</span>
              </div>

              <div className="recibo-divider" />

              <div className="recibo-row">
                <span>Total da Dívida:</span>
                <span>R$ {comprovanteAtual.valorTotalOriginal.toFixed(2)}</span>
              </div>
              <div className="recibo-row">
                <span>Total Pago Acumulado:</span>
                <span>R$ {comprovanteAtual.totalPagoAcumulado.toFixed(2)}</span>
              </div>
              <div className="recibo-row" style={{ fontWeight: 800, color: comprovanteAtual.saldoRestante <= 0.01 ? '#15803d' : '#c2410c' }}>
                <span>SALDO RESTANTE:</span>
                <span>{comprovanteAtual.saldoRestante <= 0.01 ? 'QUITADO (R$ 0,00)' : `R$ ${comprovanteAtual.saldoRestante.toFixed(2)}`}</span>
              </div>

              <div className="recibo-divider" />
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#57534e', marginTop: '6px' }}>
                Agradecemos a sua preferência e pontualidade!
              </div>
            </div>

            {/* BOTÕES DE AÇÃO: IMPRIMIR E ENVIAR WHATSAPP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <button 
                type="button" 
                className="btn-action"
                onClick={imprimirComprovante}
                style={{ justifyContent: 'center', padding: '0.65rem' }}
              >
                <IconPrinter /> Imprimir Cupom
              </button>

              <button 
                type="button" 
                className="btn-action"
                onClick={() => enviarComprovanteWhatsApp(comprovanteAtual)}
                style={{ background: '#16a34a', justifyContent: 'center', padding: '0.65rem' }}
              >
                <IconWhatsApp /> Enviar no Zap
              </button>
            </div>

            <button 
              type="button" 
              className="btn-action btn-sec" 
              onClick={() => setComprovanteAtual(null)}
              style={{ width: '100%', justifyContent: 'center', padding: '0.6rem' }}
            >
              Concluir & Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO COM REEMISSÃO DE COMPROVANTE */}
      {contaModalHist && (
        <div className="modal-overlay" onClick={() => setContaModalHist(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Histórico de Pagamentos</h3>
              <button 
                onClick={() => setContaModalHist(null)} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem', padding: '10px 14px', background: '#f1f5f9', borderRadius: '10px', fontSize: '0.85rem' }}>
              <div><strong>Cliente: {contaModalHist.clientes?.nome || 'Avulso'}</strong></div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>{contaModalHist.descricao}</div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '6px', flexWrap: 'wrap' }}>
                <span>Total: <strong>R$ {Number(contaModalHist.valor).toFixed(2)}</strong></span>
                <span>Pago: <strong style={{ color: '#16a34a' }}>R$ {Number(contaModalHist.valor_pago || 0).toFixed(2)}</strong></span>
                <span>Restante: <strong style={{ color: '#ea580c' }}>R$ {Math.max(0, Number(contaModalHist.valor) - Number(contaModalHist.valor_pago || 0)).toFixed(2)}</strong></span>
              </div>
            </div>

            <div style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '1rem' }}>
              {(!contaModalHist.historico_pagamentos || contaModalHist.historico_pagamentos.length === 0) ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '1rem' }}>
                  Nenhum pagamento detalhado registrado ainda.
                </p>
              ) : (
                contaModalHist.historico_pagamentos.map((item, idx) => (
                  <div key={item.id || idx} className="hist-item">
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>
                        {new Date(item.data).toLocaleDateString('pt-BR')} às {new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {item.forma ? ` • ${item.forma}` : ''}
                      </span>
                      <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>
                        R$ {Number(item.valor).toFixed(2)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn-action" 
                        style={{ padding: '4px 8px', background: '#0284c7' }}
                        onClick={() => emitirComprovanteSegundaVia(item, contaModalHist)}
                        title="Emitir comprovante deste pagamento"
                      >
                        <IconPrinter /> Recibo
                      </button>
                      <button 
                        className="btn-action btn-sec" 
                        style={{ padding: '4px 8px' }}
                        onClick={() => editarPagamentoHistorico(item)}
                        title="Corrigir valor"
                      >
                        <IconEdit /> Editar
                      </button>
                      <button 
                        className="btn-action" 
                        style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px' }}
                        onClick={() => excluirPagamentoHistorico(item.id)}
                        title="Excluir lançamento"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-action btn-sec" 
                onClick={() => setContaModalHist(null)}
                style={{ padding: '0.6rem 1.2rem' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
