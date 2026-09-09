import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Ícones SVG minimalistas nativos
const IconReceipt = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 17V7" />
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

export default function ContasReceber() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendente') // 'todas', 'pendente', 'pago'

  const carregarContas = async () => {
    setLoading(true)
    let query = supabase
      .from('contas_a_receber')
      .select('*, clientes(nome, telefone)')
      .order('vencimento', { ascending: true })

    if (filtro !== 'todas') {
      query = query.eq('status', filtro)
    }

    const { data, error } = await query

    if (!error && data) {
      setContas(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarContas()
  }, [filtro])

  // Função para dar baixa total ou parcial
  const registrarPagamento = async (conta) => {
    const total = Number(conta.valor || 0)
    const pagoAteAgora = Number(conta.valor_pago || 0)
    const saldoRestante = Math.max(0, total - pagoAteAgora)

    const valorInformado = prompt(
      `Recebimento de: ${conta.clientes?.nome || 'Cliente'}\n` +
      `Total Original: R$ ${total.toFixed(2)}\n` +
      `Já Pago: R$ ${pagoAteAgora.toFixed(2)}\n` +
      `Saldo Devedor Atual: R$ ${saldoRestante.toFixed(2)}\n\n` +
      `Quanto o cliente está pagando agora?`,
      saldoRestante.toFixed(2)
    )

    if (valorInformado === null) return

    const numRecebido = parseFloat(valorInformado.replace(',', '.'))

    if (isNaN(numRecebido) || numRecebido <= 0) {
      alert('Informe um valor válido.')
      return
    }

    if (numRecebido > saldoRestante) {
      alert(`O valor informado (R$ ${numRecebido.toFixed(2)}) é maior que a dívida restante!`)
      return
    }

    const novoTotalPago = pagoAteAgora + numRecebido
    const novoStatus = novoTotalPago >= total ? 'pago' : 'pendente'

    const { error } = await supabase
      .from('contas_a_receber')
      .update({
        valor_pago: novoTotalPago,
        status: novoStatus
      })
      .eq('id', conta.id)

    if (error) {
      alert('Erro ao registrar pagamento: ' + error.message)
    } else {
      alert(novoStatus === 'pago' ? 'Conta liquidada com sucesso!' : 'Pagamento parcial registrado!')
      carregarContas()
    }
  }

  const totalEmAberto = contas
    .filter(c => c.status === 'pendente')
    .reduce((sum, c) => sum + (Number(c.valor || 0) - Number(c.valor_pago || 0)), 0)

  return (
    <div className="cr-wrapper">
      <style>{`
        .cr-wrapper { max-width: 1200px; margin: 0 auto; }
        .cr-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .cr-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .cr-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 4px; }
        .summary-card { background: #ffffff; border: 1px solid #fed7aa; border-radius: 14px; padding: 1rem 1.5rem; display: flex; flex-direction: column; }
        .summary-card span { font-size: 0.72rem; font-weight: 700; color: #ea580c; text-transform: uppercase; letter-spacing: 0.05em; }
        .summary-card strong { font-size: 1.6rem; font-weight: 800; color: #c2410c; letter-spacing: -0.02em; }
        .filter-bar { display: flex; gap: 8px; margin-bottom: 1.25rem; }
        .filter-btn { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; color: #64748b; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
        .filter-btn.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }
        .table-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1.25rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 1rem 1.25rem; font-size: 0.9rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tbody tr:hover { background: #f8fafc; }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-pendente { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
        .badge-pago { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
        .btn-action { display: inline-flex; align-items: center; gap: 4px; padding: 0.4rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; background: #2563eb; color: #ffffff; }
        .btn-action:hover { background: #1d4ed8; }
      `}</style>

      <div className="cr-header">
        <div>
          <h1 className="cr-title">Contas a Receber</h1>
          <p className="cr-subtitle">Gestão de crediário, entradas e quitação de vendas a prazo</p>
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
                <th style={{ textAlign: 'center' }}>Ação</th>
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
                    <td style={{ color: pago > 0 ? '#16a34a' : '#64748b' }}>
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
                      {isPendente && (
                        <button className="btn-action" onClick={() => registrarPagamento(conta)}>
                          <IconCheck /> Receber
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
