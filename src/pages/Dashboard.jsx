import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

const IconTarget = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)

const IconTrendingUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)

const IconDollar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const IconShoppingBag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

export default function Dashboard() {
  const { operador } = useAuth()
  const [loading, setLoading] = useState(true)

  // Metas e Faturamento
  const [metaMensal, setMetaMensal] = useState(30000)
  const [faturamentoMes, setFaturamentoMes] = useState(0)
  const [faturamentoHoje, setFaturamentoHoje] = useState(0)
  const [pedidosMes, setPedidosMes] = useState(0)
  const [ticketMedioMes, setTicketMedioMes] = useState(0)

  // Modal para Ajustar Meta
  const [modalMetaAberto, setModalMetaAberto] = useState(false)
  const [novaMetaInput, setNovaMetaInput] = useState('')
  const [salvandoMeta, setSalvandoMeta] = useState(false)

  // Vendas recentes
  const [ultimasVendas, setUltimasVendas] = useState([])

  const carregarDashboard = async () => {
    setLoading(true)
    try {
      const agora = new Date()
      const anoAtual = agora.getFullYear()
      const mesAtual = agora.getMonth()

      // 1. Início e fim do mês atual
      const inicioMes = new Date(anoAtual, mesAtual, 1).toISOString()
      const fimMes = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59, 999).toISOString()

      // 2. Início de hoje
      const anoStr = agora.getFullYear()
      const mesStr = String(agora.getMonth() + 1).padStart(2, '0')
      const diaStr = String(agora.getDate()).padStart(2, '0')
      const inicioHoje = new Date(`${anoStr}-${mesStr}-${diaStr}T00:00:00`).toISOString()

      // 3. Buscar meta das configurações
      const { data: cfgData } = await supabase.from('configuracoes').select('*').eq('chave', 'meta_vendas_mes').maybeSingle()
      if (cfgData && cfgData.valor) {
        const metaSalva = parseFloat(cfgData.valor)
        if (!isNaN(metaSalva) && metaSalva > 0) setMetaMensal(metaSalva)
      }

      // 4. Buscar vendas do mês
      const { data: vendasData, error: errVendas } = await supabase
        .from('vendas')
        .select('*, clientes(nome)')
        .gte('created_at', inicioMes)
        .lte('created_at', fimMes)
        .order('created_at', { ascending: false })

      if (errVendas) throw errVendas

      if (vendasData) {
        let somaMes = 0
        let somaHoje = 0

        vendasData.forEach(v => {
          const tot = Number(v.total || 0)
          somaMes += tot
          if (new Date(v.created_at) >= new Date(inicioHoje)) {
            somaHoje += tot
          }
        })

        setFaturamentoMes(somaMes)
        setFaturamentoHoje(somaHoje)
        setPedidosMes(vendasData.length)
        setTicketMedioMes(vendasData.length > 0 ? somaMes / vendasData.length : 0)
        setUltimasVendas(vendasData.slice(0, 6))
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarDashboard()
  }, [])

  // Salvar nova meta no Supabase
  const salvarNovaMeta = async (e) => {
    e.preventDefault()
    const valorNum = parseFloat(String(novaMetaInput).replace(',', '.'))
    if (isNaN(valorNum) || valorNum <= 0) {
      return alert('Informe um valor de meta válido e maior que zero.')
    }

    setSalvandoMeta(true)
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({ chave: 'meta_vendas_mes', valor: String(valorNum) }, { onConflict: 'chave' })

      if (error) throw error

      setMetaMensal(valorNum)
      setModalMetaAberto(false)
      setNovaMetaInput('')
      alert(`Meta mensal atualizada para R$ ${valorNum.toFixed(2)} com sucesso!`)
    } catch (err) {
      alert('Erro ao salvar meta: ' + err.message)
    }
    setSalvandoMeta(false)
  }

  // Cálculos da Meta
  const percentualAtingido = metaMensal > 0 ? Math.min(100, (faturamentoMes / metaMensal) * 100) : 0
  const percentualReal = metaMensal > 0 ? (faturamentoMes / metaMensal) * 100 : 0
  const valorRestante = Math.max(0, metaMensal - faturamentoMes)

  // Dias restantes no mês
  const agora = new Date()
  const ultimoDiaMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate()
  const diasRestantes = Math.max(1, ultimoDiaMes - agora.getDate())
  const mediaDiariaNecessaria = valorRestante / diasRestantes

  return (
    <div className="dash-wrapper">
      <style>{`
        .dash-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .dash-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
        .dash-sub { color: #64748b; font-size: 0.875rem; margin-top: 4px; }

        /* CARD DA META DE VENDAS COM BARRA */
        .meta-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 1.5rem 1.75rem;
          box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.05);
          margin-bottom: 1.5rem;
        }

        .meta-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 10px;
        }

        .meta-title-group { display: flex; align-items: center; gap: 10px; }
        .meta-tag { background: #eff6ff; color: #2563eb; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 8px; border: 1px solid #bfdbfe; }
        
        .btn-edit-meta {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .btn-edit-meta:hover { background: #f1f5f9; color: #2563eb; border-color: #93c5fd; }

        .meta-values-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
          gap: 8px;
        }
        .meta-num-atual { font-size: 2rem; font-weight: 900; color: #0f172a; }
        .meta-num-total { font-size: 1.1rem; color: #64748b; font-weight: 600; }
        .meta-percent-badge {
          font-size: 1.1rem;
          font-weight: 800;
          color: ${percentualReal >= 100 ? '#16a34a' : '#2563eb'};
        }

        /* TRILHA E PREENCHIMENTO DA BARRA */
        .progress-track {
          width: 100%;
          height: 18px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
        }

        .progress-fill {
          height: 100%;
          background: ${percentualReal >= 100 
            ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' 
            : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'};
          border-radius: 999px;
          width: ${percentualAtingido}%;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .meta-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          font-size: 0.82rem;
          color: #64748b;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* GRID DE KPIS */
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .kpi-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .kpi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .kpi-title { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
        .kpi-val { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-top: 4px; display: block; }
        .kpi-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

        /* ULTIMAS VENDAS */
        .card-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .card-box h2 { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #f8fafc; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; }
        td { padding: 0.85rem 1rem; font-size: 0.88rem; color: #0f172a; border-bottom: 1px solid #e2e8f0; }

        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 1rem; }
        .modal-card { background: #ffffff; width: 100%; max-width: 420px; border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }

        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns: 1fr; }
          .meta-values-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard Geral</h1>
          <p className="dash-sub">
            Olá, <strong>{operador?.nome || 'Operador'}</strong>! Acompanhe o desempenho da loja no mês.
          </p>
        </div>
      </div>

      {/* BARRA DE PROGRESSO - META DE VENDAS DO MÊS */}
      <div className="meta-card">
        <div className="meta-top-row">
          <div className="meta-title-group">
            <IconTarget />
            <strong style={{ color: '#0f172a', fontSize: '1rem' }}>Meta de Vendas da Loja</strong>
            <span className="meta-tag">Mês de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</span>
          </div>

          <button 
            type="button" 
            className="btn-edit-meta"
            onClick={() => {
              setNovaMetaInput(String(metaMensal))
              setModalMetaAberto(true)
            }}
          >
            <IconEdit /> Ajustar Meta
          </button>
        </div>

        <div className="meta-values-row">
          <div>
            <span className="meta-num-atual">R$ {faturamentoMes.toFixed(2)}</span>
            <span className="meta-num-total"> / R$ {metaMensal.toFixed(2)}</span>
          </div>
          <span className="meta-percent-badge">
            {percentualReal.toFixed(1)}% {percentualReal >= 100 ? '🎉 BATEU A META!' : 'atingido'}
          </span>
        </div>

        {/* BARRA VISUAL */}
        <div className="progress-track" title={`${percentualReal.toFixed(1)}% concluído`}>
          <div className="progress-fill" />
        </div>

        <div className="meta-footer-row">
          <span>
            {percentualReal >= 100 ? (
              <strong style={{ color: '#16a34a' }}>Sensacional! Vocês superaram a meta estipulada em R$ {(faturamentoMes - metaMensal).toFixed(2)}!</strong>
            ) : (
              <>Faltam <strong>R$ {valorRestante.toFixed(2)}</strong> para atingir os 100%.</>
            )}
          </span>

          {percentualReal < 100 && (
            <span>
              Ritmo necessário: <strong>R$ {mediaDiariaNecessaria.toFixed(2)}/dia</strong> ({diasRestantes} dias restantes).
            </span>
          )}
        </div>
      </div>

      {/* CARDS DE INDICADORES RÁPIDOS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Vendido Hoje</span>
            <IconTrendingUp />
          </div>
          <span className="kpi-val" style={{ color: '#16a34a' }}>R$ {faturamentoHoje.toFixed(2)}</span>
          <span className="kpi-sub">Faturamento do dia atual</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Faturamento no Mês</span>
            <IconDollar />
          </div>
          <span className="kpi-val" style={{ color: '#2563eb' }}>R$ {faturamentoMes.toFixed(2)}</span>
          <span className="kpi-sub">Total acumulado do mês</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Pedidos Concluídos</span>
            <IconShoppingBag />
          </div>
          <span className="kpi-val">{pedidosMes}</span>
          <span className="kpi-sub">Vendas realizadas no mês</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Ticket Médio</span>
            <IconTarget />
          </div>
          <span className="kpi-val" style={{ color: '#7c3aed' }}>R$ {ticketMedioMes.toFixed(2)}</span>
          <span className="kpi-sub">Valor médio por compra</span>
        </div>
      </div>

      {/* ÚLTIMAS VENDAS */}
      <div className="card-box">
        <h2>Últimas Vendas Realizadas</h2>
        {ultimasVendas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Nenhuma venda registrada neste mês ainda.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Cliente</th>
                  <th>Forma Pagamento</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {ultimasVendas.map(v => (
                  <tr key={v.id}>
                    <td>{new Date(v.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td><strong>{v.clientes?.nome || 'Cliente Avulso'}</strong></td>
                    <td><span style={{ textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: 600 }}>{v.forma_pagamento}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>R$ {Number(v.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO DA META */}
      {modalMetaAberto && (
        <div className="modal-overlay" onClick={() => setModalMetaAberto(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '6px' }}>
              🎯 Definir Meta de Vendas do Mês
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Defina o objetivo financeiro da loja para o mês atual. A barra de progresso calculará o avanço em tempo real.
            </p>

            <form onSubmit={salvarNovaMeta}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Valor da Meta (R$)
                </label>
                <input 
                  type="number" 
                  step="100"
                  min="1"
                  value={novaMetaInput}
                  onChange={e => setNovaMetaInput(e.target.value)}
                  placeholder="Ex: 35000"
                  style={{ width: '100%', height: '42px', padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, boxSizing: 'border-box', outline: 'none' }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setModalMetaAberto(false)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={salvandoMeta}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {salvandoMeta ? 'Salvando...' : 'Salvar Nova Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
