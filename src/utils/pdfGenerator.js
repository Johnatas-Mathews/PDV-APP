export const gerarTextoCupomWhatsApp = (venda, empresa, cashbackGerado = 0) => {
  const nomeLoja = empresa?.nome || 'TECCO'
  const codVenda = formatarIdVenda(venda.id)
  const dataVenda = new Date(venda.created_at || Date.now()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  const nomeCliente = venda.clientes?.nome || 'Cliente'

  let listaItensTxt = ''
  if (Array.isArray(venda.itens)) {
    venda.itens.forEach(item => {
      const qtd = Number(item.quantidade || 1)
      const preco = Number(item.preco || 0)
      const descItem = Number(item.desconto || 0)
      const subtotal = Number(item.subtotal || (qtd * preco - descItem))

      listaItensTxt += `• ${qtd}x *${item.nomeProduto}*\n`
      if (descItem > 0) {
        listaItensTxt += `  De: R$ ${(qtd * preco).toFixed(2)} | Desc: -R$ ${descItem.toFixed(2)} ➔ *R$ ${subtotal.toFixed(2)}*\n`
      } else {
        listaItensTxt += `  Valor: R$ ${subtotal.toFixed(2)}\n`
      }
    })
  }

  let formaTxt = String(venda.forma_pagamento || '').toUpperCase()
  if (formaTxt === 'MISTO' && Array.isArray(venda.pagamentos_detalhe)) {
    formaTxt = venda.pagamentos_detalhe.map(p => `${p.tipo.toUpperCase()} (R$ ${Number(p.valor).toFixed(2)})`).join(', ')
  }

  let msg = `🛍️ *CUPOM FISCAL / COMPROVANTE DE VENDA*\n`
  msg += `*${nomeLoja.toUpperCase()}*\n`
  if (empresa?.documento) msg += `CNPJ/CPF: ${empresa.documento}\n`
  if (empresa?.telefone) msg += `Telefone: ${empresa.telefone}\n`
  msg += `━━━━━━━━━━━━━━━━━━━━\n`
  msg += `📄 *Pedido:* #${codVenda}\n`
  msg += `📅 *Data:* ${dataVenda}\n`
  msg += `👤 *Cliente:* ${nomeCliente}\n`
  msg += `━━━━━━━━━━━━━━━━━━━━\n`
  msg += `*ITENS COMPRADOS:*\n\n`
  msg += `${listaItensTxt}\n`
  msg += `━━━━━━━━━━━━━━━━━━━━\n`
  
  if (Number(venda.desconto_total_itens) > 0) {
    msg += `🏷️ Desconto nos Itens: -R$ ${Number(venda.desconto_total_itens).toFixed(2)}\n`
  }
  if (Number(venda.desconto_global) > 0) {
    msg += `🏷️ Desconto Geral: -R$ ${Number(venda.desconto_global).toFixed(2)}\n`
  }
  
  msg += `💰 *TOTAL PAGO: R$ ${Number(venda.total).toFixed(2)}*\n`
  msg += `💳 *Forma de Pagamento:* ${formaTxt}\n`

  if (cashbackGerado > 0) {
    msg += `\n✨ *Parabéns!* Você ganhou *R$ ${cashbackGerado.toFixed(2)}* de Cashback para a sua próxima compra!\n`
  }

  msg += `━━━━━━━━━━━━━━━━━━━━\n`
  msg += `Muito obrigado pela sua preferência! Volte sempre! ✨`

  return msg
}
