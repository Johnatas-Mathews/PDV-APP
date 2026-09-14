import { supabase } from '../supabase'

// Fallback caso o banco esteja indisponível
export const DADOS_EMPRESA_PADRAO = {
  nome: 'MINHA LOJA',
  documento: '',
  endereco: '',
  cidadeUf: '',
  telefone: '',
  instagram: '',
  mensagemCupom: 'Obrigado pela preferência! Volte sempre.'
}

export const DADOS_EMPRESA = DADOS_EMPRESA_PADRAO

export const formatarIdVenda = (id) => {
  return String(id || 0).padStart(5, '0')
}

// Busca as configurações da loja em tempo real no Supabase
export const obterDadosEmpresaAtualizados = async () => {
  try {
    const { data } = await supabase.from('configuracoes').select('*')
    if (data && data.length > 0) {
      const mapa = {}
      data.forEach(item => { mapa[item.chave] = item.valor })

      return {
        nome: mapa['empresa_nome'] || DADOS_EMPRESA_PADRAO.nome,
        documento: mapa['empresa_documento'] || '',
        telefone: mapa['empresa_telefone'] || '',
        endereco: mapa['empresa_endereco'] || '',
        cidadeUf: mapa['empresa_cidade_uf'] || '',
        instagram: mapa['empresa_instagram'] || '',
        mensagemCupom: mapa['empresa_mensagem_cupom'] || DADOS_EMPRESA_PADRAO.mensagemCupom
      }
    }
  } catch (err) {
    console.error('Erro ao buscar dados da empresa:', err)
  }
  return DADOS_EMPRESA_PADRAO
}

// COMPROVANTE DE VENDA
export const gerarComprovanteVenda = async (venda, dadosEmpresaManual = null) => {
  const empresa = dadosEmpresaManual || await obterDadosEmpresaAtualizados()
  const dataVenda = new Date(venda.created_at || Date.now()).toLocaleString('pt-BR')
  const codVenda = formatarIdVenda(venda.id)
  const itens = Array.isArray(venda.itens) ? venda.itens : []

  const subtotalItens = itens.reduce((acc, item) => {
    const qtd = Number(item.quantidade || 1)
    const unit = Number(item.preco || 0)
    return acc + (qtd * unit)
  }, 0)

  const totalCobrado = Number(venda.total || 0)
  const valorDesconto = Math.max(0, subtotalItens - totalCobrado)

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

  const enderecoCompleto = [empresa.endereco, empresa.cidadeUf].filter(Boolean).join(' - ')

  const htmlConteudo = `
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
          .title { font-size: 16px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; }
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
            <div class="title">${empresa.nome}</div>
            ${empresa.documento ? `<div class="sub">${empresa.documento}</div>` : ''}
            ${enderecoCompleto ? `<div class="sub">${enderecoCompleto}</div>` : ''}
            ${empresa.telefone ? `<div class="sub">Tel/WhatsApp: ${empresa.telefone}</div>` : ''}
            ${empresa.instagram ? `<div class="sub">Instagram: ${empresa.instagram}</div>` : ''}
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
            <p>${empresa.mensagemCupom || 'Obrigado pela preferência!'}</p>
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
  `

  const blob = new Blob([htmlConteudo], { type: 'text/html;charset=utf-8' })
  const urlBlob = URL.createObjectURL(blob)
  const novaAba = window.open(urlBlob, '_blank')
  if (!novaAba) {
    alert('Por favor, permita pop-ups no seu navegador para abrir o comprovante em nova aba.')
  }
}

