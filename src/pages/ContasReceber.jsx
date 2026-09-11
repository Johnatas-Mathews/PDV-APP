import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Ícones SVG minimalistas nativos
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

export default function ContasReceber() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendente') // 'todas', 'pendente', 'pago'
  
  // Modais
  const [contaModalHist, setContaModalHist] = useState(null)
  const [contaModalReceber, setContaModalReceber] = useState(null)
  const [valorReceberInput, setValorReceberInput] = useState('')
  const [salvandoRecebimento, setSalvandoRecebimento] = useState(false)

  const carregarContas = async () => {
    setLoading(true)
    try {
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
    carregarContas()
  }, [filtro])

  // Abre modal de recebimento com saldo restante pré-preenchido
  const abrirModalRecebimento = (conta) => {
    const total = Number(conta.valor || 0)
    const pago = Number(conta.valor_pago || 0)
    const restante = Math.max(0, total - pago)
    setContaModalReceber(conta)
    setValorReceberInput(restante.toFixed(2))
  }

  // Executa a baixa com tratamento seguro para dados legados
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

    const historicoAtual = Array.isArray(contaModalReceber.historico_pagamentos) 
      ? [...contaModalReceber.historico_pagamentos] 
      : []

    historicoAtual.push({
      id: Date.now(),
      data: new Date().toISOString(),
      valor: numRecebido
    })

    const novoTotalPago = pagoAteAgora + numRecebido
    const novoStatus = novoTotalPago >= (total - 0.01) ? 'pago' : 'pendente'

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

      alert(novoStatus === 'pago' ? 'Conta liquidada com sucesso!' : 'Pagamento parcial registrado!')
      setContaModalReceber(null)
      setValorReceberInput('')
      await carregarContas()
    } catch (err) {
      alert('Falha ao registrar pagamento: ' + err.message)
    }

    setSalvandoRecebimento(false)
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
      await carregarContas()
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
      await carregarContas()
    } else {
      alert('Erro ao remover: ' + error.message)
    }
  }

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
        .summary-card { background: #ffffff; border: 1px solid #fed7aa; border-radius: 14px; padding: 1rem 1.5rem; display: flex; flex-direction: column; min-width: 220px; }
        .summary-card span { font-size: 0.72rem; font-weight: 700; color: #ea580c; text-transform: uppercase; letter-spacing: 0.05em; }
        .summary-card strong { font-size: 1.6rem; font-weight: 800; color: #c2410c; letter-spacing: -0.02em; }
        
        .filter-bar { display: flex; gap: 8px; margin-bottom: 1.25rem; overflow-x: auto; padding-bottom: 4px; }
        .filter-btn { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; color: #64748b; font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .filter-btn.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }
        
        /* Container responsivo com rolagem horizontal livre */
        .table-box { 
          background: #ffffff; 
          border: 1px solid #e2e8f0; 
          border-radius: 16px; 
          overflow-x: auto; 
          -webkit-overflow-scrolling: touch;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02); 
          width: 100%;
        }
        
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
        
        /* Modais Responsivos */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 1rem; }
        .modal-card { background: #ffffff; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1rem; }
        .modal-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
        .hist-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-radius: 8px; background: #f8fafc; margin-bottom: 6px; border: 1px solid #f1f5f9; gap: 8px; }
        .input-money { height: 44px; width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0 12px; font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-top: 6px; }

        @media (max-width: 768px) {
          .cr-header { flex-direction: column; align-items: stretch; }
          .summary-card { width: 100%; }
        }
      `}</style>

      <div className="cr-header">
        <div>
          <h1 className="cr-title">Contas a Receber</h1>
          <p className="cr-subtitle">Gestão de crediário, entradas e histórico de pagamentos</p>
        </div>

        <div className="summary-card">
          <span>Saldo Total em Aberto</span>
          <strong>R$ {totalEmAberto.toFixed(2)}</strong>
        </div>
      </div>

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

      <div className="table-box">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Carregando dados...</p>
        ) : contas.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Nenhum título encontrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Descrição / Venda</th>
                <th>Cliente</th>
                <th>Vencimento</th>
                <th>Valor Total</th>
                <th>Valor Pago</th>
                <th>Saldo Devedor</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contas.map(conta => {
                const total = Number(conta.valor || 0)
                const pago = Number(conta.valor_pago || 0)
                const saldo = Math.max(0, total - pago)
                const isPendente = conta.status === 'pendente'

                return (
                  <tr key={conta.id}>
                    <td><strong>{conta.descricao || `Título #${conta.id}`}</strong></td>
                    <td>
                      <div>{conta.clientes?.nome || 'Não identificado'}</div>
                      {conta.clientes?.telefone && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{conta.clientes.telefone}</span>
                      )}
                    </td>
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

      {/* MODAL 1: REGISTRAR RECEBIMENTO */}
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
              <div><strong>{contaModalReceber.descricao}</strong></div>
              <div style={{ color: '#64748b', marginTop: '3px' }}>Cliente: {contaModalReceber.clientes?.nome || 'Avulso'}</div>
              <div style={{ marginTop: '6px', color: '#c2410c', fontWeight: 700 }}>
                Saldo Devedor Atual: R$ {Math.max(0, Number(contaModalReceber.valor || 0) - Number(contaModalReceber.valor_pago || 0)).toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
                <IconCheck /> {salvandoRecebimento ? 'Salvando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HISTÓRICO E AJUSTES DE PAGAMENTOS */}
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
              <div><strong>{contaModalHist.descricao}</strong></div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>Cliente: {contaModalHist.clientes?.nome || 'Avulso'}</div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '6px', flexWrap: 'wrap' }}>
                <span>Total: <strong>R$ {Number(contaModalHist.valor).toFixed(2)}</strong></span>
                <span>Pago: <strong style={{ color: '#16a34a' }}>R$ {Number(contaModalHist.valor_pago || 0).toFixed(2)}</strong></span>
                <span>Restante: <strong style={{ color: '#ea580c' }}>R$ {Math.max(0, Number(contaModalHist.valor) - Number(contaModalHist.valor_pago || 0)).toFixed(2)}</strong></span>
              </div>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '1rem' }}>
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
                      </span>
                      <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>
                        R$ {Number(item.valor).toFixed(2)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
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
