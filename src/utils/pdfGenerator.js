import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Altere os dados da sua loja aqui:
export const DADOS_EMPRESA = {
  nome: 'TECCO',
  subtitulo: 'MODA MASCULINA',
  contato: 'Tel/WhatsApp: (87) 99995-1762'
}

export const formatarIdVenda = (id) => {
  const ano = new Date().getFullYear()
  return `VEN-${ano}-${String(id || 0).padStart(6, '0')}`
}

export const formatarIdRecibo = (id) => {
  const ano = new Date().getFullYear()
  return `REC-${ano}-${String(id || 0).padStart(6, '0')}`
}

export const gerarComprovanteVenda = (venda) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const codigoVenda = formatarIdVenda(venda.id)
  const dataVenda = venda.created_at
    ? new Date(venda.created_at).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR')

  // Cabeçalho da Loja
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(DADOS_EMPRESA.nome.toUpperCase(), 14, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`${DADOS_EMPRESA.subtitulo} • ${DADOS_EMPRESA.contato}`, 14, 23)

  // Identificação do Documento
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(37, 99, 235)
  doc.text('COMPROVANTE DE VENDA', 14, 31)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`Identificador: ${codigoVenda}  |  Data/Hora: ${dataVenda}`, 14, 36)

  // Linha divisória
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.5)
  doc.line(14, 40, 196, 40)

  // Informações do Cliente e Pagamento
  doc.setFontSize(10)
  doc.setTextColor(55, 65, 81)
  const nomeCliente = venda.clientes?.nome || venda.cliente || 'Cliente Avulso'
  doc.text(`Cliente: ${nomeCliente}`, 14, 47)
  doc.text(`Forma de Pagamento: ${(venda.forma_pagamento || venda.pagamento || 'DINHEIRO').toUpperCase()}`, 14, 53)

  // Tabela de Produtos
  const itens = Array.isArray(venda.itens) ? venda.itens : []
  const linhasTabela = itens.map((item, index) => [
    index + 1,
    item.nomeProduto || 'Produto',
    item.quantidade,
    `R$ ${Number(item.preco).toFixed(2)}`,
    `R$ ${(Number(item.preco) * Number(item.quantidade)).toFixed(2)}`
  ])

  autoTable(doc, {
    startY: 59,
    head: [['#', 'Descrição do Item', 'Qtd', 'Preço Unit.', 'Subtotal']],
    body: linhasTabela,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 }
    }
  })

  // Total
  const posFinalY = (doc).lastAutoTable.finalY + 10
  const valorTotal = Number(venda.total || 0).toFixed(2)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(`VALOR TOTAL: R$ ${valorTotal}`, 196, posFinalY, { align: 'right' })

  // Rodapé
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(156, 163, 175)
  doc.text(`${DADOS_EMPRESA.nome} — Agradecemos a preferência!`, 105, 285, { align: 'center' })

  doc.save(`${codigoVenda}.pdf`)
}

export const gerarReciboPagamento = (conta, valorRecebidoAgora) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const codigoRecibo = formatarIdRecibo(conta.id)
  const dataHoje = new Date().toLocaleString('pt-BR')
  const nomeCliente = conta.clientes?.nome || conta.descricao || 'Cliente'
  const valorTotalOriginal = Number(conta.valor || 0)
  const valorPagoTotal = Number(conta.valor_pago || 0)
  const valorRecebidoMomento = Number(valorRecebidoAgora || valorTotalOriginal)
  const saldoRestante = Math.max(0, valorTotalOriginal - valorPagoTotal)

  // Cabeçalho da Loja
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(DADOS_EMPRESA.nome.toUpperCase(), 14, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`${DADOS_EMPRESA.subtitulo} • ${DADOS_EMPRESA.contato}`, 14, 23)

  // Título do Recibo
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text('RECIBO DE PAGAMENTO / QUITAÇÃO', 14, 31)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`Identificador: ${codigoRecibo}  |  Emitido em: ${dataHoje}`, 14, 36)

  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.5)
  doc.line(14, 40, 196, 40)

  // Dados do Pagador
  doc.setFontSize(10)
  doc.setTextColor(55, 65, 81)
  const tipoQuitacao = saldoRestante <= 0.009 ? 'QUITAÇÃO TOTAL' : 'AMORTIZAÇÃO PARCIAL'
  
  doc.text(`Operação: ${tipoQuitacao}`, 14, 48)
  doc.text(`Recebemos de: ${nomeCliente}`, 14, 55)
  doc.text(`A quantia de: R$ ${valorRecebidoMomento.toFixed(2)}`, 14, 62)
  doc.text(`Referente a: ${conta.descricao || 'Título financeiro em aberto'}`, 14, 69)

  // Tabela Demonstrativa
  autoTable(doc, {
    startY: 77,
    head: [['Demonstrativo do Título', 'Valores']],
    body: [
      ['Valor Original da Dívida', `R$ ${valorTotalOriginal.toFixed(2)}`],
      ['Valor Pago Neste Recibo', `R$ ${valorRecebidoMomento.toFixed(2)}`],
      ['Total Acumulado Quitado', `R$ ${valorPagoTotal.toFixed(2)}`],
      ['Saldo Devedor Restante', `R$ ${saldoRestante.toFixed(2)}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' }
    }
  })

  // Campo para Assinatura
  const posAssinaturaY = (doc).lastAutoTable.finalY + 35
  doc.setDrawColor(156, 163, 175)
  doc.line(60, posAssinaturaY, 150, posAssinaturaY)
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text(DADOS_EMPRESA.nome, 105, posAssinaturaY + 5, { align: 'center' })
  doc.text('Assinatura do Emitente', 105, posAssinaturaY + 10, { align: 'center' })

  doc.save(`${codigoRecibo}.pdf`)
}
