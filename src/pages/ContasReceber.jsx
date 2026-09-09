import { useState, useEffect } from 'react'
import '../styles/pages.css'

export default function ContasReceber() {
  const [contas, setContas] = useState([])
  const [filtro, setFiltro] = useState('pendente') // pendente, pago, todos

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem('pdv_contas') || '[]')
    setContas(dados)
  }, [])

  const marcarComoPago = (id) => {
    const novaLista = contas.map(c => 
      c.id === id ? { ...c, pago: true, dataPagamento: new Date().toLocaleDateString('pt-BR') } : c
    )
    setContas(novaLista)
    localStorage.setItem('pdv_contas', JSON.stringify(novaLista))
  }

  const deletar = (id) => {
    if (confirm('Tem certeza que deseja deletar esta conta?')) {
      const novaLista = contas.filter(c => c.id !== id)
      setContas(novaLista)
      localStorage.setItem('pdv_contas', JSON.stringify(novaLista))
    }
  }

  const contasFiltradas = contas.filter(c => {
    if (filtro === 'pendente') return !c.pago
    if (filtro === 'pago') return c.pago
    return true
  })

  const totalPendente = contas.filter(c => !c.pago).reduce((sum, c) => sum + c.valor, 0)
  const totalRecebido = contas.filter(c => c.pago).reduce((sum, c) => sum + c.valor, 0)

  return (
    <div>
      <h1 className="page-title">Contas a Receber</h1>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <p className="metric-label">Total a Receber</p>
            <p className="metric-value">R$ {totalPendente.toFixed(2)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <p className="metric-label">Total Recebido</p>
            <p className="metric-value">R$ {totalRecebido.toFixed(2)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <p className="metric-label">Contas Pendentes</p>
            <p className="metric-value">{contas.filter(c => !c.pago).length}</p>
          </div>
        </div>
      </div>

      {contas.length > 0 && (
        <div className="table-container">
          <h2>Filtrar</h2>
          <div className="filter-buttons">
            <button 
              className={`btn ${filtro === 'pendente' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltro('pendente')}
            >
              Pendentes ({contas.filter(c => !c.pago).length})
            </button>
            <button 
              className={`btn ${filtro === 'pago' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltro('pago')}
            >
              Pagos ({contas.filter(c => c.pago).length})
            </button>
            <button 
              className={`btn ${filtro === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltro('todos')}
            >
              Todos ({contas.length})
            </button>
          </div>

          <h2 style={{ marginTop: '2rem' }}>Contas ({contasFiltradas.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Data Prazo</th>
                <th>Status</th>
                <th>Data Pagamento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contasFiltradas.map(conta => (
                <tr key={conta.id}>
                  <td>{conta.cliente}</td>
                  <td>R$ {conta.valor.toFixed(2)}</td>
                  <td>{conta.dataPrazo}</td>
                  <td>
                    <span className={`badge badge-${conta.pago ? 'success' : 'warning'}`}>
                      {conta.pago ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td>{conta.dataPagamento || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      {!conta.pago && (
                        <button 
                          className="btn btn-sm btn-success" 
                          onClick={() => marcarComoPago(conta.id)}
                        >
                          Marcar Pago
                        </button>
                      )}
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => deletar(conta.id)}
                      >
                        Deletar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {contas.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma conta a receber cadastrada</p>
        </div>
      )}
    </div>
  )
}
