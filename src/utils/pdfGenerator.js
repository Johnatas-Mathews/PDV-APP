// Dados padrão da empresa (caso não configurado no banco)
export const DADOS_EMPRESA = {
  nome: 'TECCO STORE',
  documento: '',
  telefone: '',
  endereco: '',
  cidadeUf: '',
  instagram: '',
  mensagemCupom: 'Obrigado pela preferência! Volte sempre!'
}

// Formatação do ID da venda (ex: 5 -> 000005)
export const formatarIdVenda = (id) => {
  if (!id) return '000000'
  return String(id).padStart(6, '0')
}

// 1. GERADOR DO TEXTO PARA WHATSAPP COM DESCONTO INDIVIDUAL
export const gerarTextoCupomWhatsApp = (venda, empresa, cashbackGerado = 0) => {
  const nomeLoja = empresa?.nome || DADOS_EMPRESA.nome
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
        listaItensTxt += `   De: R$ ${(qtd * preco).toFixed(2)} | Desc: -R$ ${descItem.toFixed(2)} ➔ *R$ ${subtotal.toFixed(2)}*\n`
      } else {
        listaItensTxt += `   Valor: R$ ${subtotal.toFixed(2)}\n`
      }
    })
  }

  let formaTxt = String(venda.forma_pagamento || '').toUpperCase()
  if (formaTxt === 'MISTO' && Array.isArray(venda.pagamentos_detalhe)) {
    formaTxt = venda.pagamentos_detalhe.map(p => `${p.tipo.toUpperCase()} (R$ ${Number(p.valor).toFixed(2)})`).join(', ')
  }

  let msg = `🛍️ *COMPROVANTE DE VENDA*\n`
  msg += `*${nomeLoja.toUpperCase()}*\n`
  if (empresa?.documento) msg += `CNPJ/CPF: ${empresa.documento}\n`
  if (empresa?.telefone) msg += `WhatsApp: ${empresa.telefone}\n`
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

  msg += `💰 *TOTAL: R$ ${Number(venda.total).toFixed(2)}*\n`
  msg += `💳 *Forma de Pagamento:* ${formaTxt}\n`

  if (cashbackGerado > 0) {
    msg += `\n✨ *Você acumulou:* +R$ ${cashbackGerado.toFixed(2)} de Cashback!\n`
  }

  msg += `━━━━━━━━━━━━━━━━━━━━\n`
  msg += `${empresa?.mensagemCupom || DADOS_EMPRESA.mensagemCupom}`

  return msg
}

// 2. IMPRESSÃO DO COMPROVANTE (TÉRMICO 80MM OU A4)
export const gerarComprovanteVenda = (venda, empresa) => {
  const nomeLoja = empresa?.nome || DADOS_EMPRESA.nome
  const codVenda = formatarIdVenda(venda.id)
  const dataVenda = new Date(venda.created_at || Date.now()).toLocaleString('pt-BR')
  const nomeCliente = venda.clientes?.nome || 'Cliente Avulso'

  let itensHtml = ''
  if (Array.isArray(venda.itens)) {
    venda.itens.forEach(item => {
      const qtd = Number(item.quantidade || 1)
      const preco = Number(item.preco || 0)
      const descItem = Number(item.desconto || 0)
      const subtotal = Number(item.subtotal || (qtd * preco - descItem))

      itensHtml += `
        <tr>
          <td style="padding: 4px 0;">
            <div><strong>${item.nomeProduto}</strong></div>
            <div style="font-size: 11px; color: #555;">
              ${qtd} un x R$ ${preco.toFixed(2)}
              ${descItem > 0 ? `<span style="color: #b91c1c;"> (Desc: -R$ ${descItem.toFixed(2)})</span>` : ''}
            </div>
          </td>
          <td style="text-align: right; vertical-align: top; padding: 4px 0; font-weight: bold;">
            R$ ${subtotal.toFixed(2)}
          </td>
        </tr>
      `
    })
  }

  let formaTxt = String(venda.forma_pagamento || '').toUpperCase()
  if (formaTxt === 'MISTO' && Array.isArray(venda.pagamentos_detalhe)) {
    formaTxt = venda.pagamentos_detalhe.map(p => `${p.tipo.toUpperCase()} (R$ ${Number(p.valor).toFixed(2)})`).join(', ')
  }

  const janelaImpressao = window.open('', '_blank', 'width=380,height=600')
  if (!janelaImpressao) {
    return alert('Por favor, permita pop-ups no seu navegador para imprimir o comprovante.')
  }

  janelaImpressao.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Comprovante #${codVenda}</title>
        <style>
          @page { margin: 0; size: auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 12px;
            max-width: 80mm;
          }
          .text-center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .total { font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <strong style="font-size: 14px;">${nomeLoja.toUpperCase()}</strong><br>
          ${empresa?.documento ? `CNPJ/CPF: ${empresa.documento}<br>` : ''}
          ${empresa?.endereco ? `${empresa.endereco}<br>` : ''}
          ${empresa?.telefone ? `Tel: ${empresa.telefone}<br>` : ''}
          <div class="divider"></div>
          <strong>CUPOM DE VENDA</strong>
        </div>

        <div class="divider"></div>
        <div class="row"><span>Pedido:</span><span>#${codVenda}</span></div>
        <div class="row"><span>Data:</span><span>${dataVenda}</span></div>
        <div class="row"><span>Cliente:</span><span>${nomeCliente}</span></div>
        <div class="divider"></div>

        <table>
          <tbody>
            ${itensHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        ${Number(venda.desconto_total_itens) > 0 ? `
          <div class="row" style="color: #b91c1c;">
            <span>Desc. nos Itens:</span>
            <span>-R$ ${Number(venda.desconto_total_itens).toFixed(2)}</span>
          </div>` : ''}

        ${Number(venda.desconto_global) > 0 ? `
          <div class="row" style="color: #b91c1c;">
            <span>Desc. Geral:</span>
            <span>-R$ ${Number(venda.desconto_global).toFixed(2)}</span>
          </div>` : ''}

        <div class="row total" style="margin-top: 4px;">
          <span>TOTAL A PAGAR:</span>
          <span>R$ ${Number(venda.total).toFixed(2)}</span>
        </div>

        <div class="row" style="margin-top: 4px;">
          <span>Pagamento:</span>
          <span>${formaTxt}</span>
        </div>

        <div class="divider"></div>
        <div class="text-center" style="font-size: 11px;">
          ${empresa?.mensagemCupom || DADOS_EMPRESA.mensagemCupom}
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
    </html>
  `)

  janelaImpressao.document.close()
}
