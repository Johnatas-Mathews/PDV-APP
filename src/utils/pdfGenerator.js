import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Formata o ID no padrão VEN-ANO-000000
 */
export const formatarIdVenda = (id) => {
  const ano = new Date().getFullYear()
  return `VEN-${ano}-${String(id || 0).padStart(6, '0')}`
}

/**
 * Formata o ID no padrão REC-ANO-000000
 */
export const formatarIdRecibo = (id) => {
  const ano = new Date().getFullYear()
  return `REC-${ano}-${String(id || 0).padStart(6, '0')}`
}

/**
 * Gera o PDF do Comprovante de Venda
 */
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

  // Cabeçalho da Empresa / Recibo
  doc.setFontSize(18)
  doc.setTextColor(31, 41, 55)
  doc.text('COMPROVANTE DE VENDA', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`Identificador Único: ${codigoVenda}`, 14, 27)
  doc.text(`Data / Hora: ${dataVenda}`, 14, 32)

  // Linha divisória
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.5)
  doc.line(14, 36, 196, 36)

  // Dados do Cliente e Pagamento
  doc.setFontSize(11)
  doc.setTextColor(55, 65, 81)
  const nomeCliente = venda.clientes?.nome || venda.cliente || 'Cliente Avulso'
  doc.text(`Cliente: ${nomeCliente}`, 14, 44)
  doc.text(`Forma de Pagamento: ${(venda.forma_pagamento || venda.pagamento || 'DINHEIRO').toUpperCase()}`, 14, 50)

  // Tabela de Itens
  const itens = Array.isArray(venda.itens) ? venda.itens : []
  const linhasTabela = itens.map((item, index) => [
    index + 1,
    item.nomeProduto || 'Produto',
    item.quantidade,
    `R$ ${Number(item.preco).toFixed(2)}`,
    `R$ ${(Number(item.preco) * Number(item.quantidade)).toFixed(2)}`
  ])

  autoTable(doc, {
    startY: 56,
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

  // Totalizador
  const posFinalY = (doc).lastAutoTable.finalY + 10
  const valorTotal = Number(venda.total || 0).toFixed(2)

  doc.setFontSize(13)
  doc.setTextColor(17, 24, 39)
  doc.text(`VALOR TOTAL: R$ ${valorTotal}`, 196, posFinalY, { align: 'right' })

  // Rodapé Informativo
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text('Obrigado pela preferência! Documento gerado automaticamente pelo PDV Sistema.', 105, 285, { align: 'center' })

  // Salvar PDF
  doc.save(`${codigoVenda}.pdf`)
}

/**
 * Gera o PDF do Recibo de Pagamento / Quitação
 */
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

  // Cabeçalho
  doc.setFontSize(20)
  doc.setTextColor(16, 185, 129)
  doc.text('RECIBO DE PAGAMENTO', 14, 22)

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`Identificador: ${codigoRecibo}`, 14, 29)
  doc.text(`Emitido em: ${dataHoje}`, 14, 34)

  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.5)
  doc.line(14, 38, 196, 38)

  // Texto declaratório de quitação
  doc.setFontSize(11)
  doc.setTextColor(55, 65, 81)
  
  const tipoQuitacao = saldoRestante <= 0.009 ? 'QUITAÇÃO TOTAL' : 'AMORTIZAÇÃO PARCIAL'
  
  doc.text(`Tipo de Lançamento: ${tipoQuitacao}`, 14, 46)
  doc.text(`Recebemos de: ${nomeCliente}`, 14, 53)
  doc.text(`A quantia de: R$ ${valorRecebidoMomento.toFixed(2)}`, 14, 60)
  doc.text(`Referente a: ${conta.descricao || 'Cobrança em aberto'}`, 14, 67)

  // Tabela Resumo Financeiro
  autoTable(doc, {
    startY: 75,
    head: [['Demonstrativo do Título', 'Valores']],
    body: [
      ['Valor Original da Cobrança', `R$ ${valorTotalOriginal.toFixed(2)}`],
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

  // Campo de Assinatura
  const posAssinaturaY = (doc).lastAutoTable.finalY + 40
  doc.line(60, posAssinaturaY, 150, posAssinaturaY)
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text('Assinatura do Responsável', 105, posAssinaturaY + 6, { align: 'center' })

  // Salvar PDF
  doc.save(`${codigoRecibo}.pdf`)
}
