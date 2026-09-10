import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Ícones SVG minimalistas nativos (sem risco de quebra de build)
const IconTruck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-4v10" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
  </svg>
)

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
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

export default function Compras() {
  const [produtos, setProdutos] = useState([])
  const [compras, setCompras] = useState([])
  
  const [fornecedor, setFornecedor] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('dinheiro')
  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [custoUnitario, setCustoUnitario] = useState('')
  const [itensCompra, setItensCompra] = useState([])
  const [salvando, setSalvando] = useState(false)

  const carregarDados = async () => {
    const { data: prodData } = await supabase
      .from('produtos')
      .select('*')
      .order('nome')

    const { data: compData } = await supabase
      .from('compras')
      .select('*')
      .order('id', { ascending: false })
      .limit(10)

    if (prodData) setProdutos(prodData)
    if (compData) setCompras(compData)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleSelectProduto = (id) => {
    setProdutoSelecionado(id)
    const prod = produtos.find(p => p.id === parseInt(id))
    if (prod) {
      setCustoUnitario(prod.preco_custo ? String(prod.preco_custo) : '')
    }
  }

  const adicionarItem = () => {
    if (!produtoSelecionado || !quantidade || !custoUnitario) {
      alert('Selecione o produto, informe a quantidade e o custo unitário.')
      return
    }

    const prod = produtos.find(p => p.id === parseInt(produtoSelecionado))
    if (!prod) return

    const qtd = parseInt(quantidade)
    const custo = parseFloat(custoUnitario.replace(',', '.'))

    if (qtd <= 0 || isNaN(custo) || custo < 0) {
      alert('Informe valores válidos.')
      return
    }

    const itemExistente = itensCompra.find(i => i.produtoId === prod.id)
    if (itemExistente) {
      setItensCompra(itensCompra.map(item => 
        item.produtoId === prod.id
          ? {
              ...item,
              quantidade: item.quantidade + qtd,
              custoUnitario: custo,
              subtotal: (item.quantidade + qtd) * custo
            }
          : item
      ))
    } else {
      const novoItem = {
        id: Date.now(),
        produtoId: prod.id,
        nome: prod.nome,
        quantidade: qtd,
        custoUnitario: custo,
        subtotal: qtd * custo
      }
      setItensCompra([...itensCompra, novoItem])
    }

    setProdutoSelecionado('')
    setQuantidade('1')
    setCustoUnitario('')
  }

  const removerItem = (id) => {
    setItensCompra(itensCompra.filter(item => item.id !== id))
  }

  const totalCompra = itensCompra.reduce((acc, i) => acc + i.subtotal, 0)

  const finalizarCompra = async () => {
    if (itensCompra.length === 0) {
      alert('Adicione ao menos um produto para repor o estoque.')
      return
    }

    setSalvando(true)

    try {
      // 1. Grava a compra no Supabase
      const { error: erroCompra } = await supabase
        .from('compras')
        .insert([
          {
            fornecedor: fornecedor.trim() || 'Fornecedor Avulso',
            total: totalCompra,
            forma_pagamento: formaPagamento,
            itens: itensCompra
          }
        ])

      if (erroCompra) throw erroCompra

      // 2. Repõe o estoque e atualiza o preço de custo unitário em cada produto
      for (const item of itensCompra) {
        const prod = produtos.find(p => p.id === item.produtoId)
        if (prod) {
          const novoEstoque = (prod.estoque || 0) + item.quantidade
          await supabase
            .from('produtos')
            .update({
              estoque: novoEstoque,
              preco_custo: item.custoUnitario
            })
            .eq('id', item.produtoId)
        }
      }

      alert('Reposição concluída! O estoque e os custos dos produtos foram atualizados.')
      setItensCompra([])
      setFornecedor('')
      await carregarDados()
    } catch (err) {
      alert('Erro ao registrar reposição: ' + err.message)
    }

    setSalvando(false)
  }

  return (
    <div className="compras-wrapper">
      <style>{`
        .compras-wrapper { max-width: 1200px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .page-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
        .card-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 1.5rem; }
        .card-box h2 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem; }
        .form-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .form-group { display: flex; flex-direction: column; flex: 1; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
        .form-group input, .form-group select { height: 42px; padding: 0 0.85rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff; color: #0f172a; font-size: 0.95rem; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #2563eb; }
        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; padding: 0.65rem 1.25rem; font-size: 0.9rem; transition: all 0.15s ease; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-success { background: #10b981; color: #ffffff; }
        .btn-success:hover { background: #059669; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; border-radius: 6px; }
        .btn-lg { padding: 0.85rem 1.75rem; font-size: 1.05rem; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 1rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }
        .badge-info { display: inline-flex; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #e0f2fe; color: #0369a1; }
        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 0.75rem; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Compras & Reposição de Estoque</h1>
        <p className="page-subtitle">Dê entrada em lotes de produtos, renove o estoque e mantenha o custo atualizado</p>
      </div>

      <div className="card-box">
        <h2>Dados da Nota / Pedido</h2>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Fornecedor / Distribuidor</label>
            <input 
              type="text" 
              placeholder="Ex: Distribuidora Central, Atacadão, etc."
              value={fornecedor}
              onChange={e => setFornecedor(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label>Forma de Pagamento</label>
            <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="boleto">Boleto / A Prazo</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>
        </div>

        <h2 style={{ marginTop: '1.25rem' }}>Adicionar Produtos ao Lote</h2>
        <div className="form-row">
          <div className="form-group" style={{ flex: 3 }}>
            <label>Produto</label>
            <select value={produtoSelecionado} onChange={e => handleSelectProduto(e.target.value)}>
              <option value="">Selecione o produto</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Estoque atual: {p.estoque || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label>Qtd Entrada</label>
            <input 
              type="number" 
              min="1" 
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: 1.2 }}>
            <label>Novo Custo Unit. (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="0,00"
              value={custoUnitario}
              onChange={e => setCustoUnitario(e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={adicionarItem} style={{ gap: '6px' }}>
          <IconPlus /> Adicionar ao Lote
        </button>
      </div>

      {itensCompra.length > 0 && (
        <div className="card-box">
          <h2>Produtos do Lote Atual</h2>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th style={{ textAlign: 'center' }}>Qtd Entrada</th>
                <th>Custo Unitário</th>
                <th>Subtotal</th>
                <th style={{ textAlign: 'center' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {itensCompra.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.nome}</strong></td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>+{item.quantidade} un</span>
                  </td>
                  <td>R$ {item.custoUnitario.toFixed(2)}</td>
                  <td>R$ {item.subtotal.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-sm btn-danger" onClick={() => removerItem(item.id)}>
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.9rem', display: 'block' }}>Custo Total da Entrada:</span>
              <strong style={{ fontSize: '1.75rem', color: '#0f172a' }}>R$ {totalCompra.toFixed(2)}</strong>
            </div>

            <button 
              className="btn btn-success btn-lg" 
              onClick={finalizarCompra} 
              disabled={salvando}
              style={{ gap: '8px' }}
            >
              <IconCheck /> {salvando ? 'Processando Entrada...' : 'Confirmar Reposição de Estoque'}
            </button>
          </div>
        </div>
      )}

      {compras.length > 0 && (
        <div className="card-box">
          <h2>Histórico Recente de Entradas</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Fornecedor</th>
                <th>Pagamento</th>
                <th>Total Pago</th>
                <th>Resumo dos Itens</th>
              </tr>
            </thead>
            <tbody>
              {compras.map(compra => (
                <tr key={compra.id}>
                  <td><strong>#{compra.id}</strong></td>
                  <td>{new Date(compra.created_at).toLocaleDateString('pt-BR')}</td>
                  <td><strong>{compra.fornecedor}</strong></td>
                  <td><span className="badge-info">{compra.forma_pagamento?.toUpperCase()}</span></td>
                  <td>R$ {Number(compra.total).toFixed(2)}</td>
                  <td style={{ color: '#64748b' }}>
                    {Array.isArray(compra.itens) 
                      ? compra.itens.map(i => `${i.nome} (+${i.quantidade})`).join(', ') 
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
