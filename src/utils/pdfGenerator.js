// Utilitário de geração e impressão de comprovante térmico/A4 sem bibliotecas pesadas

export const DADOS_EMPRESA = {
  nome: 'TECCO MODA & ESTILO',
  documento: 'CNPJ: 00.000.000/0001-00',
  endereco: 'Rua do Comércio, 100 - Centro',
  telefone: '(11) 99999-9999'
}

export const formatarIdVenda = (id) => {
  return String(id || 0).padStart(5, '0')
}

export const gerarComprovanteVenda = (venda) => {
  const dataVenda = new Date(venda.created_at || Date.now()).toLocaleString('pt-BR')
  const codVenda = formatarIdVenda(venda.id)
  const itens = Array.isArray(venda.itens) ? venda.itens : []

  // 1. Soma o valor bruto de todos os produtos
  const subtotalItens = itens.reduce((acc, item) => {
    const qtd = Number(item.quantidade || 1)
    const unit = Number(item.preco || 0)
    return acc + (qtd * unit)
  }, 0)

  // 2. Total final cobrado na venda
  const totalCobrado = Number(venda.total || 0)

  // 3. Diferença apurada como desconto
  const valorDesconto = Math.max(0, subtotalItens - totalCobrado)

  // 4. Montagem das linhas da tabela de produtos
  const linhasItensHtml = itens.map(item => {
    const qtd = Number(item.quantidade || 1)
    const unit = Number(item.preco || 0)
    const subt = qtd * unit
    return `
      <tr>
        <td style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">
          <div style="font-weight: 600; color: #0f172a;">${item.nomeProduto || item.nome || 'Produto'}</div>
          <div style="font-size: 11px; color: #64748b;">${qtd} un x R$ ${unit.toFixed(2)}</div>
        </td>
        <td style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0; text-align: right; font-weight: 600; color: #0f172a; vertical-align: bottom;">
          R$ ${subt.toFixed(2)}
        </td>
      </tr>
    `
  }).join('')

  // 5. Bloco de totais com exibição de Desconto quando houver
  const blocoTotaisHtml = `
    <div style="margin-top: 14px; border-top: 1px solid #0f172a; padding-top: 8px;">
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #475569;">
        <span>Total Produtos:</span>
        <strong>R$ ${subtotalItens.toFixed(2)}</strong>
      </div>

      ${valorDesconto > 0.01 ? `
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #dc2626;">
        <span>Desconto Concedido:</span>
        <strong>- R$ ${valorDesconto.toFixed(2)}</strong>
      </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
        <span>TOTAL FINAL:</span>
        <span>R$ ${totalCobrado.toFixed(2)}</span>
      </div>
    </div>
  `

  // 6. Janela de impressão direta sem travar na Vercel
  const janela = window.open('', '_blank', 'width=380,height=600')
  if (!janela) {
    alert('Por favor, permita pop-ups no seu navegador para imprimir o comprovante.')
    return
  }

  janela.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Comprovante #${codVenda}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif; }
          body { background: #ffffff; padding: 20px; color: #0f172a; }
          .cupom { width: 100%; max-width: 320px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px dashed #94a3b8; padding-bottom: 12px; margin-bottom: 12px; }
          .title { font-size: 16px; font-weight: 800; letter-spacing: 0.02em; }
          .sub { font-size: 11px; color: #64748b; margin-top: 3px; }
          .meta { font-size: 11px; color: #334155; margin-bottom: 12px; }
          .meta div { margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; }
          .footer { text-align: center; font-size: 11px; color: #64748b; border-top: 1px dashed #94a3b8; margin-top: 16px; padding-top: 12px; }
          @media print {
            body { padding: 0; }
            .cupom { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="cupom">
          <div class="header">
            <div class="title">${DADOS_EMPRESA.nome}</div>
            <div class="sub">${DADOS_EMPRESA.documento}</div>
            <div class="sub">${DADOS_EMPRESA.endereco}</div>
            <div class="sub">${DADOS_EMPRESA.telefone}</div>
          </div>

          <div class="meta">
            <div><strong>PEDIDO: #${codVenda}</strong></div>
            <div>Data: ${dataVenda}</div>
            <div>Cliente: ${venda.clientes?.nome || 'Cliente Avulso'}</div>
            <div>Forma Pagto: ${(venda.forma_pagamento || 'dinheiro').toUpperCase()}</div>
          </div>

          <table>
            ${linhasItensHtml}
          </table>

          ${blocoTotaisHtml}

          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p style="margin-top: 4px; font-size: 10px;">Conserve este comprovante</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `)

  janela.document.close()
}
