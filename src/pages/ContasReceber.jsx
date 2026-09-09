import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { gerarReciboPagamento, formatarIdRecibo } from '../utils/pdfGenerator'
import '../styles/pages.css'

export default function ContasReceber() {
  const [contas, setContas] = useState([])
  const [filtro, setFiltro] = useState('pendente')
  const [carregando, setCarregando] = useState(true)

  const [contaSelecionada, setContaSelecionada] = useState(null)
  const [valorBaixa, setValorBaixa] = useState('')
  const [processando, setProcessando] = useState(false)

  const carregarContas = async () => {
    setCarregando(true)
    const { data, error } = await supabase
      .from('contas_a_receber')
      .select('*, clientes(nome, telefone)')
      .order('id', { ascending: false })

    if (error) {
      console.error('Erro ao buscar contas:', error)
    } else {
      setContas(data || [])
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregarContas()
  }, [])

  const iniciarRecebimento = (conta) => {
    const totalOriginal = Number(conta.valor) || 0
    const jaPago = Number(conta.valor_pago) || 0
    const saldoRestante = Math.max(0, totalOriginal - jaPago)

    setContaSelecionada(conta)
    setValorBaixa(saldoRestante.toFixed(2))
  }

  const confirmarBaixa = async () => {
    if (!contaSelecionada) return

    const valorInformado = parseFloat(valorBaixa)
    const totalOriginal = Number(contaSelecionada.valor) || 0
    const jaPago = Number(contaSelecionada.valor_pago) || 0
    const saldoDevedor = totalOriginal - jaPago

    if (isNaN(valorInformado) || valorInformado <= 0) {
      alert('Informe um valor de pagamento válido!')
      return
    }

    if (valorInformado > saldoDevedor + 0.01) {
      alert(`O valor informado (R$ ${valorInformado.toFixed(2)}) é maior que o saldo restante (R$ ${saldoDevedor.toFixed(2)})!`)
      return
    }

    setProcessando(true)

    const novoValorPago = jaPago + valorInformado
    const quitado = novoValorPago >= (totalOriginal - 0.009)
    const novoStatus = quitado ? 'pago' : 'parcial'

    const { error } = await supabase
      .from('contas_a_receber')
      .update({
        valor_pago: novoValorPago,
        status: novoStatus,
        data_pagamento: quitado ? new Date().toISOString() : contaSelecionada.data_pagamento
      })
      .eq('id', contaSelecionada.id)

    if (error) {
      alert('Erro ao registrar pagamento: ' + error.message)
    } else {
      // Pergunta se deseja emitir o PDF do recibo
      if (confirm('Pagamento gravado com sucesso! Deseja gerar o Recibo em PDF?')) {
        gerarReciboPagamento(
          { ...contaSelecionada, valor_pago: novoValorPago },
          valorInformado
        )
      }

      setContaSelecionada(null)
      setValorBaixa('')
      await carregarContas()
    }

    setProcessando(false)
  }

  const deletar = async (id) => {
    if (confirm('Tem certeza que deseja deletar esta cobrança?')) {
      const { error } = await supabase
        .from('contas_a_receber')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Erro ao deletar conta: ' + error.message)
      } else {
        await carregarContas()
      }
    }
  }

  const contasFiltradas = contas.filter(c => {
    const status = c.status || (c.pago ? 'pago' : 'pendente')
    if (filtro === 'pendente') return status === 'pendente'
    if (filtro === 'parcial') return status === 'parcial'
    if (filtro === 'pago') return status === 'pago'
    return true
  })

  const totalPendente = contas.reduce((sum, c) => {
    const status = c.status || (c.pago ? 'pago' : 'pendente')
    if (status === 'pago') return sum
    const total = Number(c.valor) || 0
    const pago = Number(c.valor_pago) || 0
    return sum + (total - pago)
  }, 0)

  const totalRecebido = contas.reduce((sum, c) => {
    return sum + (Number(c.valor_pago) || (c.pago ? Number(c.valor) : 0))
  }, 0)

  const qtdEmAberto = contas.filter(c => {
    const status = c.status || (c.pago ? 'pago' : 'pendente')
    return status !== 'pago'
  }).length

  return (
    <div>
      <h1 className="page-title">Contas a Receber</h1>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <p className="metric-label">Saldo a Receber</p>
            <p className="metric-value" style={{ color: '#ef4444' }}>
              R$ {totalPendente.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <p className="metric-label">Total Já Recebido</p>
            <p className="metric-value" style={{ color: '#10b981' }}>
              R$ {totalRecebido.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <p className="metric-label">Títulos em Aberto</p>
            <p className="metric-value">{qtdEmAberto}</p>
          </div>
        </div>
      </div>

      {contaSelecionada && (
        <div className="form-container" style={{ border: '2px solid #10b981', marginBottom: '2rem' }}>
          <div className="form-section">
            <h2>Registrar Pagamento — {formatarIdRecibo(contaSelecionada.id)}</h2>
            <p style={{ margin: '8px 0', color: '#4b5563', lineHeight: '1.6' }}>
              <strong>Cliente:</strong> {contaSelecionada.clientes?.nome || contaSelecionada.descricao || 'Cliente Avulso'} <br />
              <strong>Valor Original:</strong> R$ {Number(contaSelecionada.valor).toFixed(2)} <br />
              <strong>Já Pago:</strong> R$ {Number(contaSelecionada.valor_pago || 0).toFixed(2)} <br />
              <strong>Saldo Restante:</strong> R$ {(Number(contaSelecionada.valor) - Number(contaSelecionada.valor_pago || 0)).toFixed(2)}
            </p>

            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label>Valor sendo recebido agora (R$):</label>
              <input
                type="number"
                step="0.01"
                value={valorBaixa}
                onChange={(e) => setValorBaixa(e.target.value)}
              />
            </div>

            <div className="form-buttons">
              <button className="btn btn-success" onClick={confirmarBaixa} disabled={processando}>
                {processando ? 'Gravando...' : 'Confirmar e Gerar Recibo'}
              </button>
              <button className="btn btn-secondary" onClick={() => setContaSelecionada(null)} disabled={processando}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <h2>Filtrar Títulos</h2>
        <div className="filter-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem' }}>
          <button 
            className={`btn ${filtro === 'pendente' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltro('pendente')}
          >
            Pendentes
          </button>
          <button 
            className={`btn ${filtro === 'parcial' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltro('parcial')}
          >
            Parciais
          </button>
          <button 
            className={`btn ${filtro === 'pago' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltro('pago')}
          >
            Pagos
          </button>
          <button 
            className={`btn ${filtro === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltro('todos')}
          >
            Todos ({contas.length})
          </button>
        </div>

        {carregando ? (
          <p>Carregando títulos...</p>
        ) : contasFiltradas.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Cód. Recibo</th>
                <th>Cliente / Descrição</th>
                <th>Valor Total</th>
                <th>Recebido</th>
                <th>Saldo Aberto</th>
                <th>Status</th>
                <th>Ações / Recibo</th>
              </tr>
            </thead>
            <tbody>
              {contasFiltradas.map(conta => {
                const total = Number(conta.valor) || 0
                const recebido = Number(conta.valor_pago) || (conta.pago ? total : 0)
                const saldo = Math.max(0, total - recebido)
                const status = conta.status || (conta.pago ? 'pago' : 'pendente')
                const codigoRecibo = formatarIdRecibo(conta.id)

                return (
                  <tr key={conta.id}>
                    <td><strong>{codigoRecibo}</strong></td>
                    <td>{conta.clientes?.nome || conta.descricao || 'Cliente Avulso'}</td>
                    <td>R$ {total.toFixed(2)}</td>
                    <td style={{ color: '#10b981' }}>R$ {recebido.toFixed(2)}</td>
                    <td style={{ color: saldo > 0 ? '#ef4444' : '#6b7280', fontWeight: saldo > 0 ? 'bold' : 'normal' }}>
                      R$ {saldo.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge badge-${status === 'pago' ? 'success' : status === 'parcial' ? 'info' : 'warning'}`}>
                        {status === 'pago' ? 'Quitado' : status === 'parcial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {status !== 'pago' && (
                          <button 
                            className="btn btn-sm btn-success" 
                            onClick={() => iniciarRecebimento(conta)}
                          >
                            Receber
                          </button>
                        )}
                        {recebido > 0 && (
                          <button 
                            className="btn btn-sm btn-primary" 
                            onClick={() => gerarReciboPagamento(conta, recebido)}
                          >
                            📄 Recibo
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => deletar(conta.id)}>
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>Nenhuma conta encontrada.</p>
          </div>
        )}
      </div>
    </div>
  )
}