// COMPROVANTE DE CONDICIONAL (MALA DE ROUPAS)
export const gerarComprovanteCondicional = async (condicional, dadosEmpresaManual = null) => {
  const empresa = dadosEmpresaManual || await obterDadosEmpresaAtualizados()
  const codCond = formatarIdVenda(condicional.id)
  const itens = Array.isArray(condicional.itens) ? condicional.itens : []
  const dataRet = condicional.data_retirada ? new Date(`${condicional.data_retirada}T12:00:00`).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')
  const dataDev = condicional.data_devolucao_prevista ? new Date(`${condicional.data_devolucao_prevista}T12:00:00`).toLocaleDateString('pt-BR') : 'Não estipulada'

  const totalValor = itens.reduce((s, i) => s + (Number(i.quantidade || 1) * Number(i.preco || 0)), 0)
  const totalPecas = itens.reduce((s, i) => s + Number(i.quantidade || 1), 0)

  const linhasItensHtml = itens.map(item => {
    const qtd = Number(item.quantidade || 1)
    const unit = Number(item.preco || 0)
    const subt = qtd * unit
    return `
      <tr>
        <td style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">
          <div style="font-weight: 600; color: #0f172a;">${item.nomeProduto || item.nome}</div>
          <div style="font-size: 11px; color: #64748b;">${qtd} un x R$ ${unit.toFixed(2)}</div>
        </td>
        <td style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0; text-align: right; font-weight: 600; color: #0f172a; vertical-align: bottom;">
          R$ ${subt.toFixed(2)}
        </td>
      </tr>
    `
  }).join('')

  const enderecoCompleto = [empresa.endereco, empresa.cidadeUf].filter(Boolean).join(' - ')

  const htmlConteudo = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Condicional #${codCond}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif; }
          body { background: #ffffff; padding: 20px; color: #0f172a; }
          .cupom { width: 100%; max-width: 320px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px dashed #94a3b8; padding-bottom: 12px; margin-bottom: 12px; }
          .title { font-size: 16px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; }
          .badge-cond { display: inline-block; background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-top: 4px; text-transform: uppercase; }
          .sub { font-size: 11px; color: #64748b; margin-top: 3px; }
          .meta { font-size: 11px; color: #334155; margin-bottom: 12px; }
          .meta div { margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; }
          .termo { font-size: 10px; color: #475569; text-align: justify; border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; background: #f8fafc; margin-top: 14px; line-height: 1.35; }
          .assinatura { margin-top: 35px; border-top: 1px solid #0f172a; text-align: center; padding-top: 6px; font-size: 11px; font-weight: 600; color: #0f172a; }
          .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 16px; }
          @media print {
            body { padding: 0; }
            .cupom { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="cupom">
          <div class="header">
            <div class="title">${empresa.nome}</div>
            <span class="badge-cond">Retirada em Condicional</span>
            ${enderecoCompleto ? `<div class="sub">${enderecoCompleto}</div>` : ''}
            ${empresa.telefone ? `<div class="sub">WhatsApp: ${empresa.telefone}</div>` : ''}
          </div>

          <div class="meta">
            <div><strong>CONDICIONAL: #${codCond}</strong></div>
            <div>Cliente: <strong>${condicional.clientes?.nome || 'Não identificado'}</strong></div>
            ${condicional.clientes?.telefone ? `<div>WhatsApp: ${condicional.clientes.telefone}</div>` : ''}
            <div>Data Retirada: ${dataRet}</div>
            <div style="color: #b45309; font-weight: 700;">Devolução Prevista: ${dataDev}</div>
          </div>

          <table>
            ${linhasItensHtml}
          </table>

          <div style="margin-top: 12px; border-top: 1px solid #0f172a; padding-top: 8px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
            <span>Total (${totalPecas} peças):</span>
            <span>R$ ${totalValor.toFixed(2)}</span>
          </div>

          <div class="termo">
            Declaro que recebi as mercadorias descritas acima sob condição de prova/avaliação, comprometendo-me a devolver no prazo acordado as peças que não adquirir, em perfeitas condições de uso, ou efetuar o pagamento do valor correspondente.
          </div>

          <div class="assinatura">
            Assinatura do Cliente
          </div>

          <div class="footer">
            Conserve este comprovante até o acerto final
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `

  const blob = new Blob([htmlConteudo], { type: 'text/html;charset=utf-8' })
  const urlBlob = URL.createObjectURL(blob)
  const novaAba = window.open(urlBlob, '_blank')
  if (!novaAba) {
    alert('Por favor, permita pop-ups no seu navegador para abrir o comprovante em nova aba.')
  }
}
